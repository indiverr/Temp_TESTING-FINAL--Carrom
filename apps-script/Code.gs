/**
 * Carrom Lottery Ticket Supply Management Platform
 * Google Apps Script Backend for First-Login Email OTP Verification (Spark Plan Compatible)
 *
 * Permanent Sender Account: carromlotterydesk@gmail.com
 * Target Firebase Project:  carrom-df56a
 *
 * Required Script Properties (Project Settings -> Script Properties):
 * 1. FIREBASE_PROJECT_ID           = carrom-df56a
 * 2. FIREBASE_WEB_API_KEY          = <Firebase Web App API Key for carrom-df56a>
 * 3. FIREBASE_SERVICE_ACCOUNT_JSON = <Full JSON string of Firebase Admin Service Account key>
 */

var OTP_SENDER_EMAIL = 'carromlotterydesk@gmail.com';
var OTP_RECIPIENT_EMAIL = 'carromlotterydesk@gmail.com';
var EXPECTED_PROJECT_ID = 'carrom-df56a';
var OTP_EXPIRY_MS = 5 * 60 * 1000;          // 5 minutes
var OTP_RESEND_COOLDOWN_MS = 60 * 1000;     // 60 seconds
var OTP_MAX_ATTEMPTS = 5;                   // Max 5 wrong guesses per OTP
var OTP_MAX_SENDS_PER_HOUR = 5;             // Max 5 OTP emails per hour per user
var ONE_HOUR_MS = 60 * 60 * 1000;
var TICKET_LOCK_DURATION_MS = 120 * 1000;    // 120-second (2-minute) real-time ticket lock duration (server clock is authoritative)
var CUSTOMER_CODE_BASE = 5315;               // First customer serial code starts at #5316
var ALLOWED_ROLES = { admin: true, paid_employee: true, employee: true };

/**
 * Public Health Check Endpoint (GET)
 * Exposes zero secrets, keys, emails, or internal property values.
 */
function doGet() {
  try {
    var effectiveEmail = String(Session.getEffectiveUser().getEmail() || '').trim().toLowerCase();
    var projectId = getProjectId_();
    var sa = getValidatedServiceAccount_();
    var hasWebApiKey = Boolean(getWebApiKey_());

    var isReady =
      effectiveEmail === OTP_SENDER_EMAIL &&
      projectId === EXPECTED_PROJECT_ID &&
      sa.project_id === EXPECTED_PROJECT_ID &&
      hasWebApiKey;

    return jsonResponse_({
      ok: isReady,
      service: 'Carrom First-Login Email OTP Service',
      projectId: EXPECTED_PROJECT_ID,
    });
  } catch (err) {
    return jsonResponse_({
      ok: false,
      service: 'Carrom First-Login Email OTP Service',
      error: sanitizeErrorMessage_(err && err.message ? String(err.message) : 'Configuration check failed.'),
    });
  }
}

/**
 * Main RPC Endpoint (POST)
 * Uses text/plain JSON body so browser fetch requests do not trigger CORS preflight failures.
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse_({ success: false, error: 'Missing request payload.' });
    }

    var body = JSON.parse(e.postData.contents);
    var action = String(body.action || '').trim();

    if (action === 'authenticateUsername') {
      return handleAuthenticateUsername_(body);
    }
    if (action === 'provisionAdminAccount') {
      var idToken = String(body.idToken || '').trim();
      if (!idToken) {
        return jsonResponse_({ success: false, error: 'Authentication required.' });
      }
      var authUser = verifyFirebaseIdToken_(idToken);
      var adminEmail = (getAdminEmail_() || OTP_RECIPIENT_EMAIL || 'carromlotterydesk@gmail.com').toLowerCase();
      var isAdminEmail = String(authUser.email || '').toLowerCase() === adminEmail;
      var hasVerifiedAdminClaims = Boolean(
        authUser.claims &&
        authUser.claims.role === 'admin' &&
        (authUser.claims.otpVerified === true || authUser.claims.verified === true)
      );

      // Verify that an ordinary authenticated user cannot invoke this action to grant themselves Admin privileges.
      // A valid ID token for the Admin email alone is not sufficient authorization unless the account is already securely verified as Admin.
      if (!isAdminEmail || !hasVerifiedAdminClaims) {
        return jsonResponse_({
          success: false,
          error: 'Permission denied: administrative privileges required. A valid ID token alone without verified Admin claims cannot invoke provisioning.'
        });
      }
      return jsonResponse_(provisionAdminAccount_(authUser.uid));
    }
    if (action === 'verifyLoginSession') {
      return handleVerifyLoginSession_(body);
    }
    if (action === 'registerEmployeeProfile') {
      return handleRegisterEmployeeProfile_(body);
    }
    if (action === 'requestRegistrationOtp' || action === 'requestFirstLoginOtp') {
      return handleRequestFirstLoginOtp_(body);
    }
    if (action === 'verifyRegistrationOtp' || action === 'verifyFirstLoginOtp') {
      return handleVerifyFirstLoginOtp_(body);
    }
    if (action === 'cancelRegistration') {
      return handleCancelRegistration_(body);
    }
    if (action === 'acquireTicketLock') {
      return handleAcquireTicketLock_(body);
    }
    if (action === 'renewTicketLock') {
      return handleRenewTicketLock_(body);
    }
    if (action === 'releaseTicketLock') {
      return handleReleaseTicketLock_(body);
    }
    if (action === 'confirmTicketBooking') {
      return handleConfirmTicketBooking_(body);
    }
    if (action === 'confirmPendingBooking') {
      return handleConfirmPendingBooking_(body);
    }
    if (action === 'publishTicketInventory') {
      return handlePublishTicketInventory_(body);
    }
    if (action === 'getTicketInventory') {
      return handleGetTicketInventory_(body);
    }
    if (action === 'unpublishTicketInventory') {
      return handleUnpublishTicketInventory_(body);
    }
    if (action === 'cancelTicketBooking') {
      return handleCancelTicketBooking_(body);
    }
    if (action === 'lookupCustomerBookings') {
      return handleLookupCustomerBookings_(body);
    }

    return jsonResponse_({ success: false, error: 'Unsupported action.' });
  } catch (err) {
    return jsonResponse_({
      success: false,
      error: sanitizeErrorMessage_(err && err.message ? String(err.message) : 'Request processing failed.'),
    });
  }
}

/**
 * 1. Normal Login (Username + Password Only — No Login OTP):
 *    Resolves username -> email on the server and verifies password via Identity Toolkit
 *    before returning the verified email so no public username directory is exposed.
 *    - Rejects unverified Sign-Up accounts (where registration OTP was never completed).
 *    - Ensures verified and pre-existing accounts have active `otpVerified: true` claims
 *      so normal login never requires an OTP on first or subsequent logins.
 */
function handleAuthenticateUsername_(body) {
  var rawUsername = String(body.username || '').trim().toLowerCase();
  var password = String(body.password || '');

  if (!rawUsername || !password || rawUsername.length > 64) {
    return jsonResponse_({ success: false, error: 'Username and password are required.' });
  }

  var cache = CacheService.getScriptCache();
  var rateKey = 'AUTH_FAIL_' + sha256Hex_(rawUsername).substring(0, 24);
  var failedCount = Number(cache.get(rateKey) || 0);
  if (failedCount >= 5) {
    return jsonResponse_({
      success: false,
      error: 'Too many failed login attempts for this username. Please wait 15 minutes and try again.',
    });
  }

  var isDedicatedAdmin = (rawUsername === 'sasikaran');
  var dirDoc = firestoreGetDocument_('userDirectory/' + encodeURIComponent(rawUsername));
  var email = dirDoc && dirDoc.email ? String(dirDoc.email) : '';
  var role = dirDoc && dirDoc.role ? normalizeRole_(dirDoc.role) : 'employee';
  var displayName = dirDoc && dirDoc.displayName ? String(dirDoc.displayName) : rawUsername;
  var resolvedUid = dirDoc && dirDoc.uid ? String(dirDoc.uid) : '';

  if (isDedicatedAdmin) {
    if (!email) {
      email = getAdminEmail_() || OTP_RECIPIENT_EMAIL || 'carromlotterydesk@gmail.com';
    }
    role = 'admin';
    displayName = 'Sasikaran';
  }

  // Fallback: query /users by username if /userDirectory/{username} was not yet populated
  if (!email) {
    var queriedUser = firestoreFindUserByUsername_(rawUsername);
    if (queriedUser && queriedUser.email) {
      email = String(queriedUser.email);
      role = isDedicatedAdmin ? 'admin' : normalizeRole_(queriedUser.role);
      displayName = isDedicatedAdmin ? 'Sasikaran' : String(queriedUser.displayName || queriedUser.name || rawUsername);
      resolvedUid = queriedUser.uid ? String(queriedUser.uid) : '';
      if (resolvedUid) {
        firestorePatchFields_('userDirectory/' + encodeURIComponent(rawUsername), {
          uid: resolvedUid,
          email: email,
          role: role,
          displayName: displayName,
          updatedAtIso: new Date().toISOString(),
        });
      }
    }
  }

  if (!email) {
    cache.put(rateKey, String(failedCount + 1), 900);
    return jsonResponse_({ success: false, error: 'Invalid username or password.' });
  }

  // Verify the password securely against Firebase Authentication Identity Toolkit (Zero plaintext passwords stored in Firestore/Properties)
  var webApiKey = getWebApiKey_();
  var signInUrl =
    'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' +
    encodeURIComponent(webApiKey);
  var signInRes = safeFetch_(signInUrl, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({
      email: email,
      password: password,
      returnSecureToken: true,
    }),
  });

  if (signInRes.getResponseCode() !== 200) {
    cache.put(rateKey, String(failedCount + 1), 900);
    return jsonResponse_({ success: false, error: 'Invalid username or password.' });
  }

  var signInData = {};
  try {
    signInData = JSON.parse(signInRes.getContentText() || '{}');
  } catch (e) {}
  var uid = String(signInData.localId || resolvedUid || '').trim();

  // Enforce that Sign-Up OTP verification was completed (never allow unverified sign-up accounts to log in)
  if (uid && !isDedicatedAdmin) {
    var userDoc = firestoreGetDocument_('users/' + encodeURIComponent(uid));
    var isPendingSignup =
      (userDoc && userDoc.registrationCompleted === false && userDoc.otpVerified !== true && userDoc.verified !== true) ||
      (dirDoc && dirDoc.registrationCompleted === false && dirDoc.otpVerified !== true && dirDoc.verified !== true);

    if (isPendingSignup) {
      return jsonResponse_({
        success: false,
        code: 'SIGNUP_OTP_INCOMPLETE',
        error:
          'Account registration is incomplete. Please complete the 6-digit email OTP verification in Sign Up before logging in.',
      });
    }

    if (userDoc) {
      role = normalizeRole_(userDoc.role || role);
      displayName = String(userDoc.displayName || userDoc.name || displayName);
    }
  }

  if (isDedicatedAdmin) {
    role = 'admin';
    displayName = 'Sasikaran';
  }

  if (uid) {
    // Ensure verified or pre-existing accounts have active server-signed claims so login requires zero OTP
    var now = Date.now();
    setFirebaseUserVerifiedClaims_(uid, { role: role }, role, now);
    firestorePatchFields_('users/' + encodeURIComponent(uid), {
      uid: uid,
      email: email,
      name: displayName,
      displayName: displayName,
      username: rawUsername,
      role: role,
      verified: true,
      otpVerified: true,
      registrationCompleted: true,
      firstLoginCompleted: true,
    });
    firestorePatchFields_('userDirectory/' + encodeURIComponent(rawUsername), {
      uid: uid,
      email: email,
      role: role,
      displayName: displayName,
      verified: true,
      otpVerified: true,
      registrationCompleted: true,
      updatedAtIso: new Date(now).toISOString(),
    });
  }

  cache.remove(rateKey);

  return jsonResponse_({
    success: true,
    requiresOtp: false,
    uid: uid,
    username: rawUsername,
    email: email,
    role: role,
    displayName: displayName,
    verified: true,
    otpVerified: true,
  });
}

/**
 * 1B. Validates an authenticated login session (e.g. when signing in by email + password):
 *     - Blocks accounts that started Sign Up but never verified their Sign-Up email OTP.
 *     - Ensures verified or pre-existing accounts have server-signed `otpVerified: true` claims
 *       without ever sending or requiring an OTP during login.
 */
