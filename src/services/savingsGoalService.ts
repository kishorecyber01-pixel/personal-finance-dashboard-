import { supabase } from "../lib/supabase";
import type { SavingsGoal } from "../types/finance";

interface SavingsGoalRow {
  id: string;
  user_id: string;
  name: string;
  target_amount: number | string;
  saved_amount: number | string;
  current_amount: number | string;
  target_date: string;
  created_at: string;
  updated_at: string;
}

function mapSavingsGoal(
  row: SavingsGoalRow
): SavingsGoal {
  return {
    id: row.id,
    name: row.name,
    targetAmount: Number(row.target_amount),
    savedAmount: Number(row.saved_amount),
    currentAmount: Number(row.current_amount),
    targetDate: row.target_date,
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
    throw new Error(
      "You must be logged in to manage savings goals."
    );
  }

  return user.id;
}

export async function getSavingsGoals(): Promise<
  SavingsGoal[]
> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("savings_goals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return (data as SavingsGoalRow[]).map(
    mapSavingsGoal
  );
}

export async function addSavingsGoal(
  goal: SavingsGoal
): Promise<SavingsGoal> {
  const userId = await getCurrentUserId();

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("savings_goals")
    .insert({
      id: goal.id,
      user_id: userId,
      name: goal.name,
      target_amount: goal.targetAmount,
      saved_amount: goal.savedAmount,
      current_amount: goal.currentAmount,
      target_date: goal.targetDate,
      created_at: goal.createdAt,
      updated_at: goal.updatedAt ?? now,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return mapSavingsGoal(
    data as SavingsGoalRow
  );
}

export async function updateSavingsGoal(
  goal: SavingsGoal
): Promise<SavingsGoal> {
  const userId = await getCurrentUserId();
  const updatedAt = new Date().toISOString();

  const { data, error } = await supabase
    .from("savings_goals")
    .update({
      name: goal.name,
      target_amount: goal.targetAmount,
      saved_amount: goal.savedAmount,
      current_amount: goal.currentAmount,
      target_date: goal.targetDate,
      updated_at: updatedAt,
    })
    .eq("id", goal.id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return mapSavingsGoal(
    data as SavingsGoalRow
  );
}

export async function deleteSavingsGoal(
  id: string
): Promise<void> {
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from("savings_goals")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}