import { ArrowLeft, ImageOff } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useExpenseStore from "../store/ExpenseStore";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export interface PaymentValidationState {
  splitId: string;
  personName: string;
  expenseTitle: string;
  amount: number;
  paymentProof?: string;
  paidAt?: string;
  groupId: string;
}

function PaymentValidation() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as PaymentValidationState | null;

  const { validatePayment, declinePayment, fetchGroupExpenses } = useExpenseStore();

  const [loading, setLoading] = useState<"approve" | "decline" | null>(null);

  if (!state) {
    return (
      <div className="h-screen w-screen bg-white dark:bg-gray-900 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500 dark:text-gray-400 text-sm">No payment data found.</p>
        <button onClick={() => navigate(-1)} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm">
          Go Back
        </button>
      </div>
    );
  }

  const { splitId, personName, expenseTitle, amount, paymentProof, paidAt, groupId } = state;

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

  const formatUploadDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  const handleApprove = async () => {
    setLoading("approve");
    try {
      await validatePayment(splitId);
      await fetchGroupExpenses(groupId);
      navigate(-1);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  const handleDecline = async () => {
    setLoading("decline");
    try {
      await declinePayment(splitId);
      await fetchGroupExpenses(groupId);
      navigate(-1);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="pt-24 pl-16 pr-margin-desktop pb-12 min-h-screen flex flex-col text-on-surface">
      {/* Header */}
      <div className="glass-surface p-6 rounded-2xl mb-8 flex items-center justify-between shadow-2xl border border-white/10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center cursor-pointer hover:bg-white/10 hover:scale-105 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-on-surface" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-on-surface">Payment Validation</h1>
            <p className="text-xs text-on-surface-variant mt-0.5">Approve or decline transaction proof from your friend</p>
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      <div className="max-w-2xl glass-surface rounded-2xl p-6 shadow-2xl border border-white/10">
        <div className="mb-6">
          <p className="text-lg font-bold text-on-surface">From {personName}</p>
          <p className="text-sm text-on-surface-variant mt-1">{expenseTitle} • {formatCurrency(amount)}</p>
        </div>

        <p className="text-sm font-semibold text-primary-container mb-3">Receipt Photo</p>

        <div className="rounded-xl overflow-hidden bg-white/5 border border-white/10 mb-6 flex justify-center items-center" style={{ minHeight: 220 }}>
          {paymentProof ? (
            <img
              src={`${API_BASE_URL}${paymentProof}`}
              alt="Bukti Pembayaran"
              className="w-full max-h-[500px] object-contain"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 text-on-surface-variant/40 py-16">
              <ImageOff className="w-12 h-12" />
              <p className="text-sm">No proof uploaded</p>
            </div>
          )}
        </div>

        <p className="text-sm text-on-surface-variant mb-6">
          Uploaded: <span className="font-semibold text-on-surface">{formatUploadDate(paidAt)}</span>
        </p>

        <div className="flex gap-4">
          <button
            onClick={handleApprove}
            disabled={loading !== null}
            className="flex-1 py-3.5 bg-success hover:bg-success/80 text-white font-bold rounded-xl active:scale-[0.98] cursor-pointer transition-all text-sm flex items-center justify-center shadow-lg"
          >
            {loading === "approve" ? "Approving..." : "Approve"}
          </button>

          <button
            onClick={handleDecline}
            disabled={loading !== null}
            className="flex-1 py-3.5 bg-error hover:bg-error/80 text-white font-bold rounded-xl active:scale-[0.98] cursor-pointer transition-all text-sm flex items-center justify-center shadow-lg"
          >
            {loading === "decline" ? "Declining..." : "Decline"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentValidation;