function handleVerifyLoginSession_(body) {
  var idToken = String(body.idToken || '').trim();
  if (!idToken) {
    return jsonResponse_({ success: false, error: 'Authentication required (missing ID token).' });
  }

  var authUser = verifyFirebaseIdToken_(idToken);
  var uid = authUser.uid;
  var email = String(authUser.email || '').trim().toLowerCase();
  var userDoc = firestoreGetDocument_('users/' + encodeURIComponent(uid));

  if (
    userDoc &&
    userDoc.registrationCompleted === false &&
    userDoc.otpVerified !== true &&
    userDoc.verified !== true
  ) {
    return jsonResponse_({
      success: false,
      code: 'SIGNUP_OTP_INCOMPLETE',
      error:
        'Account registration is incomplete. Please complete the 6-digit email OTP verification in Sign Up before logging in.',
    });
  }

  var rawUsername = userDoc && userDoc.username ? String(userDoc.username).trim().toLowerCase() : '';
  var isDedicatedAdmin = (rawUsername === 'sasikaran' || email === OTP_RECIPIENT_EMAIL.toLowerCase() || email === 'carromlotterydesk@gmail.com');
  var resolvedUsername = isDedicatedAdmin ? 'sasikaran' : rawUsername;
  var resolvedRole = isDedicatedAdmin
    ? 'admin'
    : normalizeRole_(
        (userDoc && userDoc.role) || (authUser.claims && authUser.claims.role) || 'employee'
      );
  var resolvedName = isDedicatedAdmin
    ? 'Sasikaran'
    : String(
        (userDoc && (userDoc.displayName || userDoc.name)) ||
          (email ? email.split('@')[0] : 'Operator')
      );

  var isClaimVerified = Boolean(authUser.claims && authUser.claims.otpVerified === true);
  var isDocVerified = Boolean(userDoc && userDoc.otpVerified === true && userDoc.verified === true);

  if (!isClaimVerified || !isDocVerified) {
    var now = Date.now();
    var nowIso = new Date(now).toISOString();
    setFirebaseUserVerifiedClaims_(uid, authUser.claims || {}, resolvedRole, now);
    var patchData = {
      uid: uid,
      email: email,
      name: resolvedName,
      displayName: resolvedName,
      role: resolvedRole,
      verified: true,
      otpVerified: true,
      registrationCompleted: true,
      firstLoginCompleted: true,
      updatedAt: nowIso,
    };
    if (resolvedUsername) {
      patchData.username = resolvedUsername;
    }
    firestorePatchFields_('users/' + encodeURIComponent(uid), patchData);
    if (resolvedUsername) {
      firestorePatchFields_('userDirectory/' + encodeURIComponent(resolvedUsername), {
        username: resolvedUsername,
        uid: uid,
        email: email,
        role: resolvedRole,
        displayName: resolvedName,
        verified: true,
        otpVerified: true,
        registrationCompleted: true,
        updatedAtIso: nowIso,
      });
    }
  }

  return jsonResponse_({
    success: true,
    requiresOtp: false,
    verified: true,
    otpVerified: true,
    uid: uid,
    username: resolvedUsername,
    email: email,
    role: resolvedRole,
    name: resolvedName,
  });
}

/**
 * 2. Generates and sends (or resends) a 6-digit registration approval OTP
 *    exclusively from carromlotterydesk@gmail.com to carromlotterydesk@gmail.com.
 *    Never sends the OTP to the employee's email or any client-supplied destination.
 */
