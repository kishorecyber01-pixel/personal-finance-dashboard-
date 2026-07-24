import {
  useEffect,
  useState,
} from "react";

import type { Session } from "@supabase/supabase-js";

import AuthPage from "./components/Auth/AuthPage";
import BudgetForm from "./components/Budgets/BudgetForm";
import BudgetPanel from "./components/Budgets/BudgetPanel";
import CategoryChart from "./components/Charts/CategoryChart";
import CategorySpendingChart from "./components/Charts/CategorySpendingChart";
import MonthlyTrendChart from "./components/Charts/MonthlyTrendChart";
import SavingsTrendChart from "./components/Charts/SavingsTrendChart";
import FinancialInsights from "./components/Insights/FinancialInsights";
import ImportTransactions from "./components/Import/ImportTransactions";
import NotificationBell from "./components/Notifications/NotificationBell";
import ProfileSettings from "./components/profile/ProfileSettings";
import RecurringTransactionForm from "./components/Recurring/RecurringTransactionForm";
import RecurringTransactionsPanel from "./components/Recurring/RecurringTransactionsPanel";
import ReportsPanel from "./components/Reports/ReportsPanel";
import SavingsGoalForm from "./components/savings/SavingsGoalForm";
import SavingsGoalsPanel from "./components/savings/SavingsGoalsPanel";
import TransactionForm from "./components/Transactions/TransactionForm";
import TransactionsList from "./components/Transactions/TransactionsList";
import { processMonthlySalary } from "./services/salaryService";

import { useFinance } from "./context/FinanceContext";
import { useProfile } from "./context/ProfileContext";
import { supabase } from "./lib/supabase";

import type {
  Budget,
  RecurringTransaction,
  SavingsGoal,
  Transaction,
} from "./types/finance";

import "./App.css";

const navItems = [
  "Dashboard",
  "Profile",
  "Transactions",
  "Budgets",
  "Savings Goals",
  "Recurring",
  "Reports",
  "Import",
  "Settings",
];

type Theme = "light" | "dark";

function formatCurrency(
  amount: number,
  currency = "INR"
) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getInitialTheme(): Theme {
  const savedTheme = localStorage.getItem(
    "fintrack-theme"
  );

  if (
    savedTheme === "light" ||
    savedTheme === "dark"
  ) {
    return savedTheme;
  }

  return window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches
    ? "dark"
    : "light";
}

export default function App() {
  const {
    dashboardSummary,
    dashboardLoading,
    dashboardError,
    refreshDashboardSummary,
  } = useFinance();

  const {
    profile,
    profileLoading,
  } = useProfile();

  const [session, setSession] =
    useState<Session | null>(null);

  const [authLoading, setAuthLoading] =
    useState(true);

  const [logoutLoading, setLogoutLoading] =
    useState(false);

  const [theme, setTheme] =
    useState<Theme>(getInitialTheme);

  const [
    showTransactionForm,
    setShowTransactionForm,
  ] = useState(false);

  const [
    transactionToEdit,
    setTransactionToEdit,
  ] = useState<Transaction | null>(null);

  const [
    showBudgetForm,
    setShowBudgetForm,
  ] = useState(false);

  const [
    budgetToEdit,
    setBudgetToEdit,
  ] = useState<Budget | null>(null);

  const [
    showSavingsGoalForm,
    setShowSavingsGoalForm,
  ] = useState(false);

  const [
    savingsGoalToEdit,
    setSavingsGoalToEdit,
  ] = useState<SavingsGoal | null>(null);

  const [
    showRecurringTransactionForm,
    setShowRecurringTransactionForm,
  ] = useState(false);

  const [
    recurringTransactionToEdit,
    setRecurringTransactionToEdit,
  ] = useState<RecurringTransaction | null>(
    null
  );

  const [
    showImportModal,
    setShowImportModal,
  ] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme =
      theme;

    localStorage.setItem(
      "fintrack-theme",
      theme
    );
  }, [theme]);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      const {
        data,
        error,
      } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (error) {
        console.error(
          "Failed to load authentication session:",
          error.message
        );
      }

      setSession(data.session);

      if (data.session) {
        await processMonthlySalary();
      }

      setAuthLoading(false);
    }

    void loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!isMounted) {
          return;
        }

        setSession(nextSession);

        if (nextSession) {
          void processMonthlySalary();
        }

        setAuthLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const selectedCurrency =
    profile?.preferred_currency || "INR";

  const summaryCards = [
    {
      title: "Total Income",
      value: formatCurrency(
        dashboardSummary.totalIncome,
        selectedCurrency
      ),
      subtitle: "Live from Supabase",
    },
    {
      title: "Total Expenses",
      value: formatCurrency(
        dashboardSummary.totalExpense,
        selectedCurrency
      ),
      subtitle: "Live from Supabase",
    },
    {
      title: "Current Balance",
      value: formatCurrency(
        dashboardSummary.balance,
        selectedCurrency
      ),
      subtitle: "Income minus expenses",
    },
    {
      title: "Savings Rate",
      value: `${dashboardSummary.savingsRate.toFixed(
        1
      )}%`,
      subtitle: "Current financial performance",
    },
    {
      title: "Transactions",
      value:
        dashboardSummary.totalTransactions.toString(),
      subtitle: "Transactions recorded",
    },
  ];

  function toggleTheme() {
    setTheme((currentTheme) =>
      currentTheme === "light"
        ? "dark"
        : "light"
    );
  }

  async function refreshSession() {
    setAuthLoading(true);

    const {
      data,
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error(
        "Failed to refresh session:",
        error.message
      );
    }

    setSession(data.session);
    setAuthLoading(false);
  }

  async function handleLogout() {
    setLogoutLoading(true);

    const { error } =
      await supabase.auth.signOut();

    if (error) {
      window.alert(
        `Unable to sign out: ${error.message}`
      );

      setLogoutLoading(false);
      return;
    }

    setSession(null);
    setLogoutLoading(false);
  }

  function openCreateTransaction() {
    setTransactionToEdit(null);
    setShowTransactionForm(true);
  }

  function openEditTransaction(
    transaction: Transaction
  ) {
    setTransactionToEdit(transaction);
    setShowTransactionForm(true);
  }

  function closeTransactionForm() {
    setTransactionToEdit(null);
    setShowTransactionForm(false);
  }

  function openCreateBudget() {
    setBudgetToEdit(null);
    setShowBudgetForm(true);
  }

  function openEditBudget(
    budget: Budget
  ) {
    setBudgetToEdit(budget);
    setShowBudgetForm(true);
  }

  function closeBudgetForm() {
    setBudgetToEdit(null);
    setShowBudgetForm(false);
  }

  function openCreateSavingsGoal() {
    setSavingsGoalToEdit(null);
    setShowSavingsGoalForm(true);
  }

  function openEditSavingsGoal(
    goal: SavingsGoal
  ) {
    setSavingsGoalToEdit(goal);
    setShowSavingsGoalForm(true);
  }

  function closeSavingsGoalForm() {
    setSavingsGoalToEdit(null);
    setShowSavingsGoalForm(false);
  }

  function openCreateRecurringTransaction() {
    setRecurringTransactionToEdit(null);
    setShowRecurringTransactionForm(true);
  }

  function openEditRecurringTransaction(
    transaction: RecurringTransaction
  ) {
    setRecurringTransactionToEdit(
      transaction
    );

    setShowRecurringTransactionForm(true);
  }

  function closeRecurringTransactionForm() {
    setRecurringTransactionToEdit(null);
    setShowRecurringTransactionForm(false);
  }

  function openImportModal() {
    setShowImportModal(true);
  }

  function closeImportModal() {
    setShowImportModal(false);
  }

  function scrollToSection(
    sectionId: string
  ) {
    document
      .getElementById(sectionId)
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }

  function handleNavigation(
    item: string
  ) {
    if (item === "Dashboard") {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    if (item === "Profile") {
      scrollToSection("profile-section");
      return;
    }

    if (item === "Transactions") {
      scrollToSection(
        "transactions-section"
      );
      return;
    }

    if (item === "Budgets") {
      scrollToSection(
        "budgets-section"
      );
      return;
    }

    if (item === "Savings Goals") {
      scrollToSection(
        "savings-section"
      );
      return;
    }

    if (item === "Recurring") {
      scrollToSection(
        "recurring-section"
      );
      return;
    }

    if (item === "Reports") {
      scrollToSection(
        "reports-section"
      );
      return;
    }

    if (item === "Import") {
      openImportModal();
      return;
    }

    if (item === "Settings") {
      scrollToSection("profile-section");
    }
  }

  if (authLoading) {
    return (
      <main className="auth-loading">
        <div className="auth-loading-card">
          <div className="brand-icon">
            ₹
          </div>

          <h2>Loading FinTrack...</h2>

          <p>
            Checking your secure session.
          </p>
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <AuthPage
        onAuthenticated={() => {
          void refreshSession();
        }}
      />
    );
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="brand">
            <div className="brand-icon">
              ₹
            </div>

            <div>
              <h1>FinTrack</h1>
              <p>Personal finance</p>
            </div>
          </div>

          <nav
            className="nav-list"
            aria-label="Main navigation"
          >
            {navItems.map(
              (item, index) => (
                <button
                  key={item}
                  className={`nav-item ${
                    index === 0
                      ? "active"
                      : ""
                  }`}
                  type="button"
                  onClick={() =>
                    handleNavigation(item)
                  }
                >
                  {item}
                </button>
              )
            )}
          </nav>
        </div>

        <div className="privacy-card">
          <strong>
            {profileLoading
              ? "Loading profile..."
              : profile?.full_name ||
                "Signed in securely"}
          </strong>

          <p>
            {session.user.email ??
              "Authenticated user"}
          </p>
        </div>
      </aside>

      <section className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">
              Overview
            </p>

            <h2>
              Financial Dashboard
            </h2>

            <p className="topbar-description">
              Track your income, spending,
              budgets, savings, and recurring
              payments.
            </p>
          </div>

          <div className="topbar-actions">
            <NotificationBell />

            <button
              className="theme-toggle"
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${
                theme === "light"
                  ? "dark"
                  : "light"
              } mode`}
              title={`Switch to ${
                theme === "light"
                  ? "dark"
                  : "light"
              } mode`}
            >
              <span aria-hidden="true">
                {theme === "light"
                  ? "🌙"
                  : "☀️"}
              </span>

              {theme === "light"
                ? "Dark"
                : "Light"}
            </button>

            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                void handleLogout();
              }}
              disabled={logoutLoading}
            >
              {logoutLoading
                ? "Signing out..."
                : "Sign out"}
            </button>

            <button
              className="primary-button"
              type="button"
              onClick={
                openCreateTransaction
              }
            >
              + Add transaction
            </button>
          </div>
        </header>

        {dashboardLoading && (
          <div className="loading-card">
            Loading dashboard...
          </div>
        )}

        {dashboardError && (
          <div
            className="loading-card"
            role="alert"
          >
            <p>{dashboardError}</p>

            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                void refreshDashboardSummary().catch(
                  () => {
                    // Error is handled in FinanceContext.
                  }
                );
              }}
            >
              Try again
            </button>
          </div>
        )}

        {!dashboardLoading &&
          !dashboardError && (
            <section className="summary-grid">
              {summaryCards.map(
                (card) => (
                  <article
                    className="summary-card"
                    key={card.title}
                  >
                    <p>{card.title}</p>
                    <h3>{card.value}</h3>
                    <span>
                      {card.subtitle}
                    </span>
                  </article>
                )
              )}
            </section>
          )}

        <FinancialInsights />

        <section className="charts-grid">
          <CategoryChart />
          <CategorySpendingChart />
          <MonthlyTrendChart />
          <SavingsTrendChart />
        </section>

        <div
          className="dashboard-section"
          id="profile-section"
        >
          <ProfileSettings />
        </div>

        <div
          className="dashboard-section"
          id="savings-section"
        >
          <SavingsGoalsPanel
            onAdd={
              openCreateSavingsGoal
            }
            onEdit={
              openEditSavingsGoal
            }
          />
        </div>

        <div
          className="dashboard-section"
          id="recurring-section"
        >
          <RecurringTransactionsPanel
            onAdd={
              openCreateRecurringTransaction
            }
            onEdit={
              openEditRecurringTransaction
            }
          />
        </div>

        <div
          className="dashboard-section"
          id="budgets-section"
        >
          <BudgetPanel
            onAdd={openCreateBudget}
            onEdit={openEditBudget}
          />
        </div>

        <div
          className="dashboard-section"
          id="transactions-section"
        >
          <TransactionsList
            onEdit={
              openEditTransaction
            }
          />
        </div>

        <div
          className="dashboard-section"
          id="reports-section"
        >
          <ReportsPanel />
        </div>
      </section>

      {showTransactionForm && (
        <TransactionForm
          transactionToEdit={
            transactionToEdit
          }
          onClose={
            closeTransactionForm
          }
        />
      )}

      {showBudgetForm && (
        <BudgetForm
          budgetToEdit={
            budgetToEdit
          }
          onClose={
            closeBudgetForm
          }
        />
      )}

      {showSavingsGoalForm && (
        <SavingsGoalForm
          goalToEdit={
            savingsGoalToEdit
          }
          onClose={
            closeSavingsGoalForm
          }
        />
      )}

      {showRecurringTransactionForm && (
        <RecurringTransactionForm
          recurringToEdit={
            recurringTransactionToEdit
          }
          onClose={
            closeRecurringTransactionForm
          }
        />
      )}

      {showImportModal && (
        <ImportTransactions
          onClose={
            closeImportModal
          }
        />
      )}
    </main>
  );
}