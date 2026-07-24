import { useEffect, useState } from "react";

import { useFinance } from "../../context/FinanceContext";
import type { Budget } from "../../types/finance";

interface BudgetFormProps {
  budgetToEdit: Budget | null;
  onClose: () => void;
}

const expenseCategories = [
  "Food",
  "Groceries",
  "Shopping",
  "Transport",
  "Housing",
  "Utilities",
  "Entertainment",
  "Healthcare",
  "Education",
  "Subscriptions",
  "Travel",
  "Other",
];

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export default function BudgetForm({
  budgetToEdit,
  onClose,
}: BudgetFormProps) {
  const {
    budgets,
    addBudget,
    updateBudget,
  } = useFinance();

  const [category, setCategory] = useState("Food");
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [month, setMonth] = useState(getCurrentMonth());
  const [error, setError] = useState("");

  useEffect(() => {
    if (!budgetToEdit) {
      return;
    }

    setCategory(budgetToEdit.category);
    setMonthlyLimit(String(budgetToEdit.monthlyLimit));
    setMonth(budgetToEdit.month);
  }, [budgetToEdit]);

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const parsedLimit = Number(monthlyLimit);

    if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
      setError(
        "Enter a valid monthly budget greater than zero."
      );
      return;
    }

    const duplicateBudget = budgets.find(
      (budget) =>
        budget.category === category &&
        budget.month === month &&
        budget.id !== budgetToEdit?.id
    );

    if (duplicateBudget) {
      setError(
        `A budget already exists for ${category} in this month.`
      );
      return;
    }

    const now = new Date().toISOString();

    if (budgetToEdit) {
      updateBudget({
        ...budgetToEdit,
        category,
        monthlyLimit: parsedLimit,
        month,
        updatedAt: now,
      });
    } else {
      addBudget({
        id: crypto.randomUUID(),
        category,
        monthlyLimit: parsedLimit,
        month,
        createdAt: now,
        updatedAt: now,
      });
    }

    onClose();
  }

  return (
    <div className="modal-backdrop">
      <section
        className="transaction-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="budget-form-title"
      >
        <div className="modal-header">
          <div>
            <p className="panel-label">Monthly budget</p>

            <h3 id="budget-form-title">
              {budgetToEdit
                ? "Edit Budget"
                : "Add Budget"}
            </h3>
          </div>

          <button
            className="close-button"
            type="button"
            onClick={onClose}
            aria-label="Close budget form"
          >
            ×
          </button>
        </div>

        <form
          className="transaction-form"
          onSubmit={handleSubmit}
        >
          <div className="form-grid">
            <label>
              Category
              <select
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value)
                }
              >
                {expenseCategories.map(
                  (categoryOption) => (
                    <option
                      key={categoryOption}
                      value={categoryOption}
                    >
                      {categoryOption}
                    </option>
                  )
                )}
              </select>
            </label>

            <label>
              Month
              <input
                type="month"
                value={month}
                onChange={(event) =>
                  setMonth(event.target.value)
                }
                required
              />
            </label>

            <label className="full-width">
              Monthly limit
              <input
                type="number"
                min="1"
                step="0.01"
                placeholder="Example: 5000"
                value={monthlyLimit}
                onChange={(event) =>
                  setMonthlyLimit(event.target.value)
                }
                required
              />
            </label>
          </div>

          {error && (
            <p className="form-error">{error}</p>
          )}

          <div className="form-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              className="primary-button"
              type="submit"
            >
              {budgetToEdit
                ? "Save Changes"
                : "Add Budget"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}