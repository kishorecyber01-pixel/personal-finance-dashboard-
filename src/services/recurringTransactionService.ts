import { supabase } from "../lib/supabase";

import type {
  RecurringTransaction,
  PaymentMethod,
  RecurringFrequency,
  TransactionType,
} from "../types/finance";

interface RecurringTransactionRow {
  id: string;
  user_id: string;
  title: string;
  amount: number | string;
  type: TransactionType;
  category: string;
  payment_method: PaymentMethod;
  frequency: RecurringFrequency;
  start_date: string;
  next_occurrence: string;
  merchant: string;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

function mapRecurringTransaction(
  row: RecurringTransactionRow
): RecurringTransaction {
  return {
    id: row.id,
    title: row.title,
    amount: Number(row.amount),
    type: row.type,
    category: row.category,
    paymentMethod: row.payment_method,
    frequency: row.frequency,
    startDate: row.start_date,
    nextOccurrence: row.next_occurrence,
    merchant: row.merchant,
    notes: row.notes ?? "",
    active: row.active,
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
      "You must be logged in to manage recurring transactions."
    );
  }

  return user.id;
}

export async function getRecurringTransactions(): Promise<
  RecurringTransaction[]
> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("recurring_transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) =>
    mapRecurringTransaction(
      row as RecurringTransactionRow
    )
  );
}

export async function addRecurringTransaction(
  transaction: RecurringTransaction
): Promise<RecurringTransaction> {
  const userId = await getCurrentUserId();

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("recurring_transactions")
    .insert({
      id: transaction.id,
      user_id: userId,
      title: transaction.title,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
      payment_method:
        transaction.paymentMethod,
      frequency: transaction.frequency,
      start_date: transaction.startDate,
      next_occurrence:
        transaction.nextOccurrence,
      merchant: transaction.merchant,
      notes: transaction.notes,
      active: transaction.active,
      created_at: transaction.createdAt,
      updated_at:
        transaction.updatedAt ?? now,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return mapRecurringTransaction(
    data as RecurringTransactionRow
  );
}

export async function updateRecurringTransaction(
  transaction: RecurringTransaction
): Promise<RecurringTransaction> {
  const userId = await getCurrentUserId();

  const updatedAt = new Date().toISOString();

  const { data, error } = await supabase
    .from("recurring_transactions")
    .update({
      title: transaction.title,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
      payment_method:
        transaction.paymentMethod,
      frequency: transaction.frequency,
      start_date: transaction.startDate,
      next_occurrence:
        transaction.nextOccurrence,
      merchant: transaction.merchant,
      notes: transaction.notes,
      active: transaction.active,
      updated_at: updatedAt,
    })
    .eq("id", transaction.id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return mapRecurringTransaction(
    data as RecurringTransactionRow
  );
}

export async function deleteRecurringTransaction(
  id: string
): Promise<void> {
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from("recurring_transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}

export async function toggleRecurringTransaction(
  transaction: RecurringTransaction
): Promise<RecurringTransaction> {
  return updateRecurringTransaction({
    ...transaction,
    active: !transaction.active,
    updatedAt: new Date().toISOString(),
  });
}