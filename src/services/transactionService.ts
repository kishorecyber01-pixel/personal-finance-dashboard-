import { supabase } from "../lib/supabase";
import type { Transaction } from "../types/finance";

interface TransactionRow {
  id: string;
  user_id: string;
  type: Transaction["type"];
  date: string;
  description: string;
  merchant: string;
  category: string;
  amount: number | string;
  payment_method: Transaction["paymentMethod"];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function mapTransaction(
  row: TransactionRow
): Transaction {
  return {
    id: row.id,
    type: row.type,
    date: row.date,
    description: row.description,
    merchant: row.merchant,
    category: row.category,
    amount: Number(row.amount),
    paymentMethod: row.payment_method,
    notes: row.notes ?? "",
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

export async function getTransactions(): Promise<
  Transaction[]
> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) =>
    mapTransaction(row as TransactionRow)
  );
}

export async function addTransaction(
  transaction: Transaction
): Promise<Transaction> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("transactions")
    .insert({
      id: transaction.id,
      user_id: userId,
      type: transaction.type,
      date: transaction.date,
      description: transaction.description,
      merchant: transaction.merchant,
      category: transaction.category,
      amount: transaction.amount,
      payment_method: transaction.paymentMethod,
      notes: transaction.notes,
      created_at: transaction.createdAt,
      updated_at: transaction.updatedAt,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return mapTransaction(
    data as TransactionRow
  );
}

export async function updateTransaction(
  transaction: Transaction
): Promise<Transaction> {
  const userId = await getCurrentUserId();

  const updatedAt = new Date().toISOString();

  const { data, error } = await supabase
    .from("transactions")
    .update({
      type: transaction.type,
      date: transaction.date,
      description: transaction.description,
      merchant: transaction.merchant,
      category: transaction.category,
      amount: transaction.amount,
      payment_method: transaction.paymentMethod,
      notes: transaction.notes,
      updated_at: updatedAt,
    })
    .eq("id", transaction.id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return mapTransaction(
    data as TransactionRow
  );
}

export async function deleteTransaction(
  id: string
): Promise<void> {
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}