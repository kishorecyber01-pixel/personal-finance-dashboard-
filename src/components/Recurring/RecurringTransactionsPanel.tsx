import { useState } from "react";

import { useFinance } from "../../context/FinanceContext";

import type { RecurringTransaction } from "../../types/finance";

interface RecurringTransactionsPanelProps {
  onAdd: () => void;
  onEdit: (transaction: RecurringTransaction) => void;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string) {
  return new Date(
    `${date}T00:00:00`
  ).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatFrequency(
  frequency: RecurringTransaction["frequency"]
) {
  return (
    frequency.charAt(0).toUpperCase() +
    frequency.slice(1)
  );
}

export default function RecurringTransactionsPanel({
  onAdd,
  onEdit,
}: RecurringTransactionsPanelProps) {
  const {
    recurringTransactions,
    deleteRecurringTransaction,
    toggleRecurringTransaction,
    processRecurringTransactions,
  } = useFinance();

  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] =
    useState(false);

  async function handleProcessNow() {
    try {
      setIsProcessing(true);
      setMessage("");

      const generatedCount =
        await processRecurringTransactions();

      setMessage(
        generatedCount > 0
          ? `${generatedCount} transaction${
              generatedCount === 1 ? "" : "s"
            } generated successfully.`
          : "No recurring transactions are due today."
      );
    } catch (error) {
      console.error(
        "Failed to process recurring transactions:",
        error
      );

      setMessage(
        "Unable to process recurring transactions."
      );
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleDelete(
    transaction: RecurringTransaction
  ) {
    const confirmed = window.confirm(
      `Delete "${transaction.title}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteRecurringTransaction(
        transaction.id
      );

      setMessage(
        "Recurring transaction deleted."
      );
    } catch (error) {
      console.error(
        "Failed to delete recurring transaction:",
        error
      );

      setMessage(
        "Unable to delete recurring transaction."
      );
    }
  }

  async function handleToggle(
    transaction: RecurringTransaction
  ) {
    try {
      await toggleRecurringTransaction(
        transaction.id
      );

      setMessage(
        transaction.active
          ? "Recurring transaction paused."
          : "Recurring transaction resumed."
      );
    } catch (error) {
      console.error(
        "Failed to toggle recurring transaction:",
        error
      );

      setMessage(
        "Unable to update recurring transaction."
      );
    }
  }

  return (
    <section
      className="panel recurring-panel"
      id="recurring-section"
    >
      <div className="panel-header recurring-panel-header">
        <div>
          <p className="panel-label">
            Automatic transactions
          </p>

          <h3>Recurring Transactions</h3>

          <p className="recurring-description">
            Automatically create salary, rent,
            subscriptions, bills, and other
            repeating transactions.
          </p>
        </div>

        <div className="recurring-header-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={() => {
              void handleProcessNow();
            }}
            disabled={isProcessing}
          >
            {isProcessing
              ? "Processing..."
              : "Process due items"}
          </button>

          <button
            className="primary-button"
            type="button"
            onClick={onAdd}
          >
            + Add recurring
          </button>
        </div>
      </div>

      {message && (
        <div className="recurring-message">
          {message}
        </div>
      )}

      {recurringTransactions.length === 0 ? (
        <div className="empty-state">
          <h4>No recurring transactions</h4>

          <p>
            Add your salary, rent,
            subscriptions, EMI payments, or
            monthly bills.
          </p>

          <button
            className="primary-button"
            type="button"
            onClick={onAdd}
          >
            Create recurring transaction
          </button>
        </div>
      ) : (
        <div className="recurring-list">
          {recurringTransactions.map(
            (transaction) => (
              <article
                className={`recurring-item ${
                  transaction.active
                    ? ""
                    : "recurring-item-paused"
                }`}
                key={transaction.id}
              >
                <div className="recurring-main">
                  <div
                    className={`recurring-type-icon ${
                      transaction.type ===
                      "income"
                        ? "income"
                        : "expense"
                    }`}
                  >
                    {transaction.type ===
                    "income"
                      ? "↓"
                      : "↑"}
                  </div>

                  <div>
                    <div className="recurring-title-row">
                      <h4>
                        {transaction.title}
                      </h4>

                      <span
                        className={`status-badge ${
                          transaction.active
                            ? "active"
                            : "paused"
                        }`}
                      >
                        {transaction.active
                          ? "Active"
                          : "Paused"}
                      </span>
                    </div>

                    <p>
                      {transaction.category} ·{" "}
                      {formatFrequency(
                        transaction.frequency
                      )}
                    </p>

                    <small>
                      Next:{" "}
                      {formatDate(
                        transaction.nextOccurrence
                      )}
                    </small>
                  </div>
                </div>

                <div className="recurring-amount">
                  <strong
                    className={
                      transaction.type ===
                      "income"
                        ? "income-text"
                        : "expense-text"
                    }
                  >
                    {transaction.type ===
                    "income"
                      ? "+"
                      : "-"}
                    {formatCurrency(
                      transaction.amount
                    )}
                  </strong>

                  <span>
                    {transaction.paymentMethod}
                  </span>
                </div>

                <div className="recurring-actions">
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => {
                      void handleToggle(
                        transaction
                      );
                    }}
                  >
                    {transaction.active
                      ? "Pause"
                      : "Resume"}
                  </button>

                  <button
                    className="text-button"
                    type="button"
                    onClick={() =>
                      onEdit(transaction)
                    }
                  >
                    Edit
                  </button>

                  <button
                    className="text-button danger"
                    type="button"
                    onClick={() => {
                      void handleDelete(
                        transaction
                      );
                    }}
                  >
                    Delete
                  </button>
                </div>
              </article>
            )
          )}
        </div>
      )}
    </section>
  );
}