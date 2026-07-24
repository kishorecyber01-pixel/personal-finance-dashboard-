import { supabase } from "../lib/supabase";
import { addTransaction } from "./transactionService";
import type { Transaction } from "../types/finance";

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export async function processMonthlySalary() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    return;
  }

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select("monthly_salary, salary_day")
    .eq("id", user.id)
    .single();

  if (profileError) {
    throw profileError;
  }

  if (!profile) {
    return;
  }

  const salary = Number(profile.monthly_salary);

  if (!Number.isFinite(salary) || salary <= 0) {
    return;
  }

  const salaryDay = Number(profile.salary_day);
  const currentDay = new Date().getDate();

  if (
    Number.isFinite(salaryDay) &&
    salaryDay > 0 &&
    currentDay < salaryDay
  ) {
    return;
  }

  const month = currentMonth();

  const {
    data: existing,
    error: existingError,
  } = await supabase
    .from("salary_records")
    .select("id")
    .eq("user_id", user.id)
    .eq("salary_month", month)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    return;
  }

  const now = new Date().toISOString();

  const transaction: Transaction = {
    id: crypto.randomUUID(),
    type: "income",
    date: today(),
    description: "Monthly Salary",
    merchant: "Employer",
    category: "Salary",
    amount: salary,
    paymentMethod: "Bank Transfer",
    notes: "Automatically generated monthly salary",
    createdAt: now,
    updatedAt: now,
  };

  const savedTransaction =
    await addTransaction(transaction);

  const { error: salaryRecordError } =
    await supabase
      .from("salary_records")
      .insert({
        user_id: user.id,
        salary_month: month,
        amount: salary,
        salary_date: today(),
        transaction_id: savedTransaction.id,
        status: "credited",
      });

  if (salaryRecordError) {
    throw salaryRecordError;
  }
}