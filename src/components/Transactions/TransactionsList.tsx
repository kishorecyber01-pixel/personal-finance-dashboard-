import { useMemo, useState } from "react";

import { useFinance } from "../../context/FinanceContext";

import type {
  PaymentMethod,
  Transaction,
} from "../../types/finance";

interface TransactionsListProps {
  onEdit: (transaction: Transaction) => void;
}

type TransactionTypeFilter =
  | "all"
  | "income"
  | "expense";

type DateFilter =
  | "all"
  | "today"
  | "week"
  | "month"
  | "year"
  | "custom";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function startOfToday() {
  const date = new Date();

  date.setHours(0, 0, 0, 0);

  return date;
}

function startOfCurrentWeek() {
  const date = startOfToday();
  const day = date.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;

  date.setDate(date.getDate() - daysSinceMonday);

  return date;
}

function startOfCurrentMonth() {
  const date = startOfToday();

  date.setDate(1);

  return date;
}

function startOfCurrentYear() {
  const date = startOfToday();

  date.setMonth(0, 1);

  return date;
}

export default function TransactionsList({
  onEdit,
}: TransactionsListProps) {
  const { transactions, deleteTransaction } =
    useFinance();

  const [searchQuery, setSearchQuery] =
    useState("");

  const [typeFilter, setTypeFilter] =
    useState<TransactionTypeFilter>("all");

  const [categoryFilter, setCategoryFilter] =
    useState("all");

  const [
    paymentMethodFilter,
    setPaymentMethodFilter,
  ] = useState<"all" | PaymentMethod>("all");

  const [dateFilter, setDateFilter] =
    useState<DateFilter>("all");

  const [customStartDate, setCustomStartDate] =
    useState("");

  const [customEndDate, setCustomEndDate] =
    useState("");

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        transactions
          .map(
            (transaction) =>
              transaction.category
          )
          .filter(Boolean)
      )
    ).sort((first, second) =>
      first.localeCompare(second)
    );
  }, [transactions]);

  const paymentMethods = useMemo(() => {
    return Array.from(
      new Set(
        transactions
          .map(
            (transaction) =>
              transaction.paymentMethod
          )
          .filter(Boolean)
      )
    ).sort((first, second) =>
      first.localeCompare(second)
    );
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    const query = searchQuery
      .trim()
      .toLowerCase();

    const today = startOfToday();
    const currentWeek = startOfCurrentWeek();
    const currentMonth = startOfCurrentMonth();
    const currentYear = startOfCurrentYear();

    return transactions
      .filter((transaction) => {
        const merchant =
          transaction.merchant?.toLowerCase() ?? "";

        const category =
          transaction.category?.toLowerCase() ?? "";

        const notes =
          typeof transaction.notes === "string"
            ? transaction.notes.toLowerCase()
            : "";

        const description =
          typeof transaction.description === "string"
            ? transaction.description.toLowerCase()
            : "";

        const paymentMethod =
          transaction.paymentMethod?.toLowerCase() ??
          "";

        const matchesSearch =
          !query ||
          merchant.includes(query) ||
          category.includes(query) ||
          notes.includes(query) ||
          description.includes(query) ||
          paymentMethod.includes(query);

        const matchesType =
          typeFilter === "all" ||
          transaction.type === typeFilter;

        const matchesCategory =
          categoryFilter === "all" ||
          transaction.category === categoryFilter;

        const matchesPaymentMethod =
          paymentMethodFilter === "all" ||
          transaction.paymentMethod ===
            paymentMethodFilter;

        const transactionDate = new Date(
          `${transaction.date}T00:00:00`
        );

        let matchesDate = true;

        if (dateFilter === "today") {
          matchesDate =
            transactionDate.getTime() ===
            today.getTime();
        }

        if (dateFilter === "week") {
          matchesDate =
            transactionDate >= currentWeek &&
            transactionDate <= today;
        }

        if (dateFilter === "month") {
          matchesDate =
            transactionDate >= currentMonth &&
            transactionDate <= today;
        }

        if (dateFilter === "year") {
          matchesDate =
            transactionDate >= currentYear &&
            transactionDate <= today;
        }

        if (dateFilter === "custom") {
          const startDate = customStartDate
            ? new Date(
                `${customStartDate}T00:00:00`
              )
            : null;

          const endDate = customEndDate
            ? new Date(
                `${customEndDate}T23:59:59`
              )
            : null;

          matchesDate =
            (!startDate ||
              transactionDate >= startDate) &&
            (!endDate ||
              transactionDate <= endDate);
        }

        return (
          matchesSearch &&
          matchesType &&
          matchesCategory &&
          matchesPaymentMethod &&
          matchesDate
        );
      })
      .sort(
        (first, second) =>
          new Date(second.date).getTime() -
          new Date(first.date).getTime()
      );
  }, [
    transactions,
    searchQuery,
    typeFilter,
    categoryFilter,
    paymentMethodFilter,
    dateFilter,
    customStartDate,
    customEndDate,
  ]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    typeFilter !== "all" ||
    categoryFilter !== "all" ||
    paymentMethodFilter !== "all" ||
    dateFilter !== "all" ||
    customStartDate !== "" ||
    customEndDate !== "";

  function clearFilters() {
    setSearchQuery("");
    setTypeFilter("all");
    setCategoryFilter("all");
    setPaymentMethodFilter("all");
    setDateFilter("all");
    setCustomStartDate("");
    setCustomEndDate("");
  }

  function handleDelete(
    transaction: Transaction
  ) {
    const confirmed = window.confirm(
      `Delete "${transaction.merchant}" transaction?`
    );

    if (confirmed) {
      deleteTransaction(transaction.id);
    }
  }

  return (
    <section className="panel transactions-panel">
      <div className="panel-header">
        <div>
          <p className="panel-label">
            Activity
          </p>

          <h3>Transactions</h3>

          <p className="transaction-result-count">
            Showing {filteredTransactions.length} of{" "}
            {transactions.length} transactions
          </p>
        </div>

        {hasActiveFilters && (
          <button
            className="secondary-button"
            type="button"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="transaction-search-row">
        <label className="transaction-search-field">
          <span>Search</span>

          <input
            type="search"
            placeholder="Search merchant, category, payment, or notes"
            value={searchQuery}
            onChange={(event) =>
              setSearchQuery(
                event.target.value
              )
            }
          />
        </label>
      </div>

      <div className="transaction-filters">
        <label>
          <span>Type</span>

          <select
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(
                event.target
                  .value as TransactionTypeFilter
              )
            }
          >
            <option value="all">
              All transactions
            </option>

            <option value="income">
              Income only
            </option>

            <option value="expense">
              Expenses only
            </option>
          </select>
        </label>

        <label>
          <span>Category</span>

          <select
            value={categoryFilter}
            onChange={(event) =>
              setCategoryFilter(
                event.target.value
              )
            }
          >
            <option value="all">
              All categories
            </option>

            {categories.map((category) => (
              <option
                key={category}
                value={category}
              >
                {category}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Payment method</span>

          <select
            value={paymentMethodFilter}
            onChange={(event) =>
              setPaymentMethodFilter(
                event.target.value as
                  | "all"
                  | PaymentMethod
              )
            }
          >
            <option value="all">
              All payment methods
            </option>

            {paymentMethods.map((method) => (
              <option
                key={method}
                value={method}
              >
                {method}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Date range</span>

          <select
            value={dateFilter}
            onChange={(event) =>
              setDateFilter(
                event.target.value as DateFilter
              )
            }
          >
            <option value="all">
              All dates
            </option>

            <option value="today">
              Today
            </option>

            <option value="week">
              This week
            </option>

            <option value="month">
              This month
            </option>

            <option value="year">
              This year
            </option>

            <option value="custom">
              Custom range
            </option>
          </select>
        </label>
      </div>

      {dateFilter === "custom" && (
        <div className="custom-date-filters">
          <label>
            <span>Start date</span>

            <input
              type="date"
              value={customStartDate}
              max={customEndDate || undefined}
              onChange={(event) =>
                setCustomStartDate(
                  event.target.value
                )
              }
            />
          </label>

          <label>
            <span>End date</span>

            <input
              type="date"
              value={customEndDate}
              min={customStartDate || undefined}
              onChange={(event) =>
                setCustomEndDate(
                  event.target.value
                )
              }
            />
          </label>
        </div>
      )}

      {filteredTransactions.length === 0 ? (
        <div className="empty-transactions">
          <span>⌕</span>

          <h4>
            No matching transactions
          </h4>

          <p>
            Change your filters or add a new
            transaction.
          </p>

          {hasActiveFilters && (
            <button
              className="secondary-button"
              type="button"
              onClick={clearFilters}
            >
              Reset all filters
            </button>
          )}
        </div>
      ) : (
        <div className="transaction-table-wrapper">
          <table className="transaction-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Merchant</th>
                <th>Category</th>
                <th>Payment</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredTransactions.map(
                (transaction) => (
                  <tr key={transaction.id}>
                    <td>
                      {formatDate(
                        transaction.date
                      )}
                    </td>

                    <td>
                      <strong>
                        {transaction.merchant}
                      </strong>

                      {typeof transaction.notes ===
                        "string" &&
                        transaction.notes && (
                          <span>
                            {transaction.notes}
                          </span>
                        )}
                    </td>

                    <td>
                      {transaction.category}
                    </td>

                    <td>
                      {transaction.paymentMethod}
                    </td>

                    <td>
                      <span
                        className={`transaction-type-badge ${transaction.type}`}
                      >
                        {transaction.type}
                      </span>
                    </td>

                    <td
                      className={
                        transaction.type ===
                        "income"
                          ? "income-amount"
                          : "expense-amount"
                      }
                    >
                      {transaction.type ===
                      "income"
                        ? "+"
                        : "-"}
                      {formatCurrency(
                        transaction.amount
                      )}
                    </td>

                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          onClick={() =>
                            onEdit(transaction)
                          }
                        >
                          Edit
                        </button>

                        <button
                          className="danger-action"
                          type="button"
                          onClick={() =>
                            handleDelete(
                              transaction
                            )
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}