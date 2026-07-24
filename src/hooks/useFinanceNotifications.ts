import { useEffect, useMemo, useState } from "react";

import { useFinance } from "../context/FinanceContext";

import type { FinanceNotification } from "../types/notification";

const READ_NOTIFICATIONS_KEY =
  "fintrack-read-notifications";

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function loadReadNotificationIds(): string[] {
  try {
    const stored = localStorage.getItem(
      READ_NOTIFICATIONS_KEY
    );

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function useFinanceNotifications() {
  const {
    transactions,
    budgets,
    recurringTransactions,
  } = useFinance();

  const [readNotificationIds, setReadNotificationIds] =
    useState<string[]>(loadReadNotificationIds);

  useEffect(() => {
    localStorage.setItem(
      READ_NOTIFICATIONS_KEY,
      JSON.stringify(readNotificationIds)
    );
  }, [readNotificationIds]);

  const notifications = useMemo<
    FinanceNotification[]
  >(() => {
    const generatedNotifications: FinanceNotification[] =
      [];

    const currentMonth = getCurrentMonth();
    const today = getToday();

    const monthlyTransactions = transactions.filter(
      (transaction) =>
        transaction.date.startsWith(currentMonth)
    );

    const monthlyIncome = monthlyTransactions
      .filter(
        (transaction) => transaction.type === "income"
      )
      .reduce(
        (total, transaction) =>
          total + transaction.amount,
        0
      );

    const monthlyExpenses = monthlyTransactions
      .filter(
        (transaction) => transaction.type === "expense"
      )
      .reduce(
        (total, transaction) =>
          total + transaction.amount,
        0
      );

    if (
      monthlyExpenses > monthlyIncome &&
      monthlyExpenses > 0
    ) {
      const id = `negative-savings-${currentMonth}`;

      generatedNotifications.push({
        id,
        title: "Expenses exceed income",
        message:
          "Your expenses are currently higher than your income for this month.",
        type: "danger",
        createdAt: new Date().toISOString(),
        read: readNotificationIds.includes(id),
      });
    }

    const currentBudgets = budgets.filter(
      (budget) => budget.month === currentMonth
    );

    currentBudgets.forEach((budget) => {
      const categorySpent = monthlyTransactions
        .filter(
          (transaction) =>
            transaction.type === "expense" &&
            transaction.category === budget.category
        )
        .reduce(
          (total, transaction) =>
            total + transaction.amount,
          0
        );

      if (budget.monthlyLimit <= 0) {
        return;
      }

      const percentageUsed =
        (categorySpent / budget.monthlyLimit) * 100;

      if (percentageUsed >= 100) {
        const id = `budget-exceeded-${budget.id}-${currentMonth}`;

        generatedNotifications.push({
          id,
          title: `${budget.category} budget exceeded`,
          message: `You have used ${Math.round(
            percentageUsed
          )}% of your ${budget.category} budget.`,
          type: "danger",
          createdAt: new Date().toISOString(),
          read: readNotificationIds.includes(id),
        });

        return;
      }

      if (percentageUsed >= 80) {
        const id = `budget-warning-${budget.id}-${currentMonth}`;

        generatedNotifications.push({
          id,
          title: `${budget.category} budget warning`,
          message: `You have used ${Math.round(
            percentageUsed
          )}% of your ${budget.category} budget.`,
          type: "warning",
          createdAt: new Date().toISOString(),
          read: readNotificationIds.includes(id),
        });
      }
    });

    recurringTransactions
      .filter(
        (transaction) =>
          transaction.active &&
          transaction.nextOccurrence <= today
      )
      .forEach((transaction) => {
        const isOverdue =
          transaction.nextOccurrence < today;

        const id = `recurring-${transaction.id}-${transaction.nextOccurrence}`;

        generatedNotifications.push({
          id,
          title: isOverdue
            ? "Recurring transaction overdue"
            : "Recurring transaction due today",
          message: `${transaction.title} is ${
            isOverdue ? "overdue" : "due today"
          }.`,
          type: isOverdue ? "danger" : "info",
          createdAt: new Date().toISOString(),
          read: readNotificationIds.includes(id),
        });
      });

    if (generatedNotifications.length === 0) {
      const id = `all-good-${currentMonth}`;

      generatedNotifications.push({
        id,
        title: "Your finances look good",
        message:
          "There are currently no urgent budget or recurring payment alerts.",
        type: "success",
        createdAt: new Date().toISOString(),
        read: readNotificationIds.includes(id),
      });
    }

    return generatedNotifications;
  }, [
    transactions,
    budgets,
    recurringTransactions,
    readNotificationIds,
  ]);

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  function markAsRead(id: string) {
    setReadNotificationIds((currentIds) =>
      currentIds.includes(id)
        ? currentIds
        : [...currentIds, id]
    );
  }

  function markAllAsRead() {
    const allIds = notifications.map(
      (notification) => notification.id
    );

    setReadNotificationIds((currentIds) => [
      ...new Set([...currentIds, ...allIds]),
    ]);
  }

  function clearReadHistory() {
    setReadNotificationIds([]);
  }

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearReadHistory,
  };
}