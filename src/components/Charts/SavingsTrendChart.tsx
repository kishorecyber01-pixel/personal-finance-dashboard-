import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useFinance } from "../../context/FinanceContext";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getLastSixMonths() {
  const months: {
    key: string;
    label: string;
  }[] = [];

  const today = new Date();

  for (let index = 5; index >= 0; index -= 1) {
    const date = new Date(
      today.getFullYear(),
      today.getMonth() - index,
      1
    );

    months.push({
      key: `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`,
      label: date.toLocaleDateString("en-IN", {
        month: "short",
      }),
    });
  }

  return months;
}

export default function SavingsTrendChart() {
  const { transactions } = useFinance();

  const chartData = useMemo(() => {
    return getLastSixMonths().map((month) => {
      const monthlyTransactions = transactions.filter(
        (transaction) =>
          transaction.date.startsWith(month.key)
      );

      const income = monthlyTransactions
        .filter(
          (transaction) => transaction.type === "income"
        )
        .reduce(
          (total, transaction) =>
            total + transaction.amount,
          0
        );

      const expenses = monthlyTransactions
        .filter(
          (transaction) => transaction.type === "expense"
        )
        .reduce(
          (total, transaction) =>
            total + transaction.amount,
          0
        );

      return {
        month: month.label,
        savings: income - expenses,
      };
    });
  }, [transactions]);

  const hasData = chartData.some(
    (month) => month.savings !== 0
  );

  return (
    <article className="panel chart-card savings-chart-card">
      <div className="panel-header">
        <div>
          <p className="panel-label">
            Six-month overview
          </p>

          <h3>Savings Trend</h3>
        </div>
      </div>

      {!hasData ? (
        <div className="empty-chart">
          <div className="chart-placeholder">⌁</div>

          <h4>No savings data available</h4>

          <p>
            Add income and expense transactions to view
            your savings trend.
          </p>
        </div>
      ) : (
        <div className="trend-chart-container">
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart
              data={chartData}
              margin={{
                top: 20,
                right: 10,
                left: 0,
                bottom: 0,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                tickFormatter={(value) =>
                  Math.abs(value) >= 1000
                    ? `₹${Math.round(value / 1000)}k`
                    : `₹${value}`
                }
                tickLine={false}
                axisLine={false}
              />

              <Tooltip
                formatter={(value) => [
                  formatCurrency(Number(value)),
                  "Savings",
                ]}
              />

              <Area
                type="monotone"
                dataKey="savings"
                name="Savings"
                stroke="#246bff"
                fill="#dbe8ff"
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </article>
  );
}