import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type {
  Budget,
  RecurringTransaction,
  SavingsGoal,
  Transaction,
} from "../types/finance";

import {
  getTransactions,
  addTransaction as addTransactionToDB,
  updateTransaction as updateTransactionToDB,
  deleteTransaction as deleteTransactionFromDB,
} from "../services/transactionService";

import {
  getBudgets,
  addBudget as addBudgetToDB,
  updateBudget as updateBudgetToDB,
  deleteBudget as deleteBudgetFromDB,
} from "../services/budgetService";

import {
  getSavingsGoals,
  addSavingsGoal as addSavingsGoalToDB,
  updateSavingsGoal as updateSavingsGoalToDB,
  deleteSavingsGoal as deleteSavingsGoalFromDB,
} from "../services/savingsGoalService";

import {
  getRecurringTransactions,
  addRecurringTransaction as addRecurringTransactionToDB,
  updateRecurringTransaction as updateRecurringTransactionToDB,
  deleteRecurringTransaction as deleteRecurringTransactionFromDB,
  toggleRecurringTransaction as toggleRecurringTransactionInDB,
} from "../services/recurringTransactionService";

import {
  getDashboardSummary,
  type DashboardSummary,
} from "../services/dashboardService";

interface FinanceContextValue {
  transactions: Transaction[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  recurringTransactions: RecurringTransaction[];

  dashboardSummary: DashboardSummary;
  dashboardLoading: boolean;
  dashboardError: string | null;

  transactionsLoading: boolean;
  transactionsError: string | null;

  refreshDashboardSummary: () => Promise<void>;

  addTransaction: (
    transaction: Transaction
  ) => Promise<void>;

  updateTransaction: (
    transaction: Transaction
  ) => Promise<void>;

  deleteTransaction: (
    id: string
  ) => Promise<void>;

  importTransactions: (
    transactions: Transaction[]
  ) => Promise<void>;

  addBudget: (
    budget: Budget
  ) => Promise<void>;

  updateBudget: (
    budget: Budget
  ) => Promise<void>;

  deleteBudget: (
    id: string
  ) => Promise<void>;

  addSavingsGoal: (
    goal: SavingsGoal
  ) => Promise<void>;

  updateSavingsGoal: (
    goal: SavingsGoal
  ) => Promise<void>;

  deleteSavingsGoal: (
    id: string
  ) => Promise<void>;

  addMoneyToSavingsGoal: (
    id: string,
    amount: number
  ) => Promise<void>;

  addRecurringTransaction: (
    transaction: RecurringTransaction
  ) => Promise<void>;

  updateRecurringTransaction: (
    transaction: RecurringTransaction
  ) => Promise<void>;

  deleteRecurringTransaction: (
    id: string
  ) => Promise<void>;

  toggleRecurringTransaction: (
    id: string
  ) => Promise<void>;

  processRecurringTransactions: () => Promise<number>;
}

const FinanceContext = createContext<
  FinanceContextValue | undefined
>(undefined);

interface FinanceProviderProps {
  children: ReactNode;
}

const EMPTY_DASHBOARD_SUMMARY: DashboardSummary = {
  totalIncome: 0,
  totalExpense: 0,
  totalTransactions: 0,
  balance: 0,
  savingsRate: 0,
};

function formatDateForStorage(date: Date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function createLocalDate(dateString: string) {
  return new Date(`${dateString}T00:00:00`);
}

function getToday() {
  return formatDateForStorage(new Date());
}

function getNextOccurrence(
  currentDate: string,
  frequency: RecurringTransaction["frequency"]
) {
  const date = createLocalDate(currentDate);

  if (frequency === "daily") {
    date.setDate(date.getDate() + 1);
  }

  if (frequency === "weekly") {
    date.setDate(date.getDate() + 7);
  }

  if (frequency === "monthly") {
    const originalDay = date.getDate();

    date.setDate(1);
    date.setMonth(date.getMonth() + 1);

    const lastDayOfMonth = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0
    ).getDate();

    date.setDate(
      Math.min(originalDay, lastDayOfMonth)
    );
  }

  if (frequency === "yearly") {
    const originalMonth = date.getMonth();
    const originalDay = date.getDate();

    date.setDate(1);
    date.setFullYear(
      date.getFullYear() + 1
    );
    date.setMonth(originalMonth);

    const lastDayOfMonth = new Date(
      date.getFullYear(),
      originalMonth + 1,
      0
    ).getDate();

    date.setDate(
      Math.min(originalDay, lastDayOfMonth)
    );
  }

  return formatDateForStorage(date);
}

export function FinanceProvider({
  children,
}: FinanceProviderProps) {
  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  const [
    transactionsLoading,
    setTransactionsLoading,
  ] = useState(true);

  const [
    transactionsError,
    setTransactionsError,
  ] = useState<string | null>(null);

  const [budgets, setBudgets] =
    useState<Budget[]>([]);

  const [savingsGoals, setSavingsGoals] =
    useState<SavingsGoal[]>([]);

  const [
    recurringTransactions,
    setRecurringTransactions,
  ] = useState<RecurringTransaction[]>([]);

  const [
    dashboardSummary,
    setDashboardSummary,
  ] = useState<DashboardSummary>(
    EMPTY_DASHBOARD_SUMMARY
  );

  const [
    dashboardLoading,
    setDashboardLoading,
  ] = useState(true);

  const [
    dashboardError,
    setDashboardError,
  ] = useState<string | null>(null);

  async function refreshDashboardSummary() {
    try {
      setDashboardLoading(true);
      setDashboardError(null);

      const summary =
        await getDashboardSummary();

      setDashboardSummary(summary);
    } catch (error) {
      console.error(
        "Failed to load dashboard summary:",
        error
      );

      setDashboardError(
        "Unable to load dashboard summary."
      );

      throw error;
    } finally {
      setDashboardLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function loadTransactionData() {
      try {
        setTransactionsLoading(true);
        setTransactionsError(null);

        const data = await getTransactions();

        if (isMounted) {
          setTransactions(data);
        }
      } catch (error) {
        console.error(
          "Failed to load transactions:",
          error
        );

        if (isMounted) {
          setTransactionsError(
            "Unable to load transactions."
          );
        }
      } finally {
        if (isMounted) {
          setTransactionsLoading(false);
        }
      }
    }

    void loadTransactionData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadBudgetData() {
      try {
        const data = await getBudgets();

        if (isMounted) {
          setBudgets(data);
        }
      } catch (error) {
        console.error(
          "Failed to load budgets:",
          error
        );
      }
    }

    void loadBudgetData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadSavingsGoalData() {
      try {
        const data = await getSavingsGoals();

        if (isMounted) {
          setSavingsGoals(data);
        }
      } catch (error) {
        console.error(
          "Failed to load savings goals:",
          error
        );
      }
    }

    void loadSavingsGoalData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadRecurringTransactionData() {
      try {
        const data =
          await getRecurringTransactions();

        if (isMounted) {
          setRecurringTransactions(data);
        }
      } catch (error) {
        console.error(
          "Failed to load recurring transactions:",
          error
        );
      }
    }

    void loadRecurringTransactionData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    void refreshDashboardSummary().catch(
      () => {
        // Error is handled inside refreshDashboardSummary.
      }
    );
  }, []);

  async function addTransaction(
    transaction: Transaction
  ) {
    try {
      setTransactionsError(null);

      const savedTransaction =
        await addTransactionToDB(transaction);

      setTransactions((current) => [
        savedTransaction,
        ...current,
      ]);

      await refreshDashboardSummary();
    } catch (error) {
      console.error(
        "Failed to add transaction:",
        error
      );

      setTransactionsError(
        "Unable to add the transaction."
      );

      throw error;
    }
  }

  async function updateTransaction(
    updatedTransaction: Transaction
  ) {
    try {
      setTransactionsError(null);

      const savedTransaction =
        await updateTransactionToDB(
          updatedTransaction
        );

      setTransactions((current) =>
        current.map((transaction) =>
          transaction.id === savedTransaction.id
            ? savedTransaction
            : transaction
        )
      );

      await refreshDashboardSummary();
    } catch (error) {
      console.error(
        "Failed to update transaction:",
        error
      );

      setTransactionsError(
        "Unable to update the transaction."
      );

      throw error;
    }
  }

  async function deleteTransaction(id: string) {
    try {
      setTransactionsError(null);

      await deleteTransactionFromDB(id);

      setTransactions((current) =>
        current.filter(
          (transaction) =>
            transaction.id !== id
        )
      );

      await refreshDashboardSummary();
    } catch (error) {
      console.error(
        "Failed to delete transaction:",
        error
      );

      setTransactionsError(
        "Unable to delete the transaction."
      );

      throw error;
    }
  }

  async function importTransactions(
    importedTransactions: Transaction[]
  ) {
    if (importedTransactions.length === 0) {
      return;
    }

    try {
      setTransactionsError(null);

      const savedTransactions =
        await Promise.all(
          importedTransactions.map(
            (transaction) =>
              addTransactionToDB(transaction)
          )
        );

      setTransactions((current) => [
        ...savedTransactions,
        ...current,
      ]);

      await refreshDashboardSummary();
    } catch (error) {
      console.error(
        "Failed to import transactions:",
        error
      );

      setTransactionsError(
        "Unable to import transactions."
      );

      throw error;
    }
  }

  async function addBudget(
    budget: Budget
  ) {
    try {
      const savedBudget =
        await addBudgetToDB(budget);

      setBudgets((current) => [
        savedBudget,
        ...current,
      ]);
    } catch (error) {
      console.error(
        "Failed to add budget:",
        error
      );

      throw error;
    }
  }

  async function updateBudget(
    updatedBudget: Budget
  ) {
    try {
      const savedBudget =
        await updateBudgetToDB(
          updatedBudget
        );

      setBudgets((current) =>
        current.map((budget) =>
          budget.id === savedBudget.id
            ? savedBudget
            : budget
        )
      );
    } catch (error) {
      console.error(
        "Failed to update budget:",
        error
      );

      throw error;
    }
  }

  async function deleteBudget(id: string) {
    try {
      await deleteBudgetFromDB(id);

      setBudgets((current) =>
        current.filter(
          (budget) => budget.id !== id
        )
      );
    } catch (error) {
      console.error(
        "Failed to delete budget:",
        error
      );

      throw error;
    }
  }

  async function addSavingsGoal(
    goal: SavingsGoal
  ) {
    try {
      const savedGoal =
        await addSavingsGoalToDB(goal);

      setSavingsGoals((current) => [
        savedGoal,
        ...current,
      ]);
    } catch (error) {
      console.error(
        "Failed to add savings goal:",
        error
      );

      throw error;
    }
  }

  async function updateSavingsGoal(
    updatedGoal: SavingsGoal
  ) {
    try {
      const savedGoal =
        await updateSavingsGoalToDB(
          updatedGoal
        );

      setSavingsGoals((current) =>
        current.map((goal) =>
          goal.id === savedGoal.id
            ? savedGoal
            : goal
        )
      );
    } catch (error) {
      console.error(
        "Failed to update savings goal:",
        error
      );

      throw error;
    }
  }

  async function deleteSavingsGoal(
    id: string
  ) {
    try {
      await deleteSavingsGoalFromDB(id);

      setSavingsGoals((current) =>
        current.filter(
          (goal) => goal.id !== id
        )
      );
    } catch (error) {
      console.error(
        "Failed to delete savings goal:",
        error
      );

      throw error;
    }
  }

  async function addMoneyToSavingsGoal(
    id: string,
    amount: number
  ) {
    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return;
    }

    const currentGoal = savingsGoals.find(
      (goal) => goal.id === id
    );

    if (!currentGoal) {
      throw new Error(
        "Savings goal was not found."
      );
    }

    const updatedSavedAmount = Math.min(
      currentGoal.savedAmount + amount,
      currentGoal.targetAmount
    );

    const updatedGoal: SavingsGoal = {
      ...currentGoal,
      savedAmount: updatedSavedAmount,
      currentAmount: updatedSavedAmount,
      updatedAt: new Date().toISOString(),
    };

    try {
      const savedGoal =
        await updateSavingsGoalToDB(
          updatedGoal
        );

      setSavingsGoals((current) =>
        current.map((goal) =>
          goal.id === savedGoal.id
            ? savedGoal
            : goal
        )
      );
    } catch (error) {
      console.error(
        "Failed to add money to savings goal:",
        error
      );

      throw error;
    }
  }

  async function addRecurringTransaction(
    recurringTransaction: RecurringTransaction
  ) {
    try {
      const savedTransaction =
        await addRecurringTransactionToDB(
          recurringTransaction
        );

      setRecurringTransactions((current) => [
        savedTransaction,
        ...current,
      ]);
    } catch (error) {
      console.error(
        "Failed to add recurring transaction:",
        error
      );

      throw error;
    }
  }

  async function updateRecurringTransaction(
    updatedTransaction: RecurringTransaction
  ) {
    try {
      const savedTransaction =
        await updateRecurringTransactionToDB(
          updatedTransaction
        );

      setRecurringTransactions((current) =>
        current.map((transaction) =>
          transaction.id === savedTransaction.id
            ? savedTransaction
            : transaction
        )
      );
    } catch (error) {
      console.error(
        "Failed to update recurring transaction:",
        error
      );

      throw error;
    }
  }

  async function deleteRecurringTransaction(
    id: string
  ) {
    try {
      await deleteRecurringTransactionFromDB(
        id
      );

      setRecurringTransactions((current) =>
        current.filter(
          (transaction) =>
            transaction.id !== id
        )
      );
    } catch (error) {
      console.error(
        "Failed to delete recurring transaction:",
        error
      );

      throw error;
    }
  }

  async function toggleRecurringTransaction(
    id: string
  ) {
    const currentTransaction =
      recurringTransactions.find(
        (transaction) =>
          transaction.id === id
      );

    if (!currentTransaction) {
      throw new Error(
        "Recurring transaction was not found."
      );
    }

    try {
      const savedTransaction =
        await toggleRecurringTransactionInDB(
          currentTransaction
        );

      setRecurringTransactions((current) =>
        current.map((transaction) =>
          transaction.id === savedTransaction.id
            ? savedTransaction
            : transaction
        )
      );
    } catch (error) {
      console.error(
        "Failed to toggle recurring transaction:",
        error
      );

      throw error;
    }
  }

  async function processRecurringTransactions() {
    const today = getToday();

    const generatedTransactions: Transaction[] =
      [];

    const updatedRecurringTransactions =
      recurringTransactions.map(
        (recurringTransaction) => {
          if (!recurringTransaction.active) {
            return recurringTransaction;
          }

          let nextOccurrence =
            recurringTransaction.nextOccurrence;

          while (nextOccurrence <= today) {
            const now =
              new Date().toISOString();

            generatedTransactions.push({
              id: crypto.randomUUID(),
              description:
                recurringTransaction.title,
              type:
                recurringTransaction.type,
              date: nextOccurrence,
              merchant:
                recurringTransaction.merchant ||
                recurringTransaction.title,
              category:
                recurringTransaction.category,
              amount:
                recurringTransaction.amount,
              paymentMethod:
                recurringTransaction.paymentMethod,
              notes:
                recurringTransaction.notes ||
                `Generated automatically from ${recurringTransaction.title}`,
              createdAt: now,
              updatedAt: now,
            });

            nextOccurrence =
              getNextOccurrence(
                nextOccurrence,
                recurringTransaction.frequency
              );
          }

          return {
            ...recurringTransaction,
            nextOccurrence,
            updatedAt: new Date().toISOString(),
          };
        }
      );

    if (
      generatedTransactions.length === 0
    ) {
      return 0;
    }

    try {
      setTransactionsError(null);

      const savedTransactions =
        await Promise.all(
          generatedTransactions.map(
            (transaction) =>
              addTransactionToDB(transaction)
          )
        );

      const changedRecurringTransactions =
        updatedRecurringTransactions.filter(
          (updatedTransaction) => {
            const originalTransaction =
              recurringTransactions.find(
                (transaction) =>
                  transaction.id ===
                  updatedTransaction.id
              );

            return (
              originalTransaction &&
              originalTransaction.nextOccurrence !==
                updatedTransaction.nextOccurrence
            );
          }
        );

      const savedRecurringTransactions =
        await Promise.all(
          changedRecurringTransactions.map(
            (transaction) =>
              updateRecurringTransactionToDB(
                transaction
              )
          )
        );

      setTransactions((current) => [
        ...savedTransactions,
        ...current,
      ]);

      setRecurringTransactions((current) =>
        current.map((transaction) => {
          const savedTransaction =
            savedRecurringTransactions.find(
              (saved) =>
                saved.id === transaction.id
            );

          return savedTransaction ?? transaction;
        })
      );

      await refreshDashboardSummary();

      return savedTransactions.length;
    } catch (error) {
      console.error(
        "Failed to process recurring transactions:",
        error
      );

      setTransactionsError(
        "Unable to generate recurring transactions."
      );

      throw error;
    }
  }

  const value =
    useMemo<FinanceContextValue>(
      () => ({
        transactions,
        budgets,
        savingsGoals,
        recurringTransactions,

        dashboardSummary,
        dashboardLoading,
        dashboardError,
        refreshDashboardSummary,

        transactionsLoading,
        transactionsError,

        addTransaction,
        updateTransaction,
        deleteTransaction,
        importTransactions,

        addBudget,
        updateBudget,
        deleteBudget,

        addSavingsGoal,
        updateSavingsGoal,
        deleteSavingsGoal,
        addMoneyToSavingsGoal,

        addRecurringTransaction,
        updateRecurringTransaction,
        deleteRecurringTransaction,
        toggleRecurringTransaction,
        processRecurringTransactions,
      }),
      [
        transactions,
        budgets,
        savingsGoals,
        recurringTransactions,
        dashboardSummary,
        dashboardLoading,
        dashboardError,
        transactionsLoading,
        transactionsError,
      ]
    );

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context =
    useContext(FinanceContext);

  if (!context) {
    throw new Error(
      "useFinance must be used inside FinanceProvider"
    );
  }

  return context;
}