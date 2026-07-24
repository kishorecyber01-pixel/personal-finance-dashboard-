import type {
  Budget,
  RecurringTransaction,
  SavingsGoal,
  Transaction,
} from "../types/finance";

const TRANSACTIONS_KEY = "fintrack-transactions";
const BUDGETS_KEY = "fintrack-budgets";
const SAVINGS_GOALS_KEY =
  "fintrack-savings-goals";
const RECURRING_TRANSACTIONS_KEY =
  "fintrack-recurring-transactions";


export function loadTransactions(): Transaction[] {
  try {
    const saved = localStorage.getItem(
      TRANSACTIONS_KEY
    );

    if (!saved) {
      return [];
    }

    const parsed: unknown = JSON.parse(saved);

    return Array.isArray(parsed)
      ? (parsed as Transaction[])
      : [];
  } catch (error) {
    console.error(
      "Unable to load transactions:",
      error
    );

    return [];
  }
}

export function saveTransactions(
  transactions: Transaction[]
): void {
  try {
    localStorage.setItem(
      TRANSACTIONS_KEY,
      JSON.stringify(transactions)
    );
  } catch (error) {
    console.error(
      "Unable to save transactions:",
      error
    );
  }
}

export function loadBudgets(): Budget[] {
  try {
    const saved = localStorage.getItem(BUDGETS_KEY);

    if (!saved) {
      return [];
    }

    const parsed: unknown = JSON.parse(saved);

    return Array.isArray(parsed)
      ? (parsed as Budget[])
      : [];
  } catch (error) {
    console.error(
      "Unable to load budgets:",
      error
    );

    return [];
  }
}

export function saveBudgets(
  budgets: Budget[]
): void {
  try {
    localStorage.setItem(
      BUDGETS_KEY,
      JSON.stringify(budgets)
    );
  } catch (error) {
    console.error(
      "Unable to save budgets:",
      error
    );
  }
}

export function loadSavingsGoals(): SavingsGoal[] {
  try {
    const saved = localStorage.getItem(
      SAVINGS_GOALS_KEY
    );

    if (!saved) {
      return [];
    }

    const parsed: unknown = JSON.parse(saved);

    return Array.isArray(parsed)
      ? (parsed as SavingsGoal[])
      : [];
  } catch (error) {
    console.error(
      "Unable to load savings goals:",
      error
    );

    return [];
  }
}

export function saveSavingsGoals(
  goals: SavingsGoal[]
): void {
  try {
    localStorage.setItem(
      SAVINGS_GOALS_KEY,
      JSON.stringify(goals)
    );
  } catch (error) {
    console.error(
      "Unable to save savings goals:",
      error
    );
  }
}

export function loadRecurringTransactions(): RecurringTransaction[] {
  try {
    const saved = localStorage.getItem(
      RECURRING_TRANSACTIONS_KEY
    );

    if (!saved) {
      return [];
    }

    return JSON.parse(saved);
  } catch {
    return [];
  }
}

export function saveRecurringTransactions(
  recurringTransactions: RecurringTransaction[]
) {
  localStorage.setItem(
    RECURRING_TRANSACTIONS_KEY,
    JSON.stringify(recurringTransactions)
  );
}