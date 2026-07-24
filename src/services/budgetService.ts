import { supabase } from "../lib/supabase";
import type { Budget } from "../types/finance";

interface BudgetRow {
  id: string;
  user_id: string;
  category: string;
  monthly_limit: number | string;
  month: string;
  created_at: string;
  updated_at: string;
}

function mapBudget(row: BudgetRow): Budget {
  return {
    id: row.id,
    category: row.category,
    monthlyLimit: Number(row.monthly_limit),
    month: row.month,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getCurrentUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error("User not logged in.");
  }

  return user.id;
}

export async function getBudgets(): Promise<
  Budget[]
> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("budgets")
    .select("*")
    .eq("user_id", userId)
    .order("month", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) =>
    mapBudget(row as BudgetRow)
  );
}

export async function addBudget(
  budget: Budget
): Promise<Budget> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("budgets")
    .insert({
      id: budget.id,
      user_id: userId,
      category: budget.category,
      monthly_limit: budget.monthlyLimit,
      month: budget.month,
      created_at: budget.createdAt,
      updated_at: budget.updatedAt,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return mapBudget(data as BudgetRow);
}

export async function updateBudget(
  budget: Budget
): Promise<Budget> {
  const userId = await getCurrentUserId();

  const updatedAt = new Date().toISOString();

  const { data, error } = await supabase
    .from("budgets")
    .update({
      category: budget.category,
      monthly_limit: budget.monthlyLimit,
      month: budget.month,
      updated_at: updatedAt,
    })
    .eq("id", budget.id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return mapBudget(data as BudgetRow);
}

export async function deleteBudget(
  id: string
): Promise<void> {
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from("budgets")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}