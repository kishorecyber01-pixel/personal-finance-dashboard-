import { useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import { useFinance } from "../../context/FinanceContext";

type ReportPeriod = "month" | "year" | "all";
type ReportType =
  | "complete"
  | "income"
  | "expenses"
  | "budgets"
  | "savings";

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

function getCurrentMonth() {
  const today = new Date();

  return `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}`;
}

function getCurrentYear() {
  return String(new Date().getFullYear());
}

function createFileDate() {
  return new Date().toISOString().slice(0, 10);
}

export default function ReportsPanel() {
  const {
    transactions,
    budgets,
    savingsGoals,
  } = useFinance();

  const [reportPeriod, setReportPeriod] =
    useState<ReportPeriod>("month");

  const [reportType, setReportType] =
    useState<ReportType>("complete");

  const filteredTransactions = useMemo(() => {
    const currentMonth = getCurrentMonth();
    const currentYear = getCurrentYear();

    return transactions.filter((transaction) => {
      if (reportPeriod === "month") {
        return transaction.date.startsWith(currentMonth);
      }

      if (reportPeriod === "year") {
        return transaction.date.startsWith(currentYear);
      }

      return true;
    });
  }, [transactions, reportPeriod]);

  const reportTransactions = useMemo(() => {
    if (reportType === "income") {
      return filteredTransactions.filter(
        (transaction) =>
          transaction.type === "income"
      );
    }

    if (reportType === "expenses") {
      return filteredTransactions.filter(
        (transaction) =>
          transaction.type === "expense"
      );
    }

    return filteredTransactions;
  }, [filteredTransactions, reportType]);

  const totals = useMemo(() => {
    const income = filteredTransactions
      .filter(
        (transaction) =>
          transaction.type === "income"
      )
      .reduce(
        (total, transaction) =>
          total + transaction.amount,
        0
      );

    const expenses = filteredTransactions
      .filter(
        (transaction) =>
          transaction.type === "expense"
      )
      .reduce(
        (total, transaction) =>
          total + transaction.amount,
        0
      );

    return {
      income,
      expenses,
      savings: income - expenses,
    };
  }, [filteredTransactions]);

  const periodLabel =
    reportPeriod === "month"
      ? "Current Month"
      : reportPeriod === "year"
        ? "Current Year"
        : "All Time";

  const reportTitle =
    reportType === "complete"
      ? "Complete Financial Report"
      : reportType === "income"
        ? "Income Report"
        : reportType === "expenses"
          ? "Expense Report"
          : reportType === "budgets"
            ? "Budget Report"
            : "Savings Goals Report";

  function exportPdf() {
    const document = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    document.setFontSize(20);
    document.text("FinTrack", 14, 18);

    document.setFontSize(14);
    document.text(reportTitle, 14, 27);

    document.setFontSize(10);
    document.text(`Period: ${periodLabel}`, 14, 34);
    document.text(
      `Generated: ${new Date().toLocaleDateString(
        "en-IN"
      )}`,
      14,
      40
    );

    document.setFontSize(11);
    document.text(
      `Income: ${formatCurrency(totals.income)}`,
      14,
      50
    );

    document.text(
      `Expenses: ${formatCurrency(totals.expenses)}`,
      85,
      50
    );

    document.text(
      `Net Savings: ${formatCurrency(
        totals.savings
      )}`,
      165,
      50
    );

    if (
      reportType === "complete" ||
      reportType === "income" ||
      reportType === "expenses"
    ) {
      autoTable(document, {
        startY: 58,
        head: [
          [
            "Date",
            "Merchant",
            "Category",
            "Payment",
            "Type",
            "Amount",
            "Notes",
          ],
        ],
        body: reportTransactions.map(
          (transaction) => [
            formatDate(transaction.date),
            transaction.merchant,
            transaction.category,
            transaction.paymentMethod,
            transaction.type,
            formatCurrency(transaction.amount),
            transaction.notes || "-",
          ]
        ),
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [36, 107, 255],
        },
      });
    }

    if (reportType === "budgets") {
      autoTable(document, {
        startY: 58,
        head: [
          [
            "Month",
            "Category",
            "Monthly Limit",
          ],
        ],
        body: budgets.map((budget) => [
          budget.month,
          budget.category,
          formatCurrency(budget.monthlyLimit),
        ]),
        styles: {
          fontSize: 9,
          cellPadding: 4,
        },
        headStyles: {
          fillColor: [36, 107, 255],
        },
      });
    }

    if (reportType === "savings") {
      autoTable(document, {
        startY: 58,
        head: [
          [
            "Goal",
            "Target",
            "Saved",
            "Remaining",
            "Deadline",
          ],
        ],
        body: savingsGoals.map((goal) => [
          goal.name,
          formatCurrency(goal.targetAmount),
          formatCurrency(goal.currentAmount),
          formatCurrency(
            Math.max(
              goal.targetAmount -
                goal.currentAmount,
              0
            )
          ),
          goal.targetDate
            ? formatDate(goal.targetDate)
            : "-",
        ]),
        styles: {
          fontSize: 9,
          cellPadding: 4,
        },
        headStyles: {
          fillColor: [36, 107, 255],
        },
      });
    }

    document.save(
      `fintrack-${reportType}-${createFileDate()}.pdf`
    );
  }

  function exportExcel() {
    const workbook = XLSX.utils.book_new();

    const summaryData = [
      {
        Period: periodLabel,
        Report: reportTitle,
        Income: totals.income,
        Expenses: totals.expenses,
        "Net Savings": totals.savings,
        Generated: new Date().toLocaleDateString(
          "en-IN"
        ),
      },
    ];

    const summarySheet =
      XLSX.utils.json_to_sheet(summaryData);

    XLSX.utils.book_append_sheet(
      workbook,
      summarySheet,
      "Summary"
    );

    if (
      reportType === "complete" ||
      reportType === "income" ||
      reportType === "expenses"
    ) {
      const transactionData =
        reportTransactions.map((transaction) => ({
          Date: transaction.date,
          Merchant: transaction.merchant,
          Category: transaction.category,
          "Payment Method":
            transaction.paymentMethod,
          Type: transaction.type,
          Amount: transaction.amount,
          Notes: transaction.notes || "",
        }));

      const transactionSheet =
        XLSX.utils.json_to_sheet(transactionData);

      transactionSheet["!cols"] = [
        { wch: 14 },
        { wch: 28 },
        { wch: 18 },
        { wch: 18 },
        { wch: 12 },
        { wch: 14 },
        { wch: 35 },
      ];

      XLSX.utils.book_append_sheet(
        workbook,
        transactionSheet,
        "Transactions"
      );
    }

    if (
      reportType === "complete" ||
      reportType === "budgets"
    ) {
      const budgetData = budgets.map(
        (budget) => ({
          Month: budget.month,
          Category: budget.category,
          "Monthly Limit":
            budget.monthlyLimit,
        })
      );

      const budgetSheet =
        XLSX.utils.json_to_sheet(budgetData);

      XLSX.utils.book_append_sheet(
        workbook,
        budgetSheet,
        "Budgets"
      );
    }

    if (
      reportType === "complete" ||
      reportType === "savings"
    ) {
      const savingsData = savingsGoals.map(
        (goal) => ({
          Goal: goal.name,
          Target: goal.targetAmount,
          Saved: goal.currentAmount,
          Remaining: Math.max(
            goal.targetAmount -
              goal.currentAmount,
            0
          ),
          "Target Date": goal.targetDate || "",
        })
      );

      const savingsSheet =
        XLSX.utils.json_to_sheet(savingsData);

      XLSX.utils.book_append_sheet(
        workbook,
        savingsSheet,
        "Savings Goals"
      );
    }

    XLSX.writeFile(
      workbook,
      `fintrack-${reportType}-${createFileDate()}.xlsx`,
      {
        compression: true,
      }
    );
  }

  return (
    <section
      className="panel reports-panel"
      id="reports-section"
    >
      <div className="panel-header">
        <div>
          <p className="panel-label">
            Download and archive
          </p>

          <h3>Financial Reports</h3>

          <p className="reports-description">
            Export transactions, budgets, and savings
            data as PDF or Excel.
          </p>
        </div>
      </div>

      <div className="report-controls">
        <label>
          <span>Report type</span>

          <select
            value={reportType}
            onChange={(event) =>
              setReportType(
                event.target.value as ReportType
              )
            }
          >
            <option value="complete">
              Complete report
            </option>

            <option value="income">
              Income report
            </option>

            <option value="expenses">
              Expense report
            </option>

            <option value="budgets">
              Budget report
            </option>

            <option value="savings">
              Savings goals report
            </option>
          </select>
        </label>

        <label>
          <span>Period</span>

          <select
            value={reportPeriod}
            onChange={(event) =>
              setReportPeriod(
                event.target.value as ReportPeriod
              )
            }
          >
            <option value="month">
              Current month
            </option>

            <option value="year">
              Current year
            </option>

            <option value="all">
              All time
            </option>
          </select>
        </label>
      </div>

      <div className="report-preview-grid">
        <article>
          <span>Transactions</span>
          <strong>
            {reportTransactions.length}
          </strong>
        </article>

        <article>
          <span>Income</span>
          <strong>
            {formatCurrency(totals.income)}
          </strong>
        </article>

        <article>
          <span>Expenses</span>
          <strong>
            {formatCurrency(totals.expenses)}
          </strong>
        </article>

        <article>
          <span>Net savings</span>
          <strong>
            {formatCurrency(totals.savings)}
          </strong>
        </article>
      </div>

      <div className="report-actions">
        <button
          className="secondary-button"
          type="button"
          onClick={exportExcel}
        >
          Download Excel
        </button>

        <button
          className="primary-button"
          type="button"
          onClick={exportPdf}
        >
          Download PDF
        </button>
      </div>
    </section>
  );
}