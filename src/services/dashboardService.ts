import { supabase } from "../lib/supabase";

export interface DashboardSummary {
  totalIncome: number;
  totalExpense: number;
  totalTransactions: number;
  balance: number;
  savingsRate: number;
}

interface DashboardSummaryRow {
  user_id: string;
  total_income: number | string | null;
  total_expense: number | string | null;
  total_transactions: number | string | null;
}

const EMPTY_SUMMARY: DashboardSummary = {
  totalIncome: 0,
  totalExpense: 0,
  totalTransactions: 0,
  balance: 0,
  savingsRate: 0,
};

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error(
      "You must be logged in to load the dashboard."
    );
  }

  const { data, error } = await supabase
    .from("dashboard_summary")
    .select(
      "user_id,total_income,total_expense,total_transactions"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return EMPTY_SUMMARY;
  }

  const row = data as DashboardSummaryRow;

  const totalIncome = Number(
    row.total_income ?? 0
  );

  const totalExpense = Number(
    row.total_expense ?? 0
  );

  const totalTransactions = Number(
    row.total_transactions ?? 0
  );

  const balance =
    totalIncome - totalExpense;

  const savingsRate =
    totalIncome > 0
      ? (balance / totalIncome) * 100
      : 0;

  return {
    totalIncome,
    totalExpense,
    totalTransactions,
    balance,
    savingsRate,
  };
}