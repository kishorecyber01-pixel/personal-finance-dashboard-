import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import { useFinance } from "../../context/FinanceContext";

import type {
  PaymentMethod,
  Transaction,
  TransactionType,
} from "../../types/finance";

interface TransactionFormProps {
  transactionToEdit: Transaction | null;
  onClose: () => void;
}

const categories = [
  "Salary",
  "Freelance",
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

const paymentMethods: PaymentMethod[] = [
  "Cash",
  "UPI",
  "Debit Card",
  "Credit Card",
  "Bank Transfer",
  "Wallet",
  "Other",
];

function getTransactionNotes(
  transaction: Transaction
): string {
  if (typeof transaction.notes === "string") {
    return transaction.notes;
  }

  if (typeof transaction.description === "string") {
    return transaction.description;
  }

  return "";
}

export default function TransactionForm({
  transactionToEdit,
  onClose,
}: TransactionFormProps) {
  const {
    addTransaction,
    updateTransaction,
  } = useFinance();

  const [type, setType] =
    useState<TransactionType>("expense");

  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState("Food");
  const [amount, setAmount] = useState("");

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("UPI");

  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!transactionToEdit) {
      setType("expense");
      setDate(
        new Date().toISOString().split("T")[0]
      );
      setMerchant("");
      setCategory("Food");
      setAmount("");
      setPaymentMethod("UPI");
      setNotes("");
      setError("");
      return;
    }

    setType(transactionToEdit.type);
    setDate(transactionToEdit.date);
    setMerchant(transactionToEdit.merchant);
    setCategory(transactionToEdit.category);

    setAmount(
      transactionToEdit.amount.toString()
    );

    setPaymentMethod(
      transactionToEdit.paymentMethod
    );

    setNotes(
      getTransactionNotes(transactionToEdit)
    );

    setError("");
  }, [transactionToEdit]);

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const cleanedMerchant = merchant.trim();
    const cleanedNotes = notes.trim();
    const parsedAmount = Number(amount);

    if (!date) {
      setError(
        "Please select a transaction date."
      );
      return;
    }

    if (!cleanedMerchant) {
      setError(
        "Merchant or source is required."
      );
      return;
    }

    if (
      !Number.isFinite(parsedAmount) ||
      parsedAmount <= 0
    ) {
      setError(
        "Enter a valid amount greater than zero."
      );
      return;
    }

    const now = new Date().toISOString();

    if (transactionToEdit) {
      const updatedTransaction: Transaction = {
        ...transactionToEdit,
        type,
        date,
        merchant: cleanedMerchant,
        description:
          cleanedNotes ||
          transactionToEdit.description ||
          "",
        category,
        amount: parsedAmount,
        paymentMethod,
        notes: cleanedNotes,
        updatedAt: now,
      };

      updateTransaction(updatedTransaction);
    } else {
      const newTransaction: Transaction = {
        id: crypto.randomUUID(),
        type,
        date,
        merchant: cleanedMerchant,
        description:
          cleanedNotes ||
          `Transaction with ${cleanedMerchant}`,
        category,
        amount: parsedAmount,
        paymentMethod,
        notes: cleanedNotes,
        createdAt: now,
        updatedAt: now,
      };

      addTransaction(newTransaction);
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
        className="transaction-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-form-title"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="modal-header">
          <div>
            <p className="panel-label">
              Transaction
            </p>

            <h3 id="transaction-form-title">
              {transactionToEdit
                ? "Edit Transaction"
                : "Add Transaction"}
            </h3>
          </div>

          <button
            className="close-button"
            type="button"
            onClick={onClose}
            aria-label="Close transaction form"
          >
            ×
          </button>
        </div>

        <form
          className="transaction-form"
          onSubmit={handleSubmit}
        >
          <div className="type-selector">
            <button
              className={
                type === "expense"
                  ? "selected"
                  : ""
              }
              type="button"
              onClick={() => {
                setType("expense");
                setError("");
              }}
            >
              Expense
            </button>

            <button
              className={
                type === "income"
                  ? "selected"
                  : ""
              }
              type="button"
              onClick={() => {
                setType("income");
                setError("");
              }}
            >
              Income
            </button>
          </div>

          <div className="form-grid">
            <label>
              Date

              <input
                type="date"
                value={date}
                onChange={(event) => {
                  setDate(event.target.value);
                  setError("");
                }}
                required
              />
            </label>

            <label>
              Merchant or source

              <input
                type="text"
                placeholder="Example: Amazon or Salary"
                value={merchant}
                onChange={(event) => {
                  setMerchant(
                    event.target.value
                  );
                  setError("");
                }}
                required
              />
            </label>

            <label>
              Category

              <select
                value={category}
                onChange={(event) => {
                  setCategory(
                    event.target.value
                  );
                  setError("");
                }}
              >
                {categories.map(
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
              Amount

              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(event) => {
                  setAmount(event.target.value);
                  setError("");
                }}
                required
              />
            </label>

            <label>
              Payment method

              <select
                value={paymentMethod}
                onChange={(event) => {
                  setPaymentMethod(
                    event.target
                      .value as PaymentMethod
                  );
                  setError("");
                }}
              >
                {paymentMethods.map(
                  (method) => (
                    <option
                      key={method}
                      value={method}
                    >
                      {method}
                    </option>
                  )
                )}
              </select>
            </label>

            <label className="full-width">
              Notes

              <textarea
                placeholder="Optional information"
                value={notes}
                onChange={(event) => {
                  setNotes(event.target.value);
                  setError("");
                }}
              />
            </label>
          </div>

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
              {transactionToEdit
                ? "Save Changes"
                : "Add Transaction"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}