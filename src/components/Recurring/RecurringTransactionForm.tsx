import { useEffect, useState } from "react";

import { useFinance } from "../../context/FinanceContext";

import type {
  PaymentMethod,
  RecurringFrequency,
  RecurringTransaction,
} from "../../types/finance";

interface RecurringTransactionFormProps {
  recurringToEdit: RecurringTransaction | null;
  onClose: () => void;
}

interface FormData {
  title: string;
  merchant: string;
  amount: string;
  type: "income" | "expense";
  category: string;
  paymentMethod: string;
  frequency: RecurringFrequency;
  startDate: string;
  notes: string;
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

const initialFormData: FormData = {
  title: "",
  merchant: "",
  amount: "",
  type: "expense",
  category: "",
  paymentMethod: "Bank Transfer",
  frequency: "monthly",
  startDate: getToday(),
  notes: "",
};

export default function RecurringTransactionForm({
  recurringToEdit,
  onClose,
}: RecurringTransactionFormProps) {
  const {
    addRecurringTransaction,
    updateRecurringTransaction,
  } = useFinance();

  const [formData, setFormData] =
    useState<FormData>(initialFormData);

  const [error, setError] = useState("");

  useEffect(() => {
    if (!recurringToEdit) {
      setFormData({
        ...initialFormData,
        startDate: getToday(),
      });

      return;
    }

    setFormData({
      title: recurringToEdit.title,
      merchant: recurringToEdit.merchant,
      amount: String(recurringToEdit.amount),
      type: recurringToEdit.type,
      category: recurringToEdit.category,
      paymentMethod:
        recurringToEdit.paymentMethod,
      frequency: recurringToEdit.frequency,
      startDate: recurringToEdit.startDate,
      notes: recurringToEdit.notes,
    });
  }, [recurringToEdit]);

  function handleChange(
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLSelectElement>
      | React.ChangeEvent<HTMLTextAreaElement>
  ) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
  }

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const amount = Number(formData.amount);

    if (!formData.title.trim()) {
      setError("Enter a recurring transaction title.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid amount.");
      return;
    }

    if (!formData.category.trim()) {
      setError("Enter a category.");
      return;
    }

    if (!formData.startDate) {
      setError("Select a start date.");
      return;
    }

    const recurringTransaction: RecurringTransaction = {
      id:
        recurringToEdit?.id ??
        crypto.randomUUID(),

      title: formData.title.trim(),

      merchant:
        formData.merchant.trim() ||
        formData.title.trim(),

      amount,

      type: formData.type,

      category: formData.category.trim(),

     paymentMethod: formData.paymentMethod as PaymentMethod,

      frequency: formData.frequency,

      startDate: formData.startDate,

      nextOccurrence:
        recurringToEdit?.nextOccurrence ??
        formData.startDate,

      notes: formData.notes.trim(),

      active: recurringToEdit?.active ?? true,

      createdAt:
        recurringToEdit?.createdAt ??
        new Date().toISOString(),
    };

    if (recurringToEdit) {
      updateRecurringTransaction(
        recurringTransaction
      );
    } else {
      addRecurringTransaction(
        recurringTransaction
      );
    }

    onClose();
  }

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className="modal-card recurring-form-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="recurring-form-title"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="modal-header">
          <div>
            <p className="panel-label">
              Automatic income and expenses
            </p>

            <h3 id="recurring-form-title">
              {recurringToEdit
                ? "Edit recurring transaction"
                : "Add recurring transaction"}
            </h3>
          </div>

          <button
            className="icon-button"
            type="button"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <form
          className="recurring-form"
          onSubmit={handleSubmit}
        >
          <div className="form-grid">
            <label className="full-width">
              <span>Title</span>

              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Example: Monthly salary"
              />
            </label>

            <label>
              <span>Type</span>

              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
              >
                <option value="expense">
                  Expense
                </option>

                <option value="income">
                  Income
                </option>
              </select>
            </label>

            <label>
              <span>Amount</span>

              <input
                name="amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={handleChange}
                placeholder="5000"
              />
            </label>

            <label>
              <span>Category</span>

              <input
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="Rent, Salary, Bills"
              />
            </label>

            <label>
              <span>Merchant or source</span>

              <input
                name="merchant"
                value={formData.merchant}
                onChange={handleChange}
                placeholder="Employer, landlord, Netflix"
              />
            </label>

            <label>
              <span>Frequency</span>

              <select
                name="frequency"
                value={formData.frequency}
                onChange={handleChange}
              >
                <option value="daily">
                  Daily
                </option>

                <option value="weekly">
                  Weekly
                </option>

                <option value="monthly">
                  Monthly
                </option>

                <option value="yearly">
                  Yearly
                </option>
              </select>
            </label>

            <label>
              <span>Payment method</span>

              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
              >
                <option>Bank Transfer</option>
                <option>UPI</option>
                <option>Cash</option>
                <option>Credit Card</option>
                <option>Debit Card</option>
                <option>Other</option>
              </select>
            </label>

            <label>
              <span>Start date</span>

              <input
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleChange}
              />
            </label>

            <label className="full-width">
              <span>Notes</span>

              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Optional notes"
                rows={3}
              />
            </label>
          </div>

          {error && (
            <p className="form-error">{error}</p>
          )}

          <div className="modal-actions">
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
              {recurringToEdit
                ? "Save changes"
                : "Create recurring transaction"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}