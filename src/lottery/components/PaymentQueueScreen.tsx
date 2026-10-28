import React, { useState } from 'react';
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Check,
  X,
  CreditCard,
  RotateCw,
} from 'lucide-react';
import { PaymentQueueTask, LoginType } from '../types';

interface PaymentQueueScreenProps {
  tasks: PaymentQueueTask[];
  drawDate: string;
  currentRole: LoginType;
  currentStaffName: string;
  employeeLabelMap?: Record<string, string>;
  onCompleteTask: (
    taskId: string,
    bookingId: string,
    amountPaid: number,
    paymentMethod: string,
    paymentRef: string
  ) => Promise<{ success: boolean; error?: string }>;
  onRefresh?: () => void;
  onBack?: () => void;
}

export const PaymentQueueScreen: React.FC<PaymentQueueScreenProps> = ({
  tasks,
  drawDate,
  currentRole,
  currentStaffName,
  employeeLabelMap,
  onCompleteTask,
  onRefresh,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [completingTask, setCompletingTask] = useState<PaymentQueueTask | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentRef, setPaymentRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const pendingTasks = tasks.filter((t) => t.status === 'PENDING');
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED');

  const displayedList = (activeTab === 'pending' ? pendingTasks : completedTasks).filter((t) => {
    if (!searchQuery.trim()) return true;
    return t.ticketNumber.toLowerCase().includes(searchQuery.trim().toLowerCase());
  });

  const handleOpenCompleteModal = (task: PaymentQueueTask) => {
    setCompletingTask(task);
    setPaymentMethod('Cash');
    setPaymentRef(`REC-${Date.now().toString().slice(-6)}`);
    setActionError(null);
  };

  const handleConfirmSubmit = async () => {
    if (!completingTask) return;
    setIsSubmitting(true);
    setActionError(null);

    try {
      const res = await onCompleteTask(
        completingTask.id,
        completingTask.bookingId,
        completingTask.amountDue,
        paymentMethod,
        paymentRef
      );

      if (res.success) {
        setActionSuccess(`Payment for Ticket #${completingTask.ticketNumber} marked Completed.`);
        setCompletingTask(null);
        setTimeout(() => setActionSuccess(null), 4000);
      } else {
        setActionError(res.error || 'Failed to complete payment task.');
      }
    } catch (err: any) {
      setActionError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-3 sm:p-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Restricted Payment Queue
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3 text-amber-600" />
                <span>Restricted Queue</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Draw Date: <span className="font-semibold text-slate-800">{drawDate}</span> • Operator:{' '}
              <span className="font-semibold text-slate-800">{currentStaffName}</span> (
              {currentRole === 'paid_employee' ? 'Paid Employee' : 'Admin'})
            </p>
          </div>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="self-start sm:self-auto px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center space-x-1.5 transition-colors shadow-2xs"
          >
            <RotateCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Refresh</span>
          </button>
        )}
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Role Notice */}
      <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CreditCard className="w-4 h-4 text-slate-500 shrink-0" />
          <span>
            This restricted queue presents only pending payment verification tasks. Direct customer details and unneeded booking data are strictly isolated.
          </span>
        </div>
      </div>

      {/* Controls: Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
        {/* Tabs */}
        <div className="flex border-b border-slate-200 gap-2">
          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'pending'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Payment Tasks</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                pendingTasks.length > 0 ? 'bg-amber-500 text-white animate-pulse' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {pendingTasks.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'completed'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completed</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200">
              {completedTasks.length}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ticket #..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Task List / Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {displayedList.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            {activeTab === 'pending'
              ? 'No pending payment tasks requiring action for this draw date.'
              : 'No completed payment tasks recorded for this draw date.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Ticket Number</th>
                  <th className="py-2.5 px-4">Draw Date</th>
                  <th className="py-2.5 px-4">Staff / Created By</th>
                  <th className="py-2.5 px-4">Total Amount</th>
                  <th className="py-2.5 px-4">Amount Paid</th>
                  <th className="py-2.5 px-4">Amount Due</th>
                  <th className="py-2.5 px-4">Payment Status</th>
                  <th className="py-2.5 px-4">Task Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                {displayedList.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-bold border border-slate-200">
                        #{task.ticketNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-sans">{task.drawDate}</td>
                    <td className="py-3 px-4 font-sans">
                      {currentRole === 'admin' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-300">
                          {task.employeeLabel || 'L1'} — {employeeLabelMap?.[task.employeeLabel || 'L1'] || 'Employee'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {task.employeeLabel || 'L1'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-sans font-semibold text-slate-800">
                      ₹{task.totalAmount}
                    </td>
                    <td className="py-3 px-4 font-sans font-semibold text-emerald-700">
                      ₹{task.amountPaid}
                    </td>
                    <td className="py-3 px-4 font-sans font-bold text-red-600">
                      ₹{task.amountDue}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          task.paymentStatus === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : task.paymentStatus === 'Partial'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {task.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          task.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {task.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-sans">
                      {task.status === 'PENDING' ? (
                        <button
                          onClick={() => handleOpenCompleteModal(task)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-colors inline-flex items-center space-x-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Mark Completed</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">
                          Completed {task.completedBy ? `by ${task.completedBy}` : ''}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Completion Modal */}
      {completingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Complete Payment Verification
                </h3>
              </div>
              <button
                onClick={() => setCompletingTask(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {actionError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 font-semibold">
                  {actionError}
                </div>
              )}

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Ticket:</span>
                  <span className="font-bold text-slate-900">#{completingTask.ticketNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Staff:</span>
                  <span className="font-bold text-slate-800 font-sans">
                    {currentRole === 'admin'
                      ? `${completingTask.employeeLabel || 'L1'} — ${employeeLabelMap?.[completingTask.employeeLabel || 'L1'] || 'Employee'}`
                      : (completingTask.employeeLabel || 'L1')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Draw Date:</span>
                  <span className="text-slate-800 font-sans">{completingTask.drawDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Amount Due:</span>
                  <span className="font-bold text-red-600">₹{completingTask.amountDue}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="Cash">Cash</option>
                  <option value="Online Transfer">Online Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Payment Reference / Receipt ID
                </label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. REC-12345"
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <p className="text-[11px] text-slate-400">
                Completing this task will record the payment securely server-side and update the booking status to Paid.
              </p>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setCompletingTask(null)}
                disabled={isSubmitting}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-colors flex items-center space-x-1 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm Completed</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
