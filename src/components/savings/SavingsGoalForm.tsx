import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import { useFinance } from "../../context/FinanceContext";

import type { SavingsGoal } from "../../types/finance";

interface SavingsGoalFormProps {
  goalToEdit: SavingsGoal | null;
  onClose: () => void;
}

interface SavingsGoalFormState {
  name: string;
  targetAmount: string;
  savedAmount: string;
  targetDate: string;
}

const initialFormState: SavingsGoalFormState = {
  name: "",
  targetAmount: "",
  savedAmount: "",
  targetDate: "",
};

export default function SavingsGoalForm({
  goalToEdit,
  onClose,
}: SavingsGoalFormProps) {
  const {
    savingsGoals,
    addSavingsGoal,
    updateSavingsGoal,
  } = useFinance();

  const [formData, setFormData] =
    useState<SavingsGoalFormState>(
      initialFormState
    );

  const [error, setError] = useState("");

  const isEditing = Boolean(goalToEdit);

  useEffect(() => {
    if (!goalToEdit) {
      setFormData(initialFormState);
      return;
    }

    setFormData({
      name: goalToEdit.name,
      targetAmount:
        goalToEdit.targetAmount.toString(),
      savedAmount:
        goalToEdit.savedAmount.toString(),
      targetDate: goalToEdit.targetDate,
    });
  }, [goalToEdit]);

  function handleChange(
    field: keyof SavingsGoalFormState,
    value: string
  ) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const name = formData.name.trim();
    const targetAmount = Number(
      formData.targetAmount
    );
    const savedAmount = Number(
      formData.savedAmount || 0
    );

    if (!name) {
      setError("Enter a goal name.");
      return;
    }

    if (
      !Number.isFinite(targetAmount) ||
      targetAmount <= 0
    ) {
      setError(
        "Target amount must be greater than zero."
      );
      return;
    }

    if (
      !Number.isFinite(savedAmount) ||
      savedAmount < 0
    ) {
      setError(
        "Saved amount cannot be negative."
      );
      return;
    }

    if (savedAmount > targetAmount) {
      setError(
        "Saved amount cannot exceed the target amount."
      );
      return;
    }

    if (!formData.targetDate) {
      setError("Choose a target date.");
      return;
    }

    const duplicateGoal = savingsGoals.some(
      (goal) =>
        goal.name.toLowerCase() ===
          name.toLowerCase() &&
        goal.id !== goalToEdit?.id
    );

    if (duplicateGoal) {
      setError(
        "A savings goal with this name already exists."
      );
      return;
    }

    const goal: SavingsGoal = {
      id:
        goalToEdit?.id ??
        crypto.randomUUID(),
      name,
      targetAmount,
      savedAmount,
      currentAmount: savedAmount,
      targetDate: formData.targetDate,
      createdAt:
        goalToEdit?.createdAt ??
        new Date().toISOString(),
    };

    if (goalToEdit) {
      updateSavingsGoal(goal);
    } else {
      addSavingsGoal(goal);
    }

    onClose();
  }

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="savings-goal-form-title"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="modal-header">
          <div>
            <p className="panel-label">
              Savings planning
            </p>

            <h3 id="savings-goal-form-title">
              {isEditing
                ? "Edit Savings Goal"
                : "Create Savings Goal"}
            </h3>
          </div>

          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="Close savings goal form"
          >
            ×
          </button>
        </div>

        <form
          className="finance-form"
          onSubmit={handleSubmit}
        >
          <label className="form-field full-width">
            <span>Goal name</span>

            <input
              type="text"
              value={formData.name}
              onChange={(event) =>
                handleChange(
                  "name",
                  event.target.value
                )
              }
              placeholder="Emergency fund"
              autoFocus
            />
          </label>

          <div className="form-grid">
            <label className="form-field">
              <span>Target amount</span>

              <input
                type="number"
                min="1"
                step="0.01"
                value={formData.targetAmount}
                onChange={(event) =>
                  handleChange(
                    "targetAmount",
                    event.target.value
                  )
                }
                placeholder="100000"
              />
            </label>

            <label className="form-field">
              <span>Current saved amount</span>

              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.savedAmount}
                onChange={(event) =>
                  handleChange(
                    "savedAmount",
                    event.target.value
                  )
                }
                placeholder="25000"
              />
            </label>
          </div>

          <label className="form-field full-width">
            <span>Target date</span>

            <input
              type="date"
              value={formData.targetDate}
              onChange={(event) =>
                handleChange(
                  "targetDate",
                  event.target.value
                )
              }
            />
          </label>

          {error && (
            <p
              className="form-error"
              role="alert"
            >
              {error}
            </p>
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
              {isEditing
                ? "Save changes"
                : "Create goal"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}