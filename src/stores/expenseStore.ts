import { create } from 'zustand';
import type { Expense, ExpenseSummary, NewExpense, UpdateExpense } from '../types';
import {
  getExpensesByTripId,
  getExpenseSummary,
  insertExpense,
  updateExpense,
  deleteExpense,
} from '../db/queries/expense';

interface ExpenseStore {
  expenses:      Expense[];
  summary:       ExpenseSummary | null;
  currentTripId: string | null;
  isLoading:     boolean;
  error:         string | null;

  loadExpenses:   (tripId: string) => Promise<void>;
  addExpense:     (data: NewExpense) => Promise<Expense>;
  updateExpense:  (id: string, data: UpdateExpense) => Promise<void>;
  removeExpense:  (id: string) => Promise<void>;
  refreshSummary: (tripId?: string) => Promise<void>;
  clearExpenses:  () => void;
  clearError:     () => void;
}

export const useExpenseStore = create<ExpenseStore>((set, get) => ({
  expenses:      [],
  summary:       null,
  currentTripId: null,
  isLoading:     false,
  error:         null,

  loadExpenses: async (tripId) => {
    set({ isLoading: true, error: null });
    try {
      const [expenses, summary] = await Promise.all([
        getExpensesByTripId(tripId),
        getExpenseSummary(tripId),
      ]);
      set({ expenses, summary, currentTripId: tripId, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  addExpense: async (data) => {
    try {
      const expense = await insertExpense(data);
      set(s => ({ expenses: [...s.expenses, expense] }));
      // 요약 갱신
      await get().refreshSummary();
      return expense;
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  updateExpense: async (id, data) => {
    try {
      await updateExpense(id, data);
      set(s => ({
        expenses: s.expenses.map(e => e.id === id ? { ...e, ...data } : e),
      }));
      await get().refreshSummary();
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  removeExpense: async (id) => {
    try {
      await deleteExpense(id);
      set(s => ({ expenses: s.expenses.filter(e => e.id !== id) }));
      await get().refreshSummary();
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  refreshSummary: async (tripId) => {
    const id = tripId ?? get().currentTripId;
    if (!id) return;
    try {
      const summary = await getExpenseSummary(id);
      set({ summary });
    } catch (e) {
      set({ error: String(e) });
    }
  },

  clearExpenses: () => set({ expenses: [], summary: null, currentTripId: null }),
  clearError:    () => set({ error: null }),
}));
