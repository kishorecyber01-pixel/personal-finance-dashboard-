import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";

import { useFinance } from "../../context/FinanceContext";
import type { Transaction } from "../../types/finance";
import { parseTransactionsCsv } from "../../utils/csvParser";

import "./ImportTransactions.css";

interface ImportTransactionsProps {
  onClose: () => void;
}

type ImportView = "methods" | "upload" | "success";
type CurrencyCode = "INR" | "MYR";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function formatCurrency(amount: number, currency: CurrencyCode) {
  return new Intl.NumberFormat(currency === "MYR" ? "en-MY" : "en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: string) {
  const parsedDate = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ImportTransactions({
  onClose,
}: ImportTransactionsProps) {
  const { importTransactions } = useFinance();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [view, setView] = useState<ImportView>("methods");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [selectedFileSize, setSelectedFileSize] = useState(0);
  const [previewTransactions, setPreviewTransactions] = useState<Transaction[]>(
    [],
  );
  const [error, setError] = useState("");
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [currency, setCurrency] = useState<CurrencyCode>("INR");

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const totals = useMemo(() => {
    const income = previewTransactions
      .filter((transaction) => transaction.type === "income")
      .reduce((total, transaction) => total + transaction.amount, 0);

    const expenses = previewTransactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((total, transaction) => total + transaction.amount, 0);

    return {
      income,
      expenses,
      net: income - expenses,
    };
  }, [previewTransactions]);

  function resetImport() {
    setSelectedFileName("");
    setSelectedFileSize(0);
    setPreviewTransactions([]);
    setError("");
    setIsDragging(false);
    setIsReadingFile(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function validateFile(file: File) {
    const extension = file.name.split(".").pop()?.toLowerCase();

    if (extension !== "csv") {
      throw new Error(
        "Please select a CSV file. Excel and PDF support will be added next.",
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error("The selected file is larger than 5 MB.");
    }

    if (file.size === 0) {
      throw new Error("The selected CSV file is empty.");
    }
  }

  async function processFile(file: File) {
    setError("");
    setPreviewTransactions([]);
    setSelectedFileName(file.name);
    setSelectedFileSize(file.size);
    setIsReadingFile(true);

    try {
      validateFile(file);

      const csvText = await file.text();

      if (!csvText.trim()) {
        throw new Error("The selected CSV file contains no data.");
      }

      const parsedTransactions = parseTransactionsCsv(csvText);

      if (parsedTransactions.length === 0) {
        throw new Error("No valid transactions were found in this CSV file.");
      }

      setPreviewTransactions(parsedTransactions);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to read the selected file.",
      );
      setPreviewTransactions([]);
    } finally {
      setIsReadingFile(false);
    }
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (file) {
      await processFile(file);
    }
  }

  function handleDragEnter(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();

    const relatedTarget = event.relatedTarget as Node | null;

    if (relatedTarget && event.currentTarget.contains(relatedTarget)) {
      return;
    }

    setIsDragging(false);
  }

  async function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];

    if (!file) {
      setError("No file was detected. Please try again.");
      return;
    }

    await processFile(file);
  }

  function handleBack() {
    resetImport();
    setView("methods");
  }

  function handleImport() {
    if (previewTransactions.length === 0) {
      setError("Select a valid CSV file before importing.");
      return;
    }

    importTransactions(previewTransactions);
    setImportedCount(previewTransactions.length);
    setView("success");
  }

  return (
    <div
      className="import-center-overlay"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className="import-center-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-center-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="import-center-header">
          <div className="import-center-heading">
            <div className="import-center-logo" aria-hidden="true">
              ⇩
            </div>

            <div>
              <p>FinTrack Import Center</p>

              <h2 id="import-center-title">
                {view === "methods" && "Import transactions"}
                {view === "upload" && "Import CSV file"}
                {view === "success" && "Import complete"}
              </h2>

              <span>
                {view === "methods" &&
                  "Choose a secure way to add your financial data."}
                {view === "upload" &&
                  "Upload, review and confirm before anything is saved."}
                {view === "success" &&
                  "Your transactions are now available in FinTrack."}
              </span>
            </div>
          </div>

          <button
            className="import-close-button"
            type="button"
            onClick={onClose}
            aria-label="Close import center"
          >
            ×
          </button>
        </header>

        {view !== "success" && (
          <div className="import-stepper" aria-label="Import progress">
            <div
              className={`import-step ${
                view === "methods" ? "active" : "complete"
              }`}
            >
              <span>1</span>
              <p>Method</p>
            </div>

            <div className="import-step-line" />

            <div
              className={`import-step ${view === "upload" ? "active" : ""}`}
            >
              <span>2</span>
              <p>Upload &amp; review</p>
            </div>
          </div>
        )}

        <div className="import-center-body">
          {view === "methods" && (
            <>
              <div className="import-section-heading">
                <h3>Choose an import method</h3>
                <p>
                  Start with CSV today. Bank statement and Gmail import are
                  prepared for the next phase.
                </p>
              </div>

              <div className="import-method-grid">
                <button
                  className="import-method-card featured"
                  type="button"
                  onClick={() => setView("upload")}
                >
                  <span className="import-method-icon">📄</span>

                  <span className="import-method-copy">
                    <strong>CSV file</strong>
                    <small>
                      Import transactions exported from your bank, wallet or
                      another finance app.
                    </small>
                  </span>

                  <span className="import-method-meta">
                    <b>Available now</b>
                    <i>Continue →</i>
                  </span>
                </button>

                <article
                  className="import-method-card disabled"
                  aria-disabled="true"
                >
                  <span className="import-method-icon">🏦</span>

                  <span className="import-method-copy">
                    <strong>Bank statement</strong>
                    <small>
                      Upload PDF statements, including password-protected
                      documents.
                    </small>
                  </span>

                  <span className="import-method-meta">
                    <b>Coming next</b>
                  </span>
                </article>

                <article
                  className="import-method-card disabled"
                  aria-disabled="true"
                >
                  <span className="import-method-icon">✉️</span>

                  <span className="import-method-copy">
                    <strong>Gmail connection</strong>
                    <small>
                      Find monthly statement emails and review them before
                      importing.
                    </small>
                  </span>

                  <span className="import-method-meta">
                    <b>Coming soon</b>
                  </span>
                </article>
              </div>

              <div className="import-security-note">
                <span aria-hidden="true">🔒</span>

                <div>
                  <strong>Your data stays under your control</strong>
                  <p>
                    FinTrack only imports the transactions you review and
                    approve.
                  </p>
                </div>
              </div>
            </>
          )}

          {view === "upload" && (
            <>
              <div className="import-upload-layout">
                <div className="import-upload-column">
                  <div
                    className={`import-drop-zone ${
                      isDragging ? "drag-active" : ""
                    } ${
                      previewTransactions.length > 0 ? "has-file" : ""
                    }`}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input
                      ref={fileInputRef}
                      className="import-hidden-input"
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleFileChange}
                    />

                    <div className="import-upload-icon" aria-hidden="true">
                      {isReadingFile
                        ? "⏳"
                        : previewTransactions.length > 0
                          ? "✓"
                          : "☁"}
                    </div>

                    <h3>
                      {isReadingFile
                        ? "Reading your file…"
                        : previewTransactions.length > 0
                          ? "File ready to review"
                          : isDragging
                            ? "Drop the file here"
                            : "Drag and drop your CSV"}
                    </h3>

                    <p>
                      {previewTransactions.length > 0
                        ? "We found valid transactions. Review the summary below before importing."
                        : "or browse securely from your computer"}
                    </p>

                    <button
                      className="import-primary-button"
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isReadingFile}
                    >
                      {selectedFileName
                        ? "Choose another file"
                        : "Browse CSV file"}
                    </button>

                    <span className="import-file-limit">
                      CSV · Maximum 5 MB
                    </span>
                  </div>

                  {selectedFileName && (
                    <div className="import-file-card">
                      <span className="import-file-type">CSV</span>

                      <div>
                        <strong>{selectedFileName}</strong>
                        <p>
                          {formatFileSize(selectedFileSize)} ·{" "}
                          {isReadingFile
                            ? "Processing…"
                            : previewTransactions.length > 0
                              ? `${previewTransactions.length} transactions detected`
                              : "Needs attention"}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={resetImport}
                        aria-label="Remove selected file"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>

                <aside className="import-format-card">
                  <div className="import-format-icon">✓</div>
                  <h3>Simple file requirements</h3>

                  <ul>
                    <li>A transaction date column</li>
                    <li>A description or merchant column</li>
                    <li>
                      Amount + type, or separate debit and credit columns
                    </li>
                  </ul>

                  <div className="import-format-example">
                    <span>Example headings</span>
                    <code>Date, Description, Amount, Type</code>
                  </div>
                </aside>
              </div>

              {error && (
                <div className="import-alert" role="alert">
                  <span>!</span>
                  <p>{error}</p>
                </div>
              )}

              {previewTransactions.length > 0 && (
                <>
                  <div className="import-currency-row">
                    <div>
                      <strong>Display currency</strong>
                      <span>
                        Choose Indian Rupee or Malaysian Ringgit for this preview.
                      </span>
                    </div>

                    <label className="import-currency-select">
                      <span className="sr-only">Select currency</span>
                      <select
                        value={currency}
                        onChange={(event) =>
                          setCurrency(event.target.value as CurrencyCode)
                        }
                      >
                        <option value="INR">₹ INR — Indian Rupee</option>
                        <option value="MYR">RM MYR — Malaysian Ringgit</option>
                      </select>
                    </label>
                  </div>

                  <div className="import-summary-grid">
                    <article>
                      <span>Transactions</span>
                      <strong>{previewTransactions.length}</strong>
                    </article>

                    <article>
                      <span>Total income</span>
                      <strong className="income">
                        {formatCurrency(totals.income, currency)}
                      </strong>
                    </article>

                    <article>
                      <span>Total expenses</span>
                      <strong className="expense">
                        {formatCurrency(totals.expenses, currency)}
                      </strong>
                    </article>

                    <article>
                      <span>Net amount</span>
                      <strong>{formatCurrency(totals.net, currency)}</strong>
                    </article>
                  </div>

                  <section className="import-preview-card">
                    <div className="import-preview-header">
                      <div>
                        <h3>Transaction preview</h3>
                        <p>
                          Showing the first 10 of {previewTransactions.length}{" "}
                          transactions.
                        </p>
                      </div>

                      <span>Ready to import</span>
                    </div>

                    <div className="import-table-wrapper">
                      <table className="import-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Description</th>
                            <th>Category</th>
                            <th>Type</th>
                            <th>Amount</th>
                          </tr>
                        </thead>

                        <tbody>
                          {previewTransactions
                            .slice(0, 10)
                            .map((transaction, index) => (
                              <tr key={`${transaction.id}-${index}`}>
                                <td>{formatDate(transaction.date)}</td>
                                <td>{transaction.merchant}</td>
                                <td>{transaction.category}</td>
                                <td>
                                  <span
                                    className={`import-type-badge ${transaction.type}`}
                                  >
                                    {transaction.type}
                                  </span>
                                </td>
                                <td>{formatCurrency(transaction.amount, currency)}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </>
              )}
            </>
          )}

          {view === "success" && (
            <div className="import-success-state">
              <div className="import-success-icon">✓</div>
              <p>Import successful</p>
              <h3>{importedCount} transactions added</h3>
              <span>
                Your dashboard, reports and charts have been updated.
              </span>

              <div className="import-success-summary">
                <div>
                  <strong>{importedCount}</strong>
                  <small>Imported</small>
                </div>

                <div>
                  <strong>CSV</strong>
                  <small>Source</small>
                </div>

                <div>
                  <strong>Done</strong>
                  <small>Status</small>
                </div>
              </div>

              <button
                className="import-primary-button import-success-button"
                type="button"
                onClick={onClose}
              >
                View transactions
              </button>
            </div>
          )}
        </div>

        {view === "methods" && (
          <footer className="import-center-footer">
            <button
              className="import-secondary-button"
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>
          </footer>
        )}

        {view === "upload" && (
          <footer className="import-center-footer">
            <button
              className="import-secondary-button"
              type="button"
              onClick={handleBack}
            >
              ← Back
            </button>

            <button
              className="import-primary-button"
              type="button"
              onClick={handleImport}
              disabled={
                previewTransactions.length === 0 || isReadingFile
              }
            >
              {previewTransactions.length > 0
                ? `Import ${previewTransactions.length} transactions`
                : "Import transactions"}
            </button>
          </footer>
        )}
      </section>
    </div>
  );
}