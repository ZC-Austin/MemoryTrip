export type ExpenseCategory =
  | 'lodging'
  | 'transport'
  | 'food'
  | 'cafe'
  | 'shopping'
  | 'campsite'
  | 'equipment'
  | 'etc';

export interface Expense {
  id: string;
  trip_id: string;
  place_id: string | null;
  category: ExpenseCategory;
  amount: number;
  currency: string; // ISO 4217, default 'KRW'
  spent_on: string | null; // 'YYYY-MM-DD'
  memo: string | null;
  created_at: string;
  updated_at: string;
}

export type NewExpense = Omit<Expense, 'id' | 'created_at' | 'updated_at'>;
export type UpdateExpense = Partial<Omit<Expense, 'id' | 'trip_id' | 'created_at'>>;

export interface ExpenseCategorySummary {
  category: ExpenseCategory;
  total: number;
}

export interface ExpenseSummary {
  total: number;
  daily_avg: number;
  by_category: ExpenseCategorySummary[];
}