function handleRequestFirstLoginOtp_(body) {
  var idToken = String(body.idToken || '').trim();
  if (!idToken) {
    return jsonResponse_({ success: false, error: 'Authentication required (missing ID token).' });
  }

  var authUser = verifyFirebaseIdToken_(idToken);
  var uid = authUser.uid;

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var userDoc = firestoreGetDocument_('users/' + encodeURIComponent(uid)) || {};
    var accountEmail = String(authUser.email || userDoc.email || '').trim().toLowerCase();

    if (!accountEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(accountEmail)) {
      return jsonResponse_({
        success: false,
        error: 'No valid registered email address found for this account.',
      });
    }

    // Check if already verified via custom claims AND server-side user document
    var resolvedRole = normalizeRole_(
      userDoc.role || (authUser.claims && authUser.claims.role) || 'employee'
    );
    var resolvedName = String(
      userDoc.displayName ||
      userDoc.name ||
      (authUser.email ? authUser.email.split('@')[0] : 'Operator')
    );
    var resolvedUsername = userDoc.username ? String(userDoc.username) : '';
    var isClaimVerified = Boolean(authUser.claims && authUser.claims.otpVerified === true);
    var isDocVerified = Boolean(userDoc.otpVerified === true && userDoc.firstLoginCompleted === true);

    if (isClaimVerified && isDocVerified) {
      return jsonResponse_({
        success: true,
        alreadyVerified: true,
        verified: true,
        otpVerified: true,
        role: resolvedRole,
        name: resolvedName,
        username: resolvedUsername,
        recipientEmail: OTP_RECIPIENT_EMAIL,
        maskedEmail: OTP_RECIPIENT_EMAIL,
        senderEmail: OTP_SENDER_EMAIL,
      });
    }

    var now = Date.now();
    var challengePath = 'otpChallenges/' + encodeURIComponent(uid);
    var challenge = firestoreGetDocument_(challengePath);

    var sendWindowStartMs = now;
    var sendCountWindow = 0;

    if (challenge) {
      if (!resolvedUsername && challenge.username) {
        resolvedUsername = String(challenge.username);
      }
      var lastSentAtMs = Number(challenge.lastSentAtMs || 0);
      var elapsedMs = now - lastSentAtMs;

      if (elapsedMs < OTP_RESEND_COOLDOWN_MS) {
        var waitSec = Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsedMs) / 1000);
        return jsonResponse_({
          success: false,
          error: 'Please wait ' + waitSec + ' seconds before requesting a new OTP.',
          resendCooldownSeconds: waitSec,
        });
      }

      var prevWindowStart = Number(challenge.sendWindowStartMs || 0);
      if (now - prevWindowStart < ONE_HOUR_MS) {
        sendWindowStartMs = prevWindowStart;
        sendCountWindow = Number(challenge.sendCountWindow || 0);
        if (sendCountWindow >= OTP_MAX_SENDS_PER_HOUR) {
          return jsonResponse_({
            success: false,
            error: 'Maximum OTP resend limit reached (5 per hour). Please try again later.',
          });
        }
      }
    }

    var otpCode = generateSixDigitOtp_();
    var salt = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
    var otpHash = sha256Hex_(salt + ':' + otpCode);
    var expiresAtMs = now + OTP_EXPIRY_MS;

    // Deliver registration approval OTP exclusively to carromlotterydesk@gmail.com BEFORE committing rate-limit counters
    sendOtpEmail_(otpCode, {
      uid: uid,
      fullName: resolvedName,
      username: resolvedUsername,
      email: accountEmail,
    });

    firestoreSetDocument_(challengePath, {
      uid: uid,
      email: accountEmail,
      recipientEmail: OTP_RECIPIENT_EMAIL,
      username: resolvedUsername,
      fullName: resolvedName,
      role: resolvedRole,
      otpHash: otpHash,
      salt: salt,
      expiresAtMs: expiresAtMs,
      attempts: 0,
      maxAttempts: OTP_MAX_ATTEMPTS,
      consumed: false,
      lastSentAtMs: now,
      sendWindowStartMs: sendWindowStartMs,
      sendCountWindow: sendCountWindow + 1,
      senderEmail: OTP_SENDER_EMAIL,
      updatedAtIso: new Date(now).toISOString(),
    });

    return jsonResponse_({
      success: true,
      alreadyVerified: false,
      role: resolvedRole,
      name: resolvedName,
      username: resolvedUsername,
      recipientEmail: OTP_RECIPIENT_EMAIL,
      maskedEmail: OTP_RECIPIENT_EMAIL,
      senderEmail: OTP_SENDER_EMAIL,
      expiresInSeconds: Math.floor(OTP_EXPIRY_MS / 1000),
      resendCooldownSeconds: Math.floor(OTP_RESEND_COOLDOWN_MS / 1000),
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * 3. Validates the 6-digit Sign-Up OTP and marks the account permanently verified
 *    in Firebase Auth Custom Claims, `/users/{uid}`, and `/userDirectory/{username}`.
 *    Never trusts any client-provided `verified: true` or `role`.
 */
function handleVerifyFirstLoginOtp_(body) {
  var idToken = String(body.idToken || '').trim();
  var submittedOtp = String(body.otpCode || '').trim();

  if (!idToken) {
    return jsonResponse_({ success: false, verified: false, error: 'Authentication required.' });
  }
  if (!/^\d{6}$/.test(submittedOtp)) {
    return jsonResponse_({
      success: false,
      verified: false,
      error: 'Please enter a valid 6-digit numeric OTP.',
    });
  }

  var authUser = verifyFirebaseIdToken_(idToken);
  var uid = authUser.uid;

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var challengePath = 'otpChallenges/' + encodeURIComponent(uid);
    var challenge = firestoreGetDocument_(challengePath);
    var now = Date.now();

    if (!challenge || challenge.consumed === true || !challenge.otpHash || !challenge.salt) {
      return jsonResponse_({
        success: false,
        verified: false,
        error: 'No active OTP challenge found. Please request a new code.',
      });
    }

    if (now > Number(challenge.expiresAtMs || 0)) {
      firestorePatchFields_(challengePath, {
        consumed: true,
        expiredAtIso: new Date(now).toISOString(),
      });
      return jsonResponse_({
        success: false,
        verified: false,
        error: 'This OTP has expired (valid for 5 minutes). Please click Resend OTP.',
      });
    }

    var currentAttempts = Number(challenge.attempts || 0);
    var maxAttempts = Number(challenge.maxAttempts || OTP_MAX_ATTEMPTS);

    if (currentAttempts >= maxAttempts) {
      firestorePatchFields_(challengePath, { consumed: true });
      return jsonResponse_({
        success: false,
        verified: false,
        remainingAttempts: 0,
        error: 'Maximum incorrect attempts exceeded. Please request a new OTP.',
      });
    }

    var candidateHash = sha256Hex_(String(challenge.salt) + ':' + submittedOtp);
    var isMatch = constantTimeEqual_(candidateHash, String(challenge.otpHash));

    if (!isMatch) {
      var nextAttempts = currentAttempts + 1;
      var remaining = Math.max(0, maxAttempts - nextAttempts);
      firestorePatchFields_(challengePath, {
        attempts: nextAttempts,
        consumed: remaining === 0,
        lastFailedAtIso: new Date(now).toISOString(),
      });

      return jsonResponse_({
        success: false,
        verified: false,
        remainingAttempts: remaining,
        error:
          remaining > 0
            ? 'Incorrect OTP code. ' + remaining + ' attempt(s) remaining.'
            : 'Maximum incorrect attempts reached. Please request a new OTP.',
      });
    }

    // Consume OTP immediately so it can never be reused
    firestorePatchFields_(challengePath, {
      consumed: true,
      verifiedAtMs: now,
      otpHash: '',
      salt: '',
    });

    // Fetch existing user profile to preserve role & displayName without overwriting unrelated fields
    var userPath = 'users/' + encodeURIComponent(uid);
    var existingUser = firestoreGetDocument_(userPath) || {};
    var resolvedRole = normalizeRole_(
      existingUser.role || challenge.role || (authUser.claims && authUser.claims.role) || 'employee'
    );
    var resolvedName = String(
      existingUser.displayName ||
      existingUser.name ||
      challenge.fullName ||
      (authUser.email ? authUser.email.split('@')[0] : 'Operator')
    );
    var resolvedUsername = String(
      existingUser.username || challenge.username || ''
    ).trim().toLowerCase();
    var resolvedEmail = String(authUser.email || existingUser.email || challenge.email || '').trim().toLowerCase();
    var nowIso = new Date(now).toISOString();

    // 1. Merge and set server-signed custom claims (`verified: true`, `otpVerified: true`, `registrationCompleted: true`, `role`) on Firebase Auth user
    setFirebaseUserVerifiedClaims_(uid, authUser.claims || {}, resolvedRole, now);

    // 2. Patch verification & identity fields on `/users/{uid}` (preserving createdAt and any other fields)
    var userPatch = {
      uid: uid,
      email: resolvedEmail,
      name: resolvedName,
      displayName: resolvedName,
      role: resolvedRole,
      verified: true,
      otpVerified: true,
      registrationCompleted: true,
      firstLoginCompleted: true,
      otpVerifiedAt: nowIso,
      updatedAt: nowIso,
    };
    if (resolvedUsername) {
      userPatch.username = resolvedUsername;
    }
    firestorePatchFields_(userPath, userPatch);

    // 3. Mark `/userDirectory/{username}` verified so normal username login succeeds without OTP
    if (resolvedUsername) {
      firestorePatchFields_('userDirectory/' + encodeURIComponent(resolvedUsername), {
        username: resolvedUsername,
        uid: uid,
        email: resolvedEmail,
        role: resolvedRole,
        displayName: resolvedName,
        verified: true,
        otpVerified: true,
        registrationCompleted: true,
        updatedAtIso: nowIso,
      });
    }

    // 4. Append audit event
    var auditId = 'otp_ver_' + uid + '_' + now;
    firestoreSetDocument_('auditEvents/' + encodeURIComponent(auditId), {
      action: 'SIGNUP_EMAIL_OTP_VERIFIED',
      uid: uid,
      username: resolvedUsername,
      email: resolvedEmail,
      role: resolvedRole,
      senderEmail: OTP_SENDER_EMAIL,
      recipientEmail: OTP_RECIPIENT_EMAIL,
      timestampIso: nowIso,
    });

    return jsonResponse_({
      success: true,
      verified: true,
      otpVerified: true,
      registrationCompleted: true,
      uid: uid,
      username: resolvedUsername,
      email: resolvedEmail,
      role: resolvedRole,
      name: resolvedName,
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * 4. Initiates Employee Sign-Up & Sends the 6-Digit Registration OTP:
 *    - Verifies the Firebase Auth ID token (`uid` and `email`).
 *    - Forces `role = 'employee'`, `verified = false`, `otpVerified = false`, `registrationCompleted = false`
 *      (never trusting any client-supplied role or `verified: true`).
 *    - Atomically enforces unique usernames across `/userDirectory/{username}` and `/users`.
 *    - Generates and emails a 6-digit OTP from `carromlotterydesk@gmail.com`.
 *    - Does NOT complete registration or mark the account verified until `verifyRegistrationOtp` succeeds.
 *    - Rolls back (deletes) the newly created Firebase Auth user if validation, username uniqueness, or email delivery fails.
 */
function handleRegisterEmployeeProfile_(body) {
  var idToken = String(body.idToken || '').trim();
  if (!idToken) {
    return jsonResponse_({ success: false, error: 'Authentication required (missing ID token).' });
  }

  var authUser = verifyFirebaseIdToken_(idToken);
  var uid = authUser.uid;
  var email = String(authUser.email || '').trim().toLowerCase();

  var cleanName = String(body.fullName || body.name || '').trim();
  var rawUsername = String(body.username || '').trim().toLowerCase();

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var userPath = 'users/' + encodeURIComponent(uid);
    var existingUserDoc = firestoreGetDocument_(userPath);
    var isNewUnprofiledUser = !existingUserDoc || !existingUserDoc.username;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (isNewUnprofiledUser) deleteFirebaseAuthUser_(uid);
      return jsonResponse_({
        success: false,
        error: 'A valid registered email address is required.',
      });
    }

    if (cleanName.length < 2 || cleanName.length > 80) {
      if (isNewUnprofiledUser) deleteFirebaseAuthUser_(uid);
      return jsonResponse_({
        success: false,
        error: 'Full name must be between 2 and 80 characters.',
      });
    }

    if (!/^[a-z0-9._-]{3,32}$/.test(rawUsername)) {
      if (isNewUnprofiledUser) deleteFirebaseAuthUser_(uid);
      return jsonResponse_({
        success: false,
        error:
          'Username must be 3 to 32 characters and contain only letters, numbers, dots (.), underscores (_), or hyphens (-).',
      });
    }

    // If this UID already completed OTP-verified registration, do not overwrite it
    if (
      existingUserDoc &&
      existingUserDoc.username &&
      (existingUserDoc.otpVerified === true || existingUserDoc.verified === true)
    ) {
      return jsonResponse_({
        success: false,
        error: 'This account is already registered and verified. Please sign in on the Login screen.',
      });
    }

    // Enforce unique username across /userDirectory/{username} and /users
    var dirPath = 'userDirectory/' + encodeURIComponent(rawUsername);
    var existingDir = firestoreGetDocument_(dirPath);
    if (existingDir && existingDir.uid && String(existingDir.uid) !== uid) {
      if (isNewUnprofiledUser) deleteFirebaseAuthUser_(uid);
      return jsonResponse_({
        success: false,
        code: 'USERNAME_TAKEN',
        error: 'Username "' + rawUsername + '" is already taken. Please choose a different username.',
      });
    }

    var queriedUser = firestoreFindUserByUsername_(rawUsername);
    if (queriedUser && queriedUser.uid && String(queriedUser.uid) !== uid) {
      if (isNewUnprofiledUser) deleteFirebaseAuthUser_(uid);
      return jsonResponse_({
        success: false,
        code: 'USERNAME_TAKEN',
        error: 'Username "' + rawUsername + '" is already taken. Please choose a different username.',
      });
    }

    // Check resend cooldown / rate limit if this UID is retrying pending registration
    var now = Date.now();
    var nowIso = new Date(now).toISOString();
    var challengePath = 'otpChallenges/' + encodeURIComponent(uid);
    var existingChallenge = firestoreGetDocument_(challengePath);
    var sendWindowStartMs = now;
    var sendCountWindow = 0;

    if (existingChallenge) {
      var lastSentAtMs = Number(existingChallenge.lastSentAtMs || 0);
      var elapsedMs = now - lastSentAtMs;
      if (elapsedMs < OTP_RESEND_COOLDOWN_MS) {
        var waitSec = Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsedMs) / 1000);
        return jsonResponse_({
          success: false,
          error: 'Please wait ' + waitSec + ' seconds before requesting a new OTP.',
          resendCooldownSeconds: waitSec,
        });
      }

      var prevWindowStart = Number(existingChallenge.sendWindowStartMs || 0);
      if (now - prevWindowStart < ONE_HOUR_MS) {
        sendWindowStartMs = prevWindowStart;
        sendCountWindow = Number(existingChallenge.sendCountWindow || 0);
        if (sendCountWindow >= OTP_MAX_SENDS_PER_HOUR) {
          return jsonResponse_({
            success: false,
            error: 'Maximum OTP resend limit reached (5 per hour). Please try again later.',
          });
        }
      }
    }

    // If this UID had a previous pending unverified username that changed, release the old one
    if (
      existingUserDoc &&
      existingUserDoc.username &&
      String(existingUserDoc.username).toLowerCase() !== rawUsername
    ) {
      var oldUsername = String(existingUserDoc.username).toLowerCase();
      var oldDir = firestoreGetDocument_('userDirectory/' + encodeURIComponent(oldUsername));
      if (oldDir && String(oldDir.uid) === uid) {
        firestoreDeleteDocument_('userDirectory/' + encodeURIComponent(oldUsername));
      }
    }

    // Public sign-ups accept requestedRole ('employee' or 'paid_employee'), but NEVER 'admin'
    // and are NEVER marked verified until OTP succeeds
    var requestedRole = String(body.requestedRole || body.role || 'employee').trim().toLowerCase();
    var assignedRole = requestedRole === 'paid_employee' ? 'paid_employee' : 'employee';
    var otpCode = generateSixDigitOtp_();
    var salt = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
    var otpHash = sha256Hex_(salt + ':' + otpCode);
    var expiresAtMs = now + OTP_EXPIRY_MS;

    try {
      // 1. Send the 6-digit registration approval OTP exclusively to carromlotterydesk@gmail.com; if sending fails, roll back
      sendOtpEmail_(otpCode, {
        uid: uid,
        fullName: cleanName,
        username: rawUsername,
        email: email,
        role: assignedRole,
      });

      // 2. Set initial unverified custom claims (`role: 'employee', verified: false, otpVerified: false, registrationCompleted: false`)
      setFirebaseUserInitialClaims_(uid, assignedRole);

      // 3. Store pending OTP challenge
      firestoreSetDocument_(challengePath, {
        uid: uid,
        email: email,
        recipientEmail: OTP_RECIPIENT_EMAIL,
        username: rawUsername,
        fullName: cleanName,
        role: assignedRole,
        otpHash: otpHash,
        salt: salt,
        expiresAtMs: expiresAtMs,
        attempts: 0,
        maxAttempts: OTP_MAX_ATTEMPTS,
        consumed: false,
        lastSentAtMs: now,
        sendWindowStartMs: sendWindowStartMs,
        sendCountWindow: sendCountWindow + 1,
        senderEmail: OTP_SENDER_EMAIL,
        updatedAtIso: nowIso,
      });

      // 4. Reserve username and create pending unverified profile (`registrationCompleted: false, verified: false, otpVerified: false`)
      firestoreSetDocument_(dirPath, {
        username: rawUsername,
        uid: uid,
        email: email,
        role: assignedRole,
        displayName: cleanName,
        verified: false,
        otpVerified: false,
        registrationCompleted: false,
        createdAtIso: nowIso,
        updatedAtIso: nowIso,
      });

      firestoreSetDocument_(userPath, {
        uid: uid,
        name: cleanName,
        displayName: cleanName,
        username: rawUsername,
        email: email,
        role: assignedRole,
        verified: false,
        otpVerified: false,
        registrationCompleted: false,
        firstLoginCompleted: false,
        createdAt: existingUserDoc && existingUserDoc.createdAt ? String(existingUserDoc.createdAt) : nowIso,
        updatedAt: nowIso,
      });

      var regAuditId = 'reg_' + uid + '_' + now;
      firestoreSetDocument_('auditEvents/' + encodeURIComponent(regAuditId), {
        action: 'EMPLOYEE_SIGNUP_OTP_SENT',
        uid: uid,
        username: rawUsername,
        email: email,
        recipientEmail: OTP_RECIPIENT_EMAIL,
        senderEmail: OTP_SENDER_EMAIL,
        role: assignedRole,
        verified: false,
        otpVerified: false,
        timestampIso: nowIso,
      });
    } catch (writeErr) {
      if (isNewUnprofiledUser) {
        firestoreDeleteDocument_(dirPath);
        firestoreDeleteDocument_(userPath);
        firestoreDeleteDocument_(challengePath);
        deleteFirebaseAuthUser_(uid);
      }
      throw writeErr;
    }

    return jsonResponse_({
      success: true,
      requiresOtp: true,
      uid: uid,
      name: cleanName,
      username: rawUsername,
      email: email,
      role: assignedRole,
      verified: false,
      otpVerified: false,
      registrationCompleted: false,
      recipientEmail: OTP_RECIPIENT_EMAIL,
      maskedEmail: OTP_RECIPIENT_EMAIL,
      senderEmail: OTP_SENDER_EMAIL,
      expiresInSeconds: Math.floor(OTP_EXPIRY_MS / 1000),
      resendCooldownSeconds: Math.floor(OTP_RESEND_COOLDOWN_MS / 1000),
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * 5. Cancels and rolls back an incomplete, unverified Sign-Up registration
 *    so the email and username are released if the user aborts before verifying the OTP.
 */
function handleCancelRegistration_(body) {
  var idToken = String(body.idToken || '').trim();
  if (!idToken) {
    return jsonResponse_({ success: false, error: 'Authentication required (missing ID token).' });
  }

  var authUser = verifyFirebaseIdToken_(idToken);
  var uid = authUser.uid;

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var userPath = 'users/' + encodeURIComponent(uid);
    var userDoc = firestoreGetDocument_(userPath);

    // Never delete an already verified account
    if (
      (authUser.claims && authUser.claims.otpVerified === true) ||
      (userDoc && (userDoc.otpVerified === true || userDoc.verified === true))
    ) {
      return jsonResponse_({
        success: false,
        error: 'Cannot cancel registration for an already verified account.',
      });
    }

    var username = userDoc && userDoc.username ? String(userDoc.username).toLowerCase() : '';
    if (username) {
      var dirPath = 'userDirectory/' + encodeURIComponent(username);
      var dirDoc = firestoreGetDocument_(dirPath);
      if (dirDoc && String(dirDoc.uid) === uid) {
        firestoreDeleteDocument_(dirPath);
      }
    }

    firestoreDeleteDocument_('otpChallenges/' + encodeURIComponent(uid));
    firestoreDeleteDocument_(userPath);
    deleteFirebaseAuthUser_(uid);

    return jsonResponse_({
      success: true,
      cancelled: true,
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * 6. Real-Time Ticket Lock Acquisition (20-Second Initial Duration):
 *    - Authenticates operator via Firebase ID token and enforces OTP-verified status.
 *    - Grants lock ONLY if every requested ticket is still available (not booked)
 *      and not currently locked by another user (with an unexpired lock).
 *    - Writes `/ticketLocks/{drawDateKey}_{ticketNumber}` so all connected clients
 *      immediately see the ticket in grey/transparent state via real-time subscription.
 */
function handleAcquireTicketLock_(body) {
  var idToken = String(body.idToken || '').trim();
  if (!idToken) {
    return jsonResponse_({
      success: false,
      code: 'AUTH_REQUIRED',
      error: 'Authentication required (missing ID token).',
    });
  }

  var operator = verifyOtpVerifiedOperator_(idToken);
  var drawDate = String(body.drawDate || '').trim();
  var seriesId = String(body.seriesId || 'default').trim() || 'default';
  var rawTickets = Array.isArray(body.ticketNumbers)
    ? body.ticketNumbers
    : body.ticketNumber !== undefined
    ? [body.ticketNumber]
    : [];

  if (!drawDate || !rawTickets.length) {
    return jsonResponse_({
      success: false,
      error: 'drawDate and at least one ticketNumber are required.',
    });
  }

  var ticketNumbers = [];
  var seenTickets = {};
  for (var i = 0; i < rawTickets.length; i++) {
    var norm = normalizeTicketNumber_(rawTickets[i]);
    if (!norm) {
      return jsonResponse_({
        success: false,
        error: 'Invalid ticket number format: ' + String(rawTickets[i]),
      });
    }
    if (!seenTickets[norm]) {
      seenTickets[norm] = true;
      ticketNumbers.push(norm);
    }
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var now = Date.now();
    var nowIso = new Date(now).toISOString();
    var expiresAtMs = now + TICKET_LOCK_DURATION_MS;
    var drawKey = normalizeDrawDateKey_(drawDate);
    var existingOwnerLockId = '';

    // 1. Check availability and existing locks for ALL requested tickets before granting any lock
    for (var j = 0; j < ticketNumbers.length; j++) {
      var tNum = ticketNumbers[j];
      if (isTicketConfirmedOnServer_(drawDate, seriesId, tNum)) {
        return jsonResponse_({
          success: false,
          code: 'ALREADY_BOOKED',
          ticketNumber: tNum,
          error: 'Ticket #' + tNum + ' is already booked.',
        });
      }

      var lockDocPath = 'ticketLocks/' + encodeURIComponent(drawKey + '_' + tNum);
      var existingLock = firestoreGetDocument_(lockDocPath);

      if (existingLock && existingLock.status === 'LOCKED') {
        var lockExpires = Number(existingLock.expiresAtMs || 0);
        if (lockExpires > now) {
          if (String(existingLock.lockedByUid) !== operator.uid) {
            return jsonResponse_({
              success: false,
              code: 'TICKET_LOCKED',
              ticketNumber: tNum,
              lockedByName: String(existingLock.lockedByName || 'Another user'),
              expiresAtMs: lockExpires,
              error: 'This ticket is currently being booked by another user.',
            });
          } else if (!existingOwnerLockId && existingLock.lockId) {
            existingOwnerLockId = String(existingLock.lockId);
          }
        }
      }
    }

    var lockId =
      String(body.lockId || '').trim() ||
      existingOwnerLockId ||
      'lock_' + operator.uid + '_' + now + '_' + Utilities.getUuid().replace(/-/g, '').substring(0, 8);

    // 2. Write active lock records for all requested tickets
    var createdLocks = [];
    for (var k = 0; k < ticketNumbers.length; k++) {
      var num = ticketNumbers[k];
      var lockPath = 'ticketLocks/' + encodeURIComponent(drawKey + '_' + num);
      var lockRecord = {
        lockId: lockId,
        ticketNumber: num,
        drawDate: drawDate,
        seriesId: seriesId,
        status: 'LOCKED',
        lockedByUid: operator.uid,
        lockedByName: operator.name,
        lockedByUsername: operator.username,
        lockedByRole: operator.role,
        lockedAtMs: now,
        expiresAtMs: expiresAtMs,
        updatedAtIso: nowIso,
      };
      firestoreSetDocument_(lockPath, lockRecord);
      createdLocks.push(lockRecord);
    }

    return jsonResponse_({
      success: true,
      lockId: lockId,
      ticketNumbers: ticketNumbers,
      drawDate: drawDate,
      lockedByUid: operator.uid,
      lockedByName: operator.name,
      lockedAtMs: now,
      expiresAtMs: expiresAtMs,
      serverNowMs: Date.now(),
      lockDurationMs: TICKET_LOCK_DURATION_MS,
      lockDurationSeconds: Math.floor(TICKET_LOCK_DURATION_MS / 1000),
      locks: createdLocks,
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * 7. Renews an Active Ticket Lock (20-Second Extension from the server's current time):
 *    - Only succeeds if the ticket remains unbooked AND the caller still owns an unexpired lock.
 *    - Prevents one user from renewing another user's lock or reviving an expired lock that was lost.
 */
function handleRenewTicketLock_(body) {
  var idToken = String(body.idToken || '').trim();
  if (!idToken) {
    return jsonResponse_({
      success: false,
      code: 'AUTH_REQUIRED',
      error: 'Authentication required (missing ID token).',
    });
  }

  var operator = verifyOtpVerifiedOperator_(idToken);
  var drawDate = String(body.drawDate || '').trim();
  var seriesId = String(body.seriesId || 'default').trim() || 'default';
  var submittedLockId = String(body.lockId || '').trim();
  var rawTickets = Array.isArray(body.ticketNumbers)
    ? body.ticketNumbers
    : body.ticketNumber !== undefined
    ? [body.ticketNumber]
    : [];

  if (!drawDate || !rawTickets.length) {
    return jsonResponse_({
      success: false,
      error: 'drawDate and ticketNumbers are required to renew a lock.',
    });
  }

  var ticketNumbers = [];
  for (var i = 0; i < rawTickets.length; i++) {
    var norm = normalizeTicketNumber_(rawTickets[i]);
    if (norm) ticketNumbers.push(norm);
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var now = Date.now();
    var nowIso = new Date(now).toISOString();
    var expiresAtMs = now + TICKET_LOCK_DURATION_MS;
    var drawKey = normalizeDrawDateKey_(drawDate);

    // 1. Validate ownership, non-expiry, and availability for every ticket first
    for (var j = 0; j < ticketNumbers.length; j++) {
      var tNum = ticketNumbers[j];
      if (isTicketConfirmedOnServer_(drawDate, seriesId, tNum)) {
        return jsonResponse_({
          success: false,
          code: 'ALREADY_BOOKED',
          ticketNumber: tNum,
          error: 'Ticket #' + tNum + ' has already been booked.',
        });
      }

      var lockDocPath = 'ticketLocks/' + encodeURIComponent(drawKey + '_' + tNum);
      var existingLock = firestoreGetDocument_(lockDocPath);

      if (!existingLock || existingLock.status !== 'LOCKED') {
        return jsonResponse_({
          success: false,
          code: 'LOCK_NOT_FOUND',
          ticketNumber: tNum,
          error: 'No active lock found for ticket #' + tNum + '.',
        });
      }

      if (String(existingLock.lockedByUid) !== operator.uid) {
        return jsonResponse_({
          success: false,
          code: 'LOCK_OWNERSHIP_MISMATCH',
          ticketNumber: tNum,
          error: 'Cannot renew a lock owned by another user.',
        });
      }

      if (submittedLockId && String(existingLock.lockId) !== submittedLockId) {
        return jsonResponse_({
          success: false,
          code: 'LOCK_OWNERSHIP_MISMATCH',
          ticketNumber: tNum,
          error: 'Lock token mismatch.',
        });
      }

      if (now >= Number(existingLock.expiresAtMs || 0)) {
        firestoreDeleteDocument_(lockDocPath);
        return jsonResponse_({
          success: false,
          code: 'LOCK_EXPIRED',
          ticketNumber: tNum,
          error: 'Your ticket lock has expired. Please re-select the ticket to acquire a new lock.',
        });
      }
    }

    // 2. Extend expiry for all owned locks
    for (var k = 0; k < ticketNumbers.length; k++) {
      var num = ticketNumbers[k];
      var lockPath = 'ticketLocks/' + encodeURIComponent(drawKey + '_' + num);
      firestorePatchFields_(lockPath, {
        expiresAtMs: expiresAtMs,
        updatedAtIso: nowIso,
      });
    }

    return jsonResponse_({
      success: true,
      lockId: submittedLockId,
      ticketNumbers: ticketNumbers,
      expiresAtMs: expiresAtMs,
      serverNowMs: Date.now(),
      lockDurationMs: TICKET_LOCK_DURATION_MS,
      lockDurationSeconds: Math.floor(TICKET_LOCK_DURATION_MS / 1000),
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * 8. Releases a Temporary Ticket Lock (On Cancel, Close, or Failure):
 *    - Enforces ownership so one user can never release another user's active lock.
 *    - Deletes `/ticketLocks/{drawDateKey}_{ticketNumber}` so all connected clients
 *      immediately restore the ticket to White (Available).
 */
function handleReleaseTicketLock_(body) {
  var idToken = String(body.idToken || '').trim();
  if (!idToken) {
    return jsonResponse_({
      success: false,
      code: 'AUTH_REQUIRED',
      error: 'Authentication required (missing ID token).',
    });
  }

  var operator = verifyOtpVerifiedOperator_(idToken);
  var drawDate = String(body.drawDate || '').trim();
  var submittedLockId = String(body.lockId || '').trim();
  var rawTickets = Array.isArray(body.ticketNumbers)
    ? body.ticketNumbers
    : body.ticketNumber !== undefined
    ? [body.ticketNumber]
    : [];

  if (!drawDate || !rawTickets.length) {
    return jsonResponse_({
      success: false,
      error: 'drawDate and ticketNumbers are required to release a lock.',
    });
  }

  var ticketNumbers = [];
  for (var i = 0; i < rawTickets.length; i++) {
    var norm = normalizeTicketNumber_(rawTickets[i]);
    if (norm) ticketNumbers.push(norm);
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var now = Date.now();
    var drawKey = normalizeDrawDateKey_(drawDate);
    var released = [];

    for (var j = 0; j < ticketNumbers.length; j++) {
      var tNum = ticketNumbers[j];
      var lockDocPath = 'ticketLocks/' + encodeURIComponent(drawKey + '_' + tNum);
      var existingLock = firestoreGetDocument_(lockDocPath);

      if (!existingLock) {
        released.push(tNum);
        continue;
      }

      var isExpired = now >= Number(existingLock.expiresAtMs || 0);
      var isOwner = String(existingLock.lockedByUid) === operator.uid;

      if (!isOwner && !isExpired) {
        return jsonResponse_({
          success: false,
          code: 'LOCK_OWNERSHIP_MISMATCH',
          ticketNumber: tNum,
          error: 'Cannot release a ticket lock owned by another user.',
        });
      }

      if (isOwner && submittedLockId && String(existingLock.lockId) !== submittedLockId && !isExpired) {
        return jsonResponse_({
          success: false,
          code: 'LOCK_OWNERSHIP_MISMATCH',
          ticketNumber: tNum,
          error: 'Lock token mismatch.',
        });
      }

      firestoreDeleteDocument_(lockDocPath);
      released.push(tNum);
    }

    return jsonResponse_({
      success: true,
      released: released,
      drawDate: drawDate,
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * 9. Atomic & Idempotent Booking Confirmation + Permanent Customer Serial Code Assignment:
 *    1. Verifies operator authentication and OTP-verified status.
 *    2. Enforces idempotency via `idempotencyKey` so network retries never create duplicate bookings or customer codes.
 *    3. Verifies that the caller holds an active, unexpired lock on every ticket in `items`.
 *    4. Verifies that none of the tickets are already booked.
 *    5. Assigns or reuses the customer's permanent unique serial code (`#XXXX`, e.g. `#5316`),
 *       never colliding and never using a ticket number as the customer code.
 *    6. Commits the confirmed ticket reservations and booking records linked to `customerId`.
 *    7. Releases/finalizes the temporary locks so all clients immediately display the ticket in Black.
 */
function handleConfirmTicketBooking_(body) {
  var idToken = String(body.idToken || '').trim();
  if (!idToken) {
    return jsonResponse_({
      success: false,
      code: 'AUTH_REQUIRED',
      error: 'Authentication required (missing ID token).',
    });
  }

  var operator = verifyOtpVerifiedOperator_(idToken);
  var drawDate = String(body.drawDate || '').trim();
  var seriesId = String(body.seriesId || 'default').trim() || 'default';
  var submittedLockId = String(body.lockId || '').trim();
  var idempotencyKey = String(body.idempotencyKey || '').trim();
  var rawCustomerName = String(body.customerName || '').trim();
  var rawCustomerPhone = String(body.customerPhone || '').trim();
  var requestedCustomerId = String(body.customerId || '').trim();
  var rawItems = Array.isArray(body.items) ? body.items : [];

  if (!drawDate || !rawItems.length) {
    return jsonResponse_({
      success: false,
      error: 'drawDate and at least one ticket item are required.',
    });
  }

  if (!rawCustomerName || rawCustomerName.length < 2 || rawCustomerName.length > 80) {
    return jsonResponse_({
      success: false,
      error: 'Customer name must be between 2 and 80 characters.',
    });
  }

  var normalizedItems = [];
  var seenNums = {};
  var ticketNumsList = [];
  for (var i = 0; i < rawItems.length; i++) {
    var item = rawItems[i] || {};
    var normNum = normalizeTicketNumber_(item.ticketNumber);
    if (!normNum) {
      return jsonResponse_({
        success: false,
        error: 'Invalid ticket number in booking request.',
      });
    }
    if (!seenNums[normNum]) {
      seenNums[normNum] = true;
      var isHalf = Boolean(item.half);
      var isFull = Boolean(item.full);
      if (!isHalf && !isFull) isFull = true;
      normalizedItems.push({
        ticketNumber: normNum,
        half: isHalf,
        full: isFull,
      });
      ticketNumsList.push(normNum);
    }
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var now = Date.now();
    var nowIso = new Date(now).toISOString();
    var drawKey = normalizeDrawDateKey_(drawDate);

    // 1. Idempotency check: if this exact request was already committed, return the cached response
    if (idempotencyKey) {
      var idemPath = 'bookingIdempotency/' + encodeURIComponent(idempotencyKey);
      var existingIdem = firestoreGetDocument_(idemPath);
      if (existingIdem && String(existingIdem.uid) === operator.uid && existingIdem.responseJson) {
        var cachedPayload = JSON.parse(String(existingIdem.responseJson));
        cachedPayload.idempotentReplay = true;
        return jsonResponse_(cachedPayload);
      }
    }

    // 2. Verify lock ownership and non-expiry for every ticket in the booking
    var earliestLockExpiryMs = Number.MAX_SAFE_INTEGER;
    for (var j = 0; j < normalizedItems.length; j++) {
      var checkNum = normalizedItems[j].ticketNumber;
      var lockDocPath = 'ticketLocks/' + encodeURIComponent(drawKey + '_' + checkNum);
      var lockDoc = firestoreGetDocument_(lockDocPath);

      if (!lockDoc || lockDoc.status !== 'LOCKED') {
        return jsonResponse_({
          success: false,
          code: 'LOCK_REQUIRED',
          ticketNumber: checkNum,
          error:
            'Active ticket lock is required for ticket #' +
            checkNum +
            '. Please select the ticket again to acquire a lock.',
        });
      }

      if (String(lockDoc.lockedByUid) !== operator.uid) {
        return jsonResponse_({
          success: false,
          code: 'LOCK_OWNERSHIP_MISMATCH',
          ticketNumber: checkNum,
          error: 'This ticket is currently being booked by another user.',
        });
      }

      if (submittedLockId && String(lockDoc.lockId) !== submittedLockId) {
        return jsonResponse_({
          success: false,
          code: 'LOCK_OWNERSHIP_MISMATCH',
          ticketNumber: checkNum,
          error: 'Lock token mismatch for ticket #' + checkNum + '.',
        });
      }

      if (now >= Number(lockDoc.expiresAtMs || 0)) {
        firestoreDeleteDocument_(lockDocPath);
        return jsonResponse_({
          success: false,
          code: 'LOCK_EXPIRED',
          ticketNumber: checkNum,
          error:
            'Your 120-second lock on ticket #' +
            checkNum +
            ' expired while completing the form. Please select the ticket again to acquire a new lock before confirming.',
        });
      }
      earliestLockExpiryMs = Math.min(earliestLockExpiryMs, Number(lockDoc.expiresAtMs || 0));
    }

    // 3. Verify that none of the tickets are already booked
    for (var m = 0; m < normalizedItems.length; m++) {
      var bookCheckNum = normalizedItems[m].ticketNumber;
      if (isTicketConfirmedOnServer_(drawDate, seriesId, bookCheckNum)) {
        // Release caller's locks so tickets are not left locked after failure
        releaseOwnedLocksInternal_(drawKey, ticketNumsList, operator.uid);
        return jsonResponse_({
          success: false,
          code: 'ALREADY_BOOKED',
          ticketNumber: bookCheckNum,
          error: 'Ticket #' + bookCheckNum + ' is already booked for draw ' + drawDate + '!',
        });
      }
    }

    // 4. Read system pricing config
    var sysConfig = firestoreGetDocument_('config/system') || {};
    var halfPrice = Number(sysConfig.halfTicketPrice || 25);
    var fullPrice = Number(sysConfig.fullTicketPrice || 50);
    var seriesTitle = String(sysConfig.seriesTitle || body.seriesTitle || 'CUSTOM NAME');

    // 4B. Re-validate lock expiry with a fresh SERVER timestamp immediately before committing.
    //     The upstream Firestore reads above take real time; with a 120-second lock, a lock that
    //     was valid at the start of this request must still be valid at commit time. Client
    //     clocks are never consulted. No customer code is allocated if this check fails.
    if (Date.now() >= earliestLockExpiryMs) {
      releaseOwnedLocksInternal_(drawKey, ticketNumsList, operator.uid);
      return jsonResponse_({
        success: false,
        code: 'LOCK_EXPIRED',
        error:
          'Your 120-second ticket lock expired before the booking could be committed. Please select the ticket again to acquire a new lock.',
      });
    }

    // 5. Assign or retrieve permanent Customer Serial Code (#XXXX)
    var customerRecord = resolveOrCreateCustomerRecord_({
      customerName: rawCustomerName,
      customerPhone: rawCustomerPhone,
      requestedCustomerId: requestedCustomerId,
      operator: operator,
      ticketNumbers: ticketNumsList,
      bookingCountIncrement: normalizedItems.length,
      now: now,
      nowIso: nowIso,
    });

    var customerId = customerRecord.customerId;
    var bookingBatchId = 'b-' + now;
    var createdBookings = [];

    // 6. Commit ticket reservations and booking documents, then release temporary locks
    try {
      for (var n = 0; n < normalizedItems.length; n++) {
        var bItem = normalizedItems[n];
        var numStr = bItem.ticketNumber;
        var halfAmt = bItem.half ? halfPrice : 0;
        var fullAmt = bItem.full ? fullPrice : 0;
        var totalAmt = halfAmt + fullAmt;
        var ticketDocPath =
          'draws/' +
          encodeURIComponent(drawDate) +
          '/series/' +
          encodeURIComponent(seriesId) +
          '/tickets/' +
          encodeURIComponent(numStr);
        var bookingDocId = 'booking_' + drawKey + '_' + numStr;
        var bookingDocPath = 'bookings/' + encodeURIComponent(bookingDocId);

        var effectiveBookingStatus =
          operator.role === 'employee' && body.bookingStatus !== 'Booked'
            ? 'Pending Confirmation'
            : 'Booked';

        firestoreSetDocument_(ticketDocPath, {
          ticketNumber: numStr,
          drawDate: drawDate,
          seriesId: seriesId,
          bookingBatchId: bookingBatchId,
          bookingId: bookingDocId,
          bookingStatus: effectiveBookingStatus,
          customerId: customerId,
          customerName: rawCustomerName,
          customerPhone: rawCustomerPhone,
          bookedBy: operator.name,
          bookedByUsername: operator.username,
          bookedByUid: operator.uid,
          bookedAt: nowIso,
        });

        var bookingObj = {
          id: bookingDocId,
          ticketNumber: numStr,
          seriesTitle: seriesTitle,
          customerId: customerId,
          customerName: rawCustomerName,
          customerPhone: rawCustomerPhone,
          ticketType: bItem.half && bItem.full ? 'both' : bItem.half ? 'half' : 'full',
          halfSelected: bItem.half,
          halfAmount: halfAmt,
          fullSelected: bItem.full,
          fullAmount: fullAmt,
          totalAmount: totalAmt,
          amountPaid: 0,
          remainingBalance: totalAmt,
          bookingStatus: effectiveBookingStatus,
          paymentStatus: 'Unpaid',
          bookedBy: operator.name,
          bookedByUsername: operator.username,
          bookedByUid: operator.uid,
          bookedByRole: operator.role,
          date: drawDate,
          bookedAt: nowIso,
          history: JSON.stringify([
            {
              id: 'aud-' + now + '-' + n,
              timestamp: nowIso,
              action: 'BOOKED',
              amountChanged: totalAmt,
              performedBy: operator.name,
              performedByRole: operator.role,
              notes:
                (effectiveBookingStatus === 'Pending Confirmation'
                  ? 'Booking request submitted (Pending Confirmation) ('
                  : 'Counter booking (') +
                customerId +
                ') by ' +
                operator.name,
            },
          ]),
        };

        firestoreSetDocument_(bookingDocPath, bookingObj);

        var invDocId = drawKey + '_' + encodeURIComponent(seriesId) + '_' + numStr;
        firestorePatchFields_('ticketInventory/' + encodeURIComponent(invDocId), {
          bookingStatus: effectiveBookingStatus,
          bookedTicketId: bookingDocId,
        });
        createdBookings.push({
          id: bookingObj.id,
          ticketNumber: bookingObj.ticketNumber,
          seriesTitle: bookingObj.seriesTitle,
          customerId: bookingObj.customerId,
          customerName: bookingObj.customerName,
          customerPhone: bookingObj.customerPhone,
          ticketType: bookingObj.ticketType,
          halfSelected: bookingObj.halfSelected,
          halfAmount: bookingObj.halfAmount,
          fullSelected: bookingObj.fullSelected,
          fullAmount: bookingObj.fullAmount,
          totalAmount: bookingObj.totalAmount,
          amountPaid: bookingObj.amountPaid,
          remainingBalance: bookingObj.remainingBalance,
          bookingStatus: bookingObj.bookingStatus,
          paymentStatus: bookingObj.paymentStatus,
          bookedBy: bookingObj.bookedBy,
          bookedByUsername: bookingObj.bookedByUsername,
          bookedByUid: bookingObj.bookedByUid,
          bookedByRole: bookingObj.bookedByRole,
          date: bookingObj.date,
          bookedAt: bookingObj.bookedAt,
        });
      }
    } finally {
      // 7. Always release the caller's temporary locks once booking completes or fails
      releaseOwnedLocksInternal_(drawKey, ticketNumsList, operator.uid);
    }

    // 8. Record audit event
    var auditDocId = 'book_' + operator.uid + '_' + now;
    firestoreSetDocument_('auditEvents/' + encodeURIComponent(auditDocId), {
      action: 'BOOKING_BATCH_CREATED',
      bookingBatchId: bookingBatchId,
      customerId: customerId,
      customerName: rawCustomerName,
      ticketNumbers: ticketNumsList.join(','),
      ticketCount: createdBookings.length,
      drawDate: drawDate,
      performedBy: operator.name,
      performedByUid: operator.uid,
      role: operator.role,
      timestampIso: nowIso,
    });

    var responsePayload = {
      success: true,
      bookedCount: createdBookings.length,
      customerId: customerId,
      customerName: rawCustomerName,
      customerPhone: rawCustomerPhone,
      ticketNumbers: ticketNumsList,
      bookings: createdBookings,
    };

    if (idempotencyKey) {
      firestoreSetDocument_('bookingIdempotency/' + encodeURIComponent(idempotencyKey), {
        idempotencyKey: idempotencyKey,
        uid: operator.uid,
        customerId: customerId,
        drawDate: drawDate,
        ticketNumbers: ticketNumsList.join(','),
        responseJson: JSON.stringify(responsePayload),
        createdAtIso: nowIso,
      });
    }

    return jsonResponse_(responsePayload);
  } finally {
    lock.releaseLock();
  }
}

/**
 * 10. Cancels a confirmed ticket booking (Admin or Paid Employee only):
 *     - Releases the confirmed ticket reservation `/draws/{drawDate}/series/{seriesId}/tickets/{ticketNumber}`
 *       and marks `/bookings/{bookingId}` as Cancelled while preserving the customer's permanent serial code.
 */
function handleCancelTicketBooking_(body) {
  var idToken = String(body.idToken || '').trim();
  if (!idToken) {
    return jsonResponse_({ success: false, error: 'Authentication required (missing ID token).' });
  }

  var operator = verifyOtpVerifiedOperator_(idToken);
  if (operator.role !== 'admin' && operator.role !== 'paid_employee') {
    return jsonResponse_({
      success: false,
      code: 'PERMISSION_DENIED',
      error: 'Permission Denied: Only Admin or Paid Employee can cancel bookings.',
    });
  }

  var drawDate = String(body.drawDate || '').trim();
  var seriesId = String(body.seriesId || 'default').trim() || 'default';
  var normNum = normalizeTicketNumber_(body.ticketNumber);
  var reason = String(body.reason || 'Booking cancelled').trim();

  if (!drawDate || !normNum) {
    return jsonResponse_({ success: false, error: 'drawDate and ticketNumber are required.' });
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var nowIso = new Date().toISOString();
    var drawKey = normalizeDrawDateKey_(drawDate);
    var ticketDocPath =
      'draws/' +
      encodeURIComponent(drawDate) +
      '/series/' +
      encodeURIComponent(seriesId) +
      '/tickets/' +
      encodeURIComponent(normNum);
    var bookingDocPath = 'bookings/' + encodeURIComponent('booking_' + drawKey + '_' + normNum);
    var lockDocPath = 'ticketLocks/' + encodeURIComponent(drawKey + '_' + normNum);

    var bookingDoc = firestoreGetDocument_(bookingDocPath);
    if (bookingDoc && bookingDoc.paymentStatus === 'Paid' && operator.role !== 'admin') {
      return jsonResponse_({
        success: false,
        code: 'PERMISSION_DENIED',
        error: 'Permission Denied: Confirmed Paid tickets can only be reversed by Admin.',
      });
    }

    firestoreDeleteDocument_(ticketDocPath);
    firestoreDeleteDocument_(lockDocPath);

    if (bookingDoc) {
      firestorePatchFields_(bookingDocPath, {
        bookingStatus: 'Cancelled',
        remainingBalance: 0,
        cancellationReason: reason,
        cancelledBy: operator.name,
        cancelledByRole: operator.role,
        cancelledAt: nowIso,
      });
    }

    return jsonResponse_({
      success: true,
      ticketNumber: normNum,
      drawDate: drawDate,
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * 11. Looks up a Customer record and all associated bookings by Customer Serial Code (e.g. `#5316`)
 */
function handleLookupCustomerBookings_(body) {
  var idToken = String(body.idToken || '').trim();
  if (!idToken) {
    return jsonResponse_({ success: false, error: 'Authentication required (missing ID token).' });
  }

  var operator = verifyOtpVerifiedOperator_(idToken);
  if (operator.role !== 'admin' && operator.role !== 'paid_employee') {
    return jsonResponse_({
      success: false,
      code: 'PERMISSION_DENIED',
      error: 'Permission Denied: Employees cannot query global customer directory records.',
    });
  }

  var rawCode = String(body.customerId || '').trim();
  var codeDigits = rawCode.replace(/^#/, '').trim();
  if (!/^\d{4,8}$/.test(codeDigits)) {
    return jsonResponse_({
      success: false,
      error: 'Please provide a valid Customer ID (e.g. #5316).',
    });
  }

  var formattedCode = '#' + codeDigits;
  var codeDoc = firestoreGetDocument_('customerCodes/' + encodeURIComponent(codeDigits));
  var customerDoc =
    codeDoc && codeDoc.customerKey
      ? firestoreGetDocument_('customers/' + encodeURIComponent(String(codeDoc.customerKey)))
      : null;

  return jsonResponse_({
    success: true,
    found: Boolean(codeDoc || customerDoc),
    customerId: formattedCode,
    customer: customerDoc || codeDoc || null,
  });
}

/**
 * 12. Paid Employee or Admin confirms a Pending Booking request.
 */
function handleConfirmPendingBooking_(body) {
  var idToken = String(body.idToken || '').trim();
  if (!idToken) {
    return jsonResponse_({ success: false, code: 'AUTH_REQUIRED', error: 'Authentication required.' });
  }
  var operator = verifyOtpVerifiedOperator_(idToken);
  if (operator.role !== 'paid_employee' && operator.role !== 'admin') {
    return jsonResponse_({
      success: false,
      code: 'PERMISSION_DENIED',
      error: 'Only Paid Employees or Admins can confirm pending bookings.',
    });
  }

  var bookingId = String(body.bookingId || '').trim();
  if (!bookingId) {
    return jsonResponse_({ success: false, error: 'bookingId is required.' });
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var bookingDocPath = 'bookings/' + encodeURIComponent(bookingId);
    var booking = firestoreGetDocument_(bookingDocPath);
    if (!booking) {
      return jsonResponse_({ success: false, code: 'NOT_FOUND', error: 'Booking not found.' });
    }

    if (booking.bookingStatus === 'Booked') {
      return jsonResponse_({ success: false, code: 'ALREADY_CONFIRMED', error: 'This booking is already confirmed.' });
    }

    if (booking.bookingStatus === 'Cancelled') {
      return jsonResponse_({ success: false, code: 'BOOKING_CANCELLED', error: 'Cannot confirm a cancelled booking.' });
    }

    var now = Date.now();
    var nowIso = new Date(now).toISOString();

    var history = [];
    try {
      history = typeof booking.history === 'string' ? JSON.parse(booking.history) : (booking.history || []);
    } catch(e) {
      history = [];
    }
    history.push({
      id: 'aud-conf-' + now,
      timestamp: nowIso,
      action: 'BOOKED',
      amountChanged: 0,
      performedBy: operator.name,
      performedByRole: operator.role,
      notes: 'Booking confirmed by Paid Employee (' + operator.name + ')',
    });

    firestorePatchFields_(bookingDocPath, {
      bookingStatus: 'Booked',
      confirmedAt: nowIso,
      confirmedBy: operator.name,
      confirmedByUid: operator.uid,
      confirmedByRole: operator.role,
      history: JSON.stringify(history),
    });

    var drawKey = normalizeDrawDateKey_(booking.date);
    var ticketDocPath =
      'draws/' +
      encodeURIComponent(booking.date) +
      '/series/' +
      encodeURIComponent(booking.seriesId || 'default') +
      '/tickets/' +
      encodeURIComponent(booking.ticketNumber);
    firestorePatchFields_(ticketDocPath, {
      bookingStatus: 'Booked',
      confirmedAt: nowIso,
      confirmedBy: operator.name,
      confirmedByUid: operator.uid,
    });

    var invDocId = drawKey + '_' + encodeURIComponent(booking.seriesId || 'default') + '_' + booking.ticketNumber;
    firestorePatchFields_('ticketInventory/' + encodeURIComponent(invDocId), {
      bookingStatus: 'Booked',
      bookedTicketId: bookingId,
    });

    return jsonResponse_({
      success: true,
      bookingId: bookingId,
      ticketNumber: booking.ticketNumber,
      customerId: booking.customerId,
      bookingStatus: 'Booked',
      confirmedBy: operator.name,
      confirmedAt: nowIso,
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * 13. Admin publishes ticket inventory for a draw date and series.
 */
function handlePublishTicketInventory_(body) {
  var idToken = String(body.idToken || '').trim();
  if (!idToken) {
    return jsonResponse_({ success: false, code: 'AUTH_REQUIRED', error: 'Authentication required.' });
  }
  var operator = verifyOtpVerifiedOperator_(idToken);
  if (operator.role !== 'admin') {
    return jsonResponse_({ success: false, code: 'PERMISSION_DENIED', error: 'Only Admins can publish ticket inventory.' });
  }

  var drawDate = String(body.drawDate || '').trim();
  var seriesId = String(body.seriesId || 'default').trim() || 'default';
  var seriesTitle = String(body.seriesTitle || 'CARROM GOLD').trim();
  var publishStatus = String(body.status || 'PUBLISHED').toUpperCase() === 'UNPUBLISHED' ? 'UNPUBLISHED' : 'PUBLISHED';
  var rawTickets = Array.isArray(body.tickets) ? body.tickets.slice() : [];

  if (!drawDate) {
    return jsonResponse_({ success: false, error: 'drawDate is required.' });
  }

  if (body.range) {
    var rStart = 0;
    var rEnd = 0;
    if (typeof body.range === 'string') {
      var parts = body.range.split('-');
      if (parts.length === 2) {
        rStart = parseInt(parts[0], 10);
        rEnd = parseInt(parts[1], 10);
      }
    } else if (typeof body.range === 'object') {
      rStart = parseInt(body.range.start, 10);
      rEnd = parseInt(body.range.end, 10);
    }
    if (!isNaN(rStart) && !isNaN(rEnd) && rEnd >= rStart && (rEnd - rStart) <= 1000) {
      for (var r = rStart; r <= rEnd; r++) {
        rawTickets.push(String(r).padStart(4, '0'));
      }
    }
  }

  if (!rawTickets.length) {
    return jsonResponse_({ success: false, error: 'At least one ticket number or valid range is required.' });
  }

  var drawKey = normalizeDrawDateKey_(drawDate);
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var now = Date.now();
    var nowIso = new Date(now).toISOString();
    var added = [];
    var skipped = [];
    var seen = {};

    for (var i = 0; i < rawTickets.length; i++) {
      var normNum = normalizeTicketNumber_(rawTickets[i]);
      if (!normNum || seen[normNum]) continue;
      seen[normNum] = true;

      if (isTicketConfirmedOnServer_(drawDate, seriesId, normNum)) {
        skipped.push({ ticketNumber: normNum, reason: 'ALREADY_BOOKED' });
        continue;
      }

      var invDocId = drawKey + '_' + encodeURIComponent(seriesId) + '_' + normNum;
      var invPath = 'ticketInventory/' + encodeURIComponent(invDocId);

      var existing = firestoreGetDocument_(invPath);
      if (existing && existing.bookingStatus === 'Booked') {
        skipped.push({ ticketNumber: normNum, reason: 'ALREADY_BOOKED' });
        continue;
      }

      var invItem = {
        id: invDocId,
        ticketNumber: normNum,
        drawDate: drawDate,
        drawKey: drawKey,
        seriesId: seriesId,
        seriesTitle: seriesTitle || (existing && existing.seriesTitle) || 'CARROM GOLD',
        status: publishStatus,
        bookingStatus: (existing && existing.bookingStatus) ? existing.bookingStatus : 'Available',
        createdAtIso: (existing && existing.createdAtIso) ? existing.createdAtIso : nowIso,
        publishedAtIso: publishStatus === 'PUBLISHED' ? nowIso : null,
        createdByUid: operator.uid,
        createdByName: operator.name,
      };

      firestoreSetDocument_(invPath, invItem);
      added.push(invItem);
    }

    return jsonResponse_({
      success: true,
      drawDate: drawDate,
      seriesId: seriesId,
      status: publishStatus,
      addedCount: added.length,
      skippedCount: skipped.length,
      tickets: added,
      skipped: skipped,
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * 14. Query ticket inventory.
 */
function handleGetTicketInventory_(body) {
  var idToken = String(body.idToken || '').trim();
  if (!idToken) {
    return jsonResponse_({ success: false, code: 'AUTH_REQUIRED', error: 'Authentication required.' });
  }
  var operator = verifyOtpVerifiedOperator_(idToken);
  var drawDate = String(body.drawDate || '').trim();
  var seriesId = String(body.seriesId || '').trim();

  if (!drawDate) {
    return jsonResponse_({ success: false, error: 'drawDate is required.' });
  }

  var drawKey = normalizeDrawDateKey_(drawDate);
  var docs = firestoreListDocuments_('ticketInventory');
  var results = [];

  for (var i = 0; i < docs.length; i++) {
    var doc = docs[i];
    if (doc.drawKey === drawKey) {
      if (seriesId && doc.seriesId !== seriesId) continue;
      if (operator.role !== 'admin' && doc.status !== 'PUBLISHED') continue;
      results.push(doc);
    }
  }

  results.sort(function(a, b) {
    return Number(a.ticketNumber) - Number(b.ticketNumber);
  });

  return jsonResponse_({
    success: true,
    drawDate: drawDate,
    seriesId: seriesId,
    tickets: results,
  });
}

/**
 * 15. Unpublish a ticket from inventory (Admin only).
 */
function handleUnpublishTicketInventory_(body) {
  var idToken = String(body.idToken || '').trim();
  if (!idToken) {
    return jsonResponse_({ success: false, code: 'AUTH_REQUIRED', error: 'Authentication required.' });
  }
  var operator = verifyOtpVerifiedOperator_(idToken);
  if (operator.role !== 'admin') {
    return jsonResponse_({ success: false, code: 'PERMISSION_DENIED', error: 'Only Admins can unpublish tickets.' });
  }

  var drawDate = String(body.drawDate || '').trim();
  var seriesId = String(body.seriesId || 'default').trim() || 'default';
  var ticketNumber = normalizeTicketNumber_(body.ticketNumber);

  if (!drawDate || !ticketNumber) {
    return jsonResponse_({ success: false, error: 'drawDate and ticketNumber are required.' });
  }

  var drawKey = normalizeDrawDateKey_(drawDate);
  var invDocId = drawKey + '_' + encodeURIComponent(seriesId) + '_' + ticketNumber;
  var invPath = 'ticketInventory/' + encodeURIComponent(invDocId);

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var existing = firestoreGetDocument_(invPath);
    if (!existing) {
      return jsonResponse_({ success: false, error: 'Ticket not found in inventory.' });
    }

    if (existing.bookingStatus === 'Booked') {
      return jsonResponse_({
        success: false,
        code: 'ALREADY_BOOKED',
        error: 'Cannot unpublish ticket #' + ticketNumber + ' because it has already been confirmed as booked.',
      });
    }

    firestorePatchFields_(invPath, {
      status: 'UNPUBLISHED',
      publishedAtIso: null,
    });

    return jsonResponse_({
      success: true,
      ticketNumber: ticketNumber,
      status: 'UNPUBLISHED',
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Verifies that the caller is an authenticated, OTP-verified operator and returns their server-authoritative profile.
 */
function verifyOtpVerifiedOperator_(idToken) {
  var authUser = verifyFirebaseIdToken_(idToken);
  var uid = authUser.uid;
  var userDoc = firestoreGetDocument_('users/' + encodeURIComponent(uid));

  var isPendingUnverified =
    (authUser.claims && authUser.claims.otpVerified === false) ||
    (userDoc && userDoc.registrationCompleted === false && userDoc.otpVerified !== true && userDoc.verified !== true);

  var isVerified =
    !isPendingUnverified &&
    Boolean(
      (authUser.claims && authUser.claims.otpVerified === true) ||
        (userDoc && (userDoc.otpVerified === true || userDoc.verified === true))
    );

  if (!isVerified) {
    throw new Error('Unauthorized: Account must be OTP-verified before accessing ticket locks or bookings.');
  }

  var role = normalizeRole_(
    (userDoc && userDoc.role) || (authUser.claims && authUser.claims.role) || 'employee'
  );
  var name = String(
    (userDoc && (userDoc.displayName || userDoc.name)) ||
      (authUser.email ? authUser.email.split('@')[0] : 'Operator')
  );
  var username = String((userDoc && userDoc.username) || '').trim().toLowerCase();

  return {
    uid: uid,
    email: authUser.email,
    role: role,
    name: name,
    username: username,
  };
}

function normalizeTicketNumber_(num) {
  var str = String(num !== undefined && num !== null ? num : '').trim();
  if (!/^\d{1,4}$/.test(str)) return '';
  while (str.length < 4) str = '0' + str;
  return str;
}

function normalizeDrawDateKey_(drawDate) {
  return String(drawDate || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '_');
}

function isTicketConfirmedOnServer_(drawDate, seriesId, normNum) {
  var drawKey = normalizeDrawDateKey_(drawDate);
  var ticketDocPath =
    'draws/' +
    encodeURIComponent(drawDate) +
    '/series/' +
    encodeURIComponent(seriesId) +
    '/tickets/' +
    encodeURIComponent(normNum);
  var ticketDoc = firestoreGetDocument_(ticketDocPath);
  if (
    ticketDoc &&
    (ticketDoc.bookingStatus === 'Booked' ||
      ticketDoc.bookingStatus === 'Pending Confirmation')
  ) {
    return true;
  }

  var bookingDocPath = 'bookings/' + encodeURIComponent('booking_' + drawKey + '_' + normNum);
  var bookingDoc = firestoreGetDocument_(bookingDocPath);
  if (
    bookingDoc &&
    (bookingDoc.bookingStatus === 'Booked' ||
      bookingDoc.bookingStatus === 'Pending Confirmation')
  ) {
    return true;
  }

  return false;
}

function releaseOwnedLocksInternal_(drawKey, ticketNums, ownerUid) {
  for (var i = 0; i < ticketNums.length; i++) {
    var num = ticketNums[i];
    var lockDocPath = 'ticketLocks/' + encodeURIComponent(drawKey + '_' + num);
    var existing = firestoreGetDocument_(lockDocPath);
    if (existing && String(existing.lockedByUid) === String(ownerUid)) {
      firestoreDeleteDocument_(lockDocPath);
    }
  }
}

/**
 * Resolves an existing Customer Serial Code (`#XXXX`) or generates a new unique, collision-free code.
 * - Reuses existing customer identity when reliable matching information (`normalizedPhone + normalizedName`)
 *   or a verified `requestedCustomerId` matches.
 * - Never merges customers based only on similar names.
 * - Never uses a ticket number as a customer serial code.
 */
function resolveOrCreateCustomerRecord_(params) {
  var rawName = String(params.customerName || '').trim();
  var rawPhone = String(params.customerPhone || '').trim();
  var normName = rawName.toLowerCase().replace(/\s+/g, ' ');
  var normPhone = rawPhone.replace(/\D/g, '');
  var requestedCodeDigits = String(params.requestedCustomerId || '')
    .replace(/^#/, '')
    .trim();
  var ticketNumbers = params.ticketNumbers || [];
  var nowIso = params.nowIso || new Date().toISOString();
  var operator = params.operator || {};

  // 1. If an explicit existing Customer ID (#XXXX) was provided, verify it exists and matches
  if (/^\d{4,8}$/.test(requestedCodeDigits)) {
    var existingByCode = firestoreGetDocument_(
      'customerCodes/' + encodeURIComponent(requestedCodeDigits)
    );
    if (existingByCode && existingByCode.customerKey) {
      var custByCodePath = 'customers/' + encodeURIComponent(String(existingByCode.customerKey));
      var custByCodeDoc = firestoreGetDocument_(custByCodePath);
      if (custByCodeDoc) {
        // Verify not impersonating a different customer when phone is provided
        var storedPhone = String(custByCodeDoc.normalizedPhone || '');
        if (!normPhone || !storedPhone || normPhone === storedPhone) {
          var updatedCount =
            Number(custByCodeDoc.totalBookings || 0) + Number(params.bookingCountIncrement || 1);
          firestorePatchFields_(custByCodePath, {
            totalBookings: updatedCount,
            updatedAtIso: nowIso,
          });
          return {
            customerId: String(custByCodeDoc.customerId),
            customerKey: String(existingByCode.customerKey),
          };
        }
      }
    }
  }

  // 2. Reliable identity matching: requires both a valid phone number (>= 6 digits) AND exact normalized name.
  //    Never merges customers based on name alone or similar names with different phone numbers.
  var hasReliableIdentity = normPhone.length >= 6 && normName.length >= 2;
  var customerKey = hasReliableIdentity
    ? 'cust_' + sha256Hex_(normPhone + '::' + normName).substring(0, 32)
    : 'cust_single_' + Utilities.getUuid().replace(/-/g, '');

  var customerDocPath = 'customers/' + encodeURIComponent(customerKey);
  if (hasReliableIdentity) {
    var existingCustomer = firestoreGetDocument_(customerDocPath);
    if (existingCustomer && existingCustomer.customerId) {
      var nextTotal =
        Number(existingCustomer.totalBookings || 0) + Number(params.bookingCountIncrement || 1);
      firestorePatchFields_(customerDocPath, {
        totalBookings: nextTotal,
        updatedAtIso: nowIso,
      });
      return {
        customerId: String(existingCustomer.customerId),
        customerKey: customerKey,
      };
    }
  }

  // 3. First-time customer: allocate a new unique serial code (#5316, #5317, ...) inside LockService
  var counterPath = 'config/customerCodeCounter';
  var counterDoc = firestoreGetDocument_(counterPath);
  var lastSerial =
    counterDoc && Number(counterDoc.lastSerial) >= CUSTOMER_CODE_BASE
      ? Number(counterDoc.lastSerial)
      : CUSTOMER_CODE_BASE;

  var candidateSerial = lastSerial;
  var allocatedDigits = '';

  while (!allocatedDigits) {
    candidateSerial += 1;
    var candidateStr = String(candidateSerial);
    while (candidateStr.length < 4) candidateStr = '0' + candidateStr;

    // Never allow a customer serial code to match any ticket number being booked
    var matchesTicket = false;
    for (var i = 0; i < ticketNumbers.length; i++) {
      if (String(ticketNumbers[i]) === candidateStr) {
        matchesTicket = true;
        break;
      }
    }
    if (matchesTicket) continue;

    // Ensure code is not already assigned in /customerCodes/{codeDigits}
    var existingCodeDoc = firestoreGetDocument_(
      'customerCodes/' + encodeURIComponent(candidateStr)
    );
    if (!existingCodeDoc) {
      allocatedDigits = candidateStr;
    }
  }

  var formattedCustomerId = '#' + allocatedDigits;

  firestoreSetDocument_(counterPath, {
    lastSerial: candidateSerial,
    updatedAtIso: nowIso,
  });

  firestoreSetDocument_('customerCodes/' + encodeURIComponent(allocatedDigits), {
    customerId: formattedCustomerId,
    customerCodeDigits: allocatedDigits,
    customerKey: customerKey,
    customerName: rawName,
    customerPhone: rawPhone,
    createdAtIso: nowIso,
  });

  firestoreSetDocument_(customerDocPath, {
    customerId: formattedCustomerId,
    customerCodeDigits: allocatedDigits,
    customerKey: customerKey,
    customerName: rawName,
    normalizedName: normName,
    customerPhone: rawPhone,
    normalizedPhone: normPhone,
    totalBookings: Number(params.bookingCountIncrement || 1),
    createdByUid: String(operator.uid || ''),
    createdByName: String(operator.name || ''),
    createdByUsername: String(operator.username || ''),
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
  });

  return {
    customerId: formattedCustomerId,
    customerKey: customerKey,
  };
}

/**
 * Verifies the client's Firebase Auth ID token using Google Identity Toolkit (`accounts:lookup`)
 * Checks signature, expiration, project audience, and disabled status.
 */
function verifyFirebaseIdToken_(idToken) {
  var webApiKey = getWebApiKey_();
  var url =
    'https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' +
    encodeURIComponent(webApiKey);
  var res = safeFetch_(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ idToken: idToken }),
  });

  if (res.getResponseCode() !== 200) {
    throw new Error('Invalid or expired Firebase authentication token.');
  }

  var data = JSON.parse(res.getContentText());
  if (!data || !data.users || !data.users.length) {
    throw new Error('Authenticated user record not found.');
  }

  var u = data.users[0];
  if (u.disabled === true) {
    throw new Error('This user account has been disabled.');
  }

  var claims = {};
  if (u.customAttributes) {
    try {
      claims = JSON.parse(u.customAttributes);
    } catch (e) {}
  }

  return {
    uid: String(u.localId),
    email: String(u.email || ''),
    emailVerified: Boolean(u.emailVerified),
    claims: claims,
  };
}

/**
 * Merges and sets `verified: true`, `otpVerified: true`, `registrationCompleted: true`, and `role`
 * in Firebase Auth Custom Claims (`customAttributes`)
 */
function setFirebaseUserVerifiedClaims_(uid, existingClaims, role, verifiedAtMs) {
  var projectId = getProjectId_();
  var token = getAdminAccessToken_();
  var url =
    'https://identitytoolkit.googleapis.com/v1/projects/' +
    encodeURIComponent(projectId) +
    '/accounts:update';

  var mergedClaims = {};
  if (existingClaims && typeof existingClaims === 'object') {
    for (var k in existingClaims) {
      if (Object.prototype.hasOwnProperty.call(existingClaims, k)) {
        mergedClaims[k] = existingClaims[k];
      }
    }
  }
  mergedClaims.role = normalizeRole_(role);
  mergedClaims.verified = true;
  mergedClaims.otpVerified = true;
  mergedClaims.registrationCompleted = true;
  mergedClaims.otpVerifiedAt = verifiedAtMs;

  var res = safeFetch_(url, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token },
    payload: JSON.stringify({
      localId: uid,
      emailVerified: true,
      customAttributes: JSON.stringify(mergedClaims),
    }),
  });

  if (res.getResponseCode() !== 200) {
    throw new Error('Failed to update Firebase Auth verification claims (HTTP ' + res.getResponseCode() + ').');
  }
}

/**
 * Safe server-side provisioning function for the Carrom Lottery Desk Admin account.
 * - Looks up the existing Firebase Authentication account for `carromlotterydesk@gmail.com`.
 * - Verifies the account's Firebase UID before assigning the role.
 * - Stamps server-signed custom claims (`role: 'admin'`, `verified: true`, `otpVerified: true`).
 * - Provisions `/users/{uid}` and `/userDirectory/sasikaran` in Firestore.
 * - Plaintext passwords are never stored in any database; Firebase Authentication validates credentials.
 */
function provisionAdminAccount_(optionalProvidedUid) {
  var projectId = getProjectId_();
  var adminEmail = (getAdminEmail_() || OTP_RECIPIENT_EMAIL || 'carromlotterydesk@gmail.com').toLowerCase();
  var token = getAdminAccessToken_();
  var targetUid = String(optionalProvidedUid || '').trim();

  if (!targetUid) {
    // Look up the account by email via Identity Toolkit Admin REST API
    var lookupUrl =
      'https://identitytoolkit.googleapis.com/v1/projects/' +
      encodeURIComponent(projectId) +
      '/accounts:lookup';
    var lookupRes = safeFetch_(lookupUrl, {
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + token },
      payload: JSON.stringify({ email: [adminEmail] }),
    });

    if (lookupRes.getResponseCode() !== 200) {
      throw new Error(
        'Failed to query Identity Toolkit accounts:lookup (HTTP ' + lookupRes.getResponseCode() + ').'
      );
    }

    var lookupData = JSON.parse(lookupRes.getContentText() || '{}');
    if (!lookupData.users || lookupData.users.length === 0) {
      return {
        success: false,
        error:
          'Admin Firebase Auth account "' + adminEmail + '" does not exist in project "' + projectId +
          '". Please create it in Firebase Console -> Authentication -> Users.',
        exists: false,
      };
    }

    targetUid = String(lookupData.users[0].localId || '').trim();
  }

  if (!targetUid) {
    throw new Error('Unable to determine Firebase Auth UID for Admin account.');
  }

  var now = Date.now();
  var nowIso = new Date(now).toISOString();

  // 1. Stamp authoritative custom claims: role: 'admin', verified: true, otpVerified: true
  setFirebaseUserVerifiedClaims_(targetUid, { role: 'admin' }, 'admin', now);

  // 2. Create or update /users/{uid}
  firestorePatchFields_('users/' + encodeURIComponent(targetUid), {
    uid: targetUid,
    email: adminEmail,
    name: 'Sasikaran',
    displayName: 'Sasikaran',
    username: 'sasikaran',
    role: 'admin',
    verified: true,
    otpVerified: true,
    registrationCompleted: true,
    firstLoginCompleted: true,
    updatedAt: nowIso,
  });

  // 3. Create or update /userDirectory/sasikaran
  firestorePatchFields_('userDirectory/sasikaran', {
    username: 'sasikaran',
    uid: targetUid,
    email: adminEmail,
    role: 'admin',
    displayName: 'Sasikaran',
    verified: true,
    otpVerified: true,
    registrationCompleted: true,
    updatedAtIso: nowIso,
  });

  // 4. Record security audit event
  var auditId = 'admin_prov_' + targetUid + '_' + now;
  firestoreSetDocument_('auditEvents/' + encodeURIComponent(auditId), {
    action: 'ADMIN_ACCOUNT_PROVISIONED',
    uid: targetUid,
    username: 'sasikaran',
    email: adminEmail,
    role: 'admin',
    timestampIso: nowIso,
  });

  return {
    success: true,
    uid: targetUid,
    email: adminEmail,
    username: 'sasikaran',
    role: 'admin',
    verified: true,
    otpVerified: true,
  };
}

/**
 * Sets initial unverified custom claims (`role: 'employee'`, `verified: false`, `otpVerified: false`, `registrationCompleted: false`)
 * on a newly registered account awaiting Sign-Up OTP verification
 */
function setFirebaseUserInitialClaims_(uid, role) {
  var projectId = getProjectId_();
  var token = getAdminAccessToken_();
  var url =
    'https://identitytoolkit.googleapis.com/v1/projects/' +
    encodeURIComponent(projectId) +
    '/accounts:update';

  var cleanRole = role === 'paid_employee' ? 'paid_employee' : 'employee';
  var initialClaims = {
    role: cleanRole,
    verified: false,
    otpVerified: false,
    registrationCompleted: false,
  };

  var res = safeFetch_(url, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token },
    payload: JSON.stringify({
      localId: uid,
      emailVerified: false,
      customAttributes: JSON.stringify(initialClaims),
    }),
  });

  if (res.getResponseCode() !== 200) {
    throw new Error('Failed to initialize Firebase Auth claims (HTTP ' + res.getResponseCode() + ').');
  }
}

/**
 * Deletes an orphaned/unprofiled Firebase Auth account if server-side registration validation or username uniqueness fails
 */
function deleteFirebaseAuthUser_(uid) {
  if (!uid) return;
  try {
    var projectId = getProjectId_();
    var token = getAdminAccessToken_();
    var url =
      'https://identitytoolkit.googleapis.com/v1/projects/' +
      encodeURIComponent(projectId) +
      '/accounts:delete';
    safeFetch_(url, {
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + token },
      payload: JSON.stringify({ localId: String(uid) }),
    });
  } catch (e) {
    // Best-effort cleanup; client also calls user.delete()
  }
}

/**
 * Sends the 6-digit registration approval OTP email exclusively from carromlotterydesk@gmail.com
 * to carromlotterydesk@gmail.com.
 * Enforces both fixed sender and fixed recipient on the server; never accepts a recipient from the client
 * or sends registration OTPs to the employee's submitted email address.
 */
function sendOtpEmail_(otpCode, accountContext) {
  var effectiveEmail = String(Session.getEffectiveUser().getEmail() || '').trim().toLowerCase();
  if (effectiveEmail && effectiveEmail !== OTP_SENDER_EMAIL.toLowerCase()) {
    throw new Error(
      'Sender mismatch: Apps Script must be deployed under ' + OTP_SENDER_EMAIL + '.'
    );
  }

  var fixedRecipient = OTP_RECIPIENT_EMAIL;
  if (fixedRecipient !== 'carromlotterydesk@gmail.com') {
    throw new Error('Recipient mismatch: OTP destination must be carromlotterydesk@gmail.com.');
  }

  var ctx = accountContext || {};
  var applicantName = String(ctx.fullName || 'New Applicant');
  var applicantUsername = String(ctx.username || 'N/A');
  var applicantEmail = String(ctx.email || 'N/A');
  var applicantRoleLabel = ctx.role === 'paid_employee' ? 'Paid Employee' : 'Employee';

  var subject = 'Carrom Lottery Desk - ' + applicantRoleLabel + ' Registration Approval OTP (' + applicantUsername + ')';
  var plainBody = [
    'Carrom Lottery Ticket Supply Management Platform',
    '',
    'A new ' + applicantRoleLabel + ' account registration requires administrator OTP approval:',
    '  Full Name: ' + applicantName,
    '  Username:  ' + applicantUsername,
    '  Role:      ' + applicantRoleLabel,
    '  Email:     ' + applicantEmail,
    '',
    'The 6-digit verification code (OTP) to approve and complete this registration is:',
    '',
    '    ' + otpCode,
    '',
    'This code expires in 5 minutes. Do not share this code with unauthorized persons.',
    '',
    'Sender: ' + OTP_SENDER_EMAIL,
    'Recipient: ' + fixedRecipient,
  ].join('\n');

  var htmlBody = [
    '<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;background:#ffffff;">',
    '<h2 style="margin:0 0 8px;color:#0f172a;font-size:18px;">Carrom Lottery Registration Approval</h2>',
    '<p style="margin:0 0 12px;color:#475569;font-size:14px;">A new ' + applicantRoleLabel + ' account registration is awaiting administrator OTP verification:</p>',
    '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin-bottom:16px;font-size:12px;color:#334155;">',
    '<div><strong>Full Name:</strong> ' + applicantName + '</div>',
    '<div><strong>Username:</strong> ' + applicantUsername + '</div>',
    '<div><strong>Role:</strong> ' + applicantRoleLabel + '</div>',
    '<div><strong>Applicant Email:</strong> ' + applicantEmail + '</div>',
    '</div>',
    '<div style="background:#f8fafc;border:2px dashed #0284c7;border-radius:10px;padding:16px;text-align:center;margin-bottom:16px;">',
    '<span style="font-size:28px;font-weight:700;letter-spacing:8px;color:#0369a1;font-family:monospace;">' +
      otpCode +
      '</span>',
    '</div>',
    '<p style="margin:0 0 8px;color:#64748b;font-size:12px;">This verification code will expire in <strong>5 minutes</strong>.</p>',
    '<p style="margin:0;color:#94a3b8;font-size:11px;">Sender: ' + OTP_SENDER_EMAIL + ' | Recipient: ' + fixedRecipient + '</p>',
    '</div>',
  ].join('');

  GmailApp.sendEmail(fixedRecipient, subject, plainBody, {
    htmlBody: htmlBody,
    name: 'Carrom Lottery Security Desk',
  });
}

/**
 * Deletes a Firestore document via Admin REST API (used during registration rollback)
 */
function firestoreDeleteDocument_(docPath) {
  if (!docPath) return;
  try {
    var projectId = getProjectId_();
    var token = getAdminAccessToken_();
    var url =
      'https://firestore.googleapis.com/v1/projects/' +
      encodeURIComponent(projectId) +
      '/databases/(default)/documents/' +
      docPath;
    safeFetch_(url, {
      method: 'delete',
      headers: { Authorization: 'Bearer ' + token },
    });
  } catch (e) {}
}

/**
 * Reads a Firestore document via Admin REST API (bypasses client security rules)
 */
function firestoreGetDocument_(docPath) {
  var projectId = getProjectId_();
  var token = getAdminAccessToken_();
  var url =
    'https://firestore.googleapis.com/v1/projects/' +
    encodeURIComponent(projectId) +
    '/databases/(default)/documents/' +
    docPath;

  var res = safeFetch_(url, {
    method: 'get',
    headers: { Authorization: 'Bearer ' + token },
  });

  if (res.getResponseCode() === 404) {
    return null;
  }
  if (res.getResponseCode() !== 200) {
    throw new Error('Firestore read error (HTTP ' + res.getResponseCode() + ').');
  }

  var rawDoc = JSON.parse(res.getContentText());
  return fromFirestoreFields_(rawDoc.fields || {});
}

/**
 * Replaces a Firestore document via Admin REST API (used for server-owned /otpChallenges and /auditEvents)
 */
function firestoreSetDocument_(docPath, dataObj) {
  var projectId = getProjectId_();
  var token = getAdminAccessToken_();
  var url =
    'https://firestore.googleapis.com/v1/projects/' +
    encodeURIComponent(projectId) +
    '/databases/(default)/documents/' +
    docPath;

  var res = safeFetch_(url, {
    method: 'patch',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token },
    payload: JSON.stringify({ fields: toFirestoreFields_(dataObj) }),
  });

  if (res.getResponseCode() !== 200) {
    throw new Error('Firestore write error (HTTP ' + res.getResponseCode() + ').');
  }
}

/**
 * Partially updates ONLY specified fields on a Firestore document using updateMask.fieldPaths,
 * preserving all other existing fields (such as createdAt timestamps) on `/users/{uid}`.
 */
function firestorePatchFields_(docPath, fieldsObj) {
  var projectId = getProjectId_();
  var token = getAdminAccessToken_();
  var keys = [];
  for (var k in fieldsObj) {
    if (Object.prototype.hasOwnProperty.call(fieldsObj, k) && fieldsObj[k] !== undefined) {
      keys.push('updateMask.fieldPaths=' + encodeURIComponent(k));
    }
  }
  var queryString = keys.length ? '?' + keys.join('&') : '';
  var url =
    'https://firestore.googleapis.com/v1/projects/' +
    encodeURIComponent(projectId) +
    '/databases/(default)/documents/' +
    docPath +
    queryString;

  var res = safeFetch_(url, {
    method: 'patch',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token },
    payload: JSON.stringify({ fields: toFirestoreFields_(fieldsObj) }),
  });

  if (res.getResponseCode() !== 200) {
    throw new Error('Firestore patch error (HTTP ' + res.getResponseCode() + ').');
  }
}

/**
 * Queries `/users` collection by `username` field via Firestore Admin runQuery REST API
 */
function firestoreFindUserByUsername_(usernameLower) {
  var projectId = getProjectId_();
  var token = getAdminAccessToken_();
  var url =
    'https://firestore.googleapis.com/v1/projects/' +
    encodeURIComponent(projectId) +
    '/databases/(default)/documents:runQuery';

  var queryPayload = {
    structuredQuery: {
      from: [{ collectionId: 'users' }],
      where: {
        fieldFilter: {
          field: { fieldPath: 'username' },
          op: 'EQUAL',
          value: { stringValue: usernameLower },
        },
      },
      limit: 1,
    },
  };

  var res = safeFetch_(url, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token },
    payload: JSON.stringify(queryPayload),
  });

  if (res.getResponseCode() !== 200) {
    return null;
  }

  var rows = JSON.parse(res.getContentText());
  if (!rows || !rows.length || !rows[0].document) {
    return null;
  }

  var docObj = fromFirestoreFields_(rows[0].document.fields || {});
  if (!docObj.uid && rows[0].document.name) {
    var parts = String(rows[0].document.name).split('/');
    docObj.uid = parts[parts.length - 1];
  }
  return docObj;
}

/**
 * Parses and validates the Service Account JSON from Script Properties,
 * ensuring `project_id` strictly matches `carrom-df56a`.
 */
function getValidatedServiceAccount_() {
  var props = PropertiesService.getScriptProperties();
  var saJson = props.getProperty('FIREBASE_SERVICE_ACCOUNT_JSON');

  if (!saJson) {
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_JSON in Script Properties.');
  }

  var sa;
  try {
    sa = JSON.parse(saJson);
  } catch (e) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.');
  }

  if (!sa || !sa.client_email || !sa.private_key || !sa.project_id) {
    throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_JSON: missing project_id, client_email, or private_key.');
  }

  var expectedProjectId = getProjectId_();
  if (String(sa.project_id).trim() !== expectedProjectId) {
    throw new Error(
      'Service Account project_id (' +
        String(sa.project_id).trim() +
        ') does not match target project (' +
        expectedProjectId +
        ').'
    );
  }

  return sa;
}

/**
 * Obtains an OAuth2 Admin Access Token using the validated Firebase Service Account JSON.
 */
function getAdminAccessToken_() {
  var cache = CacheService.getScriptCache();
  var cached = cache.get('CARROM_SA_ACCESS_TOKEN');
  if (cached) return cached;

  var sa = getValidatedServiceAccount_();
  var nowSec = Math.floor(Date.now() / 1000);
  var header = { alg: 'RS256', typ: 'JWT' };
  var claimSet = {
    iss: sa.client_email,
    sub: sa.client_email,
    scope:
      'https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/identitytoolkit https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    iat: nowSec,
    exp: nowSec + 3600,
  };

  var unsignedJwt =
    base64UrlEncode_(JSON.stringify(header)) +
    '.' +
    base64UrlEncode_(JSON.stringify(claimSet));
  var signatureBytes = Utilities.computeRsaSha256Signature(unsignedJwt, sa.private_key);
  var signedJwt = unsignedJwt + '.' + base64UrlEncodeBytes_(signatureBytes);

  var tokenRes = safeFetch_('https://oauth2.googleapis.com/token', {
    method: 'post',
    payload: {
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: signedJwt,
    },
  });

  if (tokenRes.getResponseCode() !== 200) {
    throw new Error('Service Account OAuth token exchange failed (HTTP ' + tokenRes.getResponseCode() + ').');
  }

  var tokenData = JSON.parse(tokenRes.getContentText());
  if (!tokenData || !tokenData.access_token) {
    throw new Error('Service Account OAuth response did not include access_token.');
  }

  cache.put('CARROM_SA_ACCESS_TOKEN', tokenData.access_token, 3000);
  return tokenData.access_token;
}

function getProjectId_() {
  var props = PropertiesService.getScriptProperties();
  var configured = (props.getProperty('FIREBASE_PROJECT_ID') || EXPECTED_PROJECT_ID).trim();
  if (configured !== EXPECTED_PROJECT_ID) {
    throw new Error('FIREBASE_PROJECT_ID must be set to ' + EXPECTED_PROJECT_ID + '.');
  }
  return configured;
}

function getAdminEmail_() {
  return OTP_RECIPIENT_EMAIL || 'carromlotterydesk@gmail.com';
}

function getWebApiKey_() {
  var props = PropertiesService.getScriptProperties();
  var key = props.getProperty('FIREBASE_WEB_API_KEY');
  if (!key || !key.trim()) {
    throw new Error('Missing FIREBASE_WEB_API_KEY in Script Properties.');
  }
  return key.trim();
}

function normalizeRole_(role) {
  var r = String(role || '').trim();
  return ALLOWED_ROLES[r] ? r : 'employee';
}

/**
 * Wrapper around UrlFetchApp.fetch that forces muteHttpExceptions and strips any URL query secrets if an exception occurs.
 */
function safeFetch_(url, options) {
  var opts = {};
  if (options) {
    for (var k in options) {
      if (Object.prototype.hasOwnProperty.call(options, k)) {
        opts[k] = options[k];
      }
    }
  }
  opts.muteHttpExceptions = true;
  try {
    return UrlFetchApp.fetch(url, opts);
  } catch (err) {
    throw new Error('Upstream network request failed.');
  }
}

/**
 * Redacts any accidental key, token, or private key patterns from error strings.
 */
function sanitizeErrorMessage_(msg) {
  return String(msg || 'Request failed.')
    .replace(/key=[A-Za-z0-9_\-]+/gi, 'key=[REDACTED]')
    .replace(/AIza[A-Za-z0-9_\-]+/g, '[REDACTED_API_KEY]')
    .replace(/-----BEGIN[^]+?-----END[^]+?-----/g, '[REDACTED_KEY]')
    .replace(/Bearer\s+[A-Za-z0-9._\-]+/gi, 'Bearer [REDACTED]');
}

/**
 * Generates an unbiased 6-digit OTP using rejection sampling (`000000` - `999999`).
 */
function generateSixDigitOtp_() {
  var maxUnbiased = 4294000000; // Largest multiple of 1,000,000 below 2^32 (4,294,967,296)
  while (true) {
    var hex = Utilities.getUuid().replace(/-/g, '').substring(0, 8);
    var val = parseInt(hex, 16);
    if (val < maxUnbiased) {
      var num = val % 1000000;
      var str = String(num);
      while (str.length < 6) str = '0' + str;
      return str;
    }
  }
}

function sha256Hex_(input) {
  var digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    input,
    Utilities.Charset.UTF_8
  );
  var hex = '';
  for (var i = 0; i < digest.length; i++) {
    var b = (digest[i] + 256) % 256;
    var h = b.toString(16);
    hex += h.length === 1 ? '0' + h : h;
  }
  return hex;
}

function constantTimeEqual_(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) {
    return false;
  }
  var diff = 0;
  for (var i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function maskEmail_(email) {
  var parts = String(email).split('@');
  if (parts.length !== 2) return '***';
  var local = parts[0];
  var domain = parts[1];
  if (local.length <= 2) return local.charAt(0) + '***@' + domain;
  return local.slice(0, 2) + '***' + local.slice(-1) + '@' + domain;
}

function toFirestoreFields_(obj) {
  var fields = {};
  for (var key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key) || obj[key] === undefined) continue;
    var val = obj[key];
    if (val === null) {
      fields[key] = { nullValue: null };
    } else if (typeof val === 'boolean') {
      fields[key] = { booleanValue: val };
    } else if (typeof val === 'number') {
      if (Math.floor(val) === val) {
        fields[key] = { integerValue: String(val) };
      } else {
        fields[key] = { doubleValue: val };
      }
    } else {
      fields[key] = { stringValue: String(val) };
    }
  }
  return fields;
}

function fromFirestoreFields_(fields) {
  var out = {};
  for (var key in fields) {
    if (!Object.prototype.hasOwnProperty.call(fields, key)) continue;
    var f = fields[key];
    if ('stringValue' in f) out[key] = f.stringValue;
    else if ('booleanValue' in f) out[key] = Boolean(f.booleanValue);
    else if ('integerValue' in f) out[key] = Number(f.integerValue);
    else if ('doubleValue' in f) out[key] = Number(f.doubleValue);
    else if ('timestampValue' in f) out[key] = f.timestampValue;
    else if ('nullValue' in f) out[key] = null;
  }
  return out;
}

function base64UrlEncode_(str) {
  return Utilities.base64EncodeWebSafe(str).replace(/=+$/, '');
}

function base64UrlEncodeBytes_(bytes) {
  return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/, '');
}

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}
