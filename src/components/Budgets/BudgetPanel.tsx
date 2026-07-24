import { useMemo } from "react";

import { useFinance } from "../../context/FinanceContext";
import type { Budget } from "../../types/finance";

interface BudgetPanelProps {
  onAdd: () => void;
  onEdit: (budget: Budget) => void;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export default function BudgetPanel({
  onAdd,
  onEdit,
}: BudgetPanelProps) {
  const {
    budgets,
    transactions,
    deleteBudget,
  } = useFinance();

  const currentMonth = getCurrentMonth();

  const currentBudgets = useMemo(() => {
    return budgets
      .filter((budget) => budget.month === currentMonth)
      .map((budget) => {
        const spent = transactions
          .filter(
            (transaction) =>
              transaction.type === "expense" &&
              transaction.category === budget.category &&
              transaction.date.startsWith(currentMonth)
          )
          .reduce(
            (total, transaction) =>
              total + transaction.amount,
            0
          );

        const remaining = budget.monthlyLimit - spent;
        const percentage =
          budget.monthlyLimit > 0
            ? Math.min(
                (spent / budget.monthlyLimit) * 100,
                100
              )
            : 0;

        return {
          ...budget,
          spent,
          remaining,
          percentage,
        };
      });
  }, [budgets, transactions, currentMonth]);

  function handleDelete(budget: Budget) {
    const confirmed = window.confirm(
      `Delete the ${budget.category} budget?`
    );

    if (confirmed) {
      deleteBudget(budget.id);
    }
  }

  return (
    <section className="panel budget-panel">
      <div className="panel-header">
        <div>
          <p className="panel-label">Monthly planning</p>
          <h3>Budgets</h3>
        </div>

        <button
          className="primary-button"
          type="button"
          onClick={onAdd}
        >
          + Add budget
        </button>
      </div>

      {currentBudgets.length === 0 ? (
        <div className="empty-transactions">
          <span>◎</span>
          <h4>No budgets for this month</h4>
          <p>
            Add category budgets to track your monthly
            spending.
          </p>

          <button
            className="secondary-button"
            type="button"
            onClick={onAdd}
          >
            Create first budget
          </button>
        </div>
      ) : (
        <div className="budget-list">
          {currentBudgets.map((budget) => {
            const isOverBudget = budget.remaining < 0;
            const isWarning =
              budget.percentage >= 80 && !isOverBudget;

            return (
              <article
                className="budget-item"
                key={budget.id}
              >
                <div className="budget-item-header">
                  <div>
                    <h4>{budget.category}</h4>
                    <p>
                      {formatCurrency(budget.spent)} spent of{" "}
                      {formatCurrency(
                        budget.monthlyLimit
                      )}
                    </p>
                  </div>

                  <div className="table-actions">
                    <button
                      type="button"
                      onClick={() => onEdit(budget)}
                    >
                      Edit
                    </button>

                    <button
                      className="danger-action"
                      type="button"
                      onClick={() =>
                        handleDelete(budget)
                      }
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="budget-progress-track">
                  <div
                    className={`budget-progress-fill ${
                      isOverBudget
                        ? "over-budget"
                        : isWarning
                          ? "budget-warning"
                          : ""
                    }`}
                    style={{
                      width: `${budget.percentage}%`,
                    }}
                  />
                </div>

                <div className="budget-meta">
                  <span>
                    {Math.round(budget.percentage)}% used
                  </span>

                  <strong
                    className={
                      isOverBudget ? "negative-value" : ""
                    }
                  >
                    {isOverBudget
                      ? `${formatCurrency(
                          Math.abs(budget.remaining)
                        )} over`
                      : `${formatCurrency(
                          budget.remaining
                        )} remaining`}
                  </strong>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}