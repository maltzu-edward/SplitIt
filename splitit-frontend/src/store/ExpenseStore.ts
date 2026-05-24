import axios from "axios";
import { create } from "zustand";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export interface ExpenseSplit {
  id: string;
  userId: string;
  amount: number;
  description?: string;
  isPaid: boolean;
  isValidated: boolean;
  paymentProof?: string;
  paidAt?: string;
  user?: {
    id: string;
    name: string;
  };
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  groupId: string;
  payerId: string;
  createdAt: string;
  payer?: {
    id: string;
    name: string;
  };
  splits?: ExpenseSplit[];
}

interface ExpenseStore {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
  fetchGroupExpenses: (groupId: string) => Promise<void>;
  addExpense: (data: {
    title: string;
    amount: number;
    groupId: string;
    payerId: string;
    splits?: {
      userId: string;
      amount: number;
      description?: string;
    }[];
  }) => Promise<void>;
  markSplitAsPaid: (splitId: string) => Promise<void>;
  validatePayment: (splitId: string) => Promise<void>;
  declinePayment: (splitId: string) => Promise<void>;
  submitPaymentProof: (splitId: string, file: File) => Promise<void>;
}

const useExpenseStore = create<ExpenseStore>((set) => ({
  expenses: [],
  loading: false,
  error: null,

  fetchGroupExpenses: async (groupId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(
        `${API_BASE_URL}/expenses/group/${groupId}`,
        { withCredentials: true }
      );
      set({ expenses: response.data, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  addExpense: async (data) => {
    set({ loading: true, error: null });
    try {
      await axios.post(
        `${API_BASE_URL}/groups/expense`,
        data,
        { withCredentials: true }
      );
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  markSplitAsPaid: async (splitId: string) => {
    await axios.patch(
      `${API_BASE_URL}/expenses/split/${splitId}/pay`,
      {},
      { withCredentials: true }
    );
  },

  validatePayment: async (splitId: string) => {
    await axios.patch(
      `${API_BASE_URL}/expenses/split/${splitId}/validate`,
      {},
      { withCredentials: true }
    );
  },

  declinePayment: async (splitId: string) => {
    await axios.patch(
      `${API_BASE_URL}/expenses/split/${splitId}/decline`,
      {},
      { withCredentials: true }
    );
  },

  submitPaymentProof: async (splitId: string, file: File) => {
    const formData = new FormData();
    formData.append('proof', file);
    await axios.post(
      `${API_BASE_URL}/expenses/split/${splitId}/proof`,
      formData,
      { withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' } }
    );
  },
}));

export default useExpenseStore;
