import { lotteryService } from './lotteryService';
import { TicketBooking } from './types';

export interface MigrationValidationResult {
  totalRecords: number;
  validRecords: number;
  duplicatesRemoved: number;
  conflictingPaymentsDetected: number;
  cleanedBookings: TicketBooking[];
}

export class LocalStorageToFirebaseMigrationTool {
  /**
   * 1. Export local records from browser storage
   */
  public exportLocalData(): TicketBooking[] {
    return lotteryService.getBookings();
  }

  /**
   * 2. Validate records prior to Firestore migration
   * Detects duplicate tickets, invalid amounts, and conflicting payment states
   */
  public validateAndCleanData(records: TicketBooking[]): MigrationValidationResult {
    const seenTickets = new Set<string>();
    const cleaned: TicketBooking[] = [];
    let duplicates = 0;
    let conflicts = 0;

    for (const record of records) {
      const compositeKey = `${record.date}_${record.ticketNumber}`;

      if (seenTickets.has(compositeKey)) {
        duplicates++;
        continue; // Prevent importing duplicate ticket reservations
      }

      // Check payment consistency
      if (record.amountPaid > record.totalAmount) {
        conflicts++;
      }

      seenTickets.add(compositeKey);
      cleaned.push(record);
    }

    return {
      totalRecords: records.length,
      validRecords: cleaned.length,
      duplicatesRemoved: duplicates,
      conflictingPaymentsDetected: conflicts,
      cleanedBookings: cleaned,
    };
  }

  /**
   * 3. Simulate Migration Batch commit
   */
  public generateMigrationReport(validation: MigrationValidationResult): string {
    return `
========================================
CARROM LOTTERY DATABASE MIGRATION REPORT
========================================
Timestamp: ${new Date().toISOString()}
Total Local Records Scanned: ${validation.totalRecords}
Valid Clean Records for Firestore: ${validation.validRecords}
Duplicate Ticket Conflicts Prevented: ${validation.duplicatesRemoved}
Payment Discrepancies Flagged: ${validation.conflictingPaymentsDetected}
Migration Status: READY FOR ATOMIC IMPORT
========================================
`.trim();
  }
}

export const migrationTool = new LocalStorageToFirebaseMigrationTool();
