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
    <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-blue-600 px-4 py-4 flex items-center gap-3 shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center cursor-pointer active:bg-white/30"
        >
          <ArrowLeft className="w-4 h-4 text-white" />
        </button>
        <h1 className="text-base font-bold text-white flex-1 text-center pr-8">Payment Validation</h1>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-5">
          <div className="mb-4">
            <p className="text-base font-bold text-gray-900 dark:text-white">From {personName}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{expenseTitle} · {formatCurrency(amount)}</p>
          </div>

          <p className="text-sm font-semibold text-blue-600 underline mb-2">Receipt Photo</p>

          <div className="rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mb-3" style={{ minHeight: 220 }}>
            {paymentProof ? (
              <img
                src={`${API_BASE_URL}${paymentProof}`}
                alt="Bukti Pembayaran"
                className="w-full object-cover"
                style={{ maxHeight: 400 }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 text-gray-400 dark:text-gray-500 py-16">
                <ImageOff className="w-10 h-10" />
                <p className="text-sm">No proof uploaded</p>
              </div>
            )}
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Uploaded : <span className="font-semibold text-gray-700 dark:text-gray-200">{formatUploadDate(paidAt)}</span>
          </p>

          <button
            onClick={handleApprove}
            disabled={loading !== null}
            className="w-full py-3.5 bg-green-500 text-white font-bold rounded-xl mb-3 active:brightness-90 disabled:opacity-60 cursor-pointer transition-all text-sm"
          >
            {loading === "approve" ? "Processing..." : "Approve"}
          </button>

          <button
            onClick={handleDecline}
            disabled={loading !== null}
            className="w-full py-3.5 bg-red-100 dark:bg-red-900/20 text-red-500 font-bold rounded-xl active:brightness-90 disabled:opacity-60 cursor-pointer transition-all text-sm border border-red-200 dark:border-red-800"
          >
            {loading === "decline" ? "Processing..." : "Decline"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentValidation;
