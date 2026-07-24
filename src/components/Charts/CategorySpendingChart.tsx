import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import { useFinance } from "../../context/FinanceContext";

const COLORS = [
  "#4F46E5",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#06B6D4",
  "#8B5CF6",
  "#EC4899",
  "#84CC16",
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function CategorySpendingChart() {
  const { transactions } = useFinance();

  const data = useMemo(() => {
    const totals = new Map<string, number>();

    transactions
      .filter((transaction) => transaction.type === "expense")
      .forEach((transaction) => {
        totals.set(
          transaction.category,
          (totals.get(transaction.category) ?? 0) +
            transaction.amount
        );
      });

    return Array.from(totals.entries()).map(
      ([category, value]) => ({
        name: category,
        value,
      })
    );
  }, [transactions]);

  const hasData = data.length > 0;

  return (
    <article className="panel chart-card">
      <div className="panel-header">
        <div>
          <p className="panel-label">Expense Analysis</p>
          <h3>Category Spending</h3>
        </div>
      </div>

      {!hasData ? (
        <div className="empty-chart">
          <div className="chart-placeholder">🍩</div>
          <h4>No expense data</h4>
          <p>Add expense transactions to view this chart.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={340}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={70}
              outerRadius={110}
              paddingAngle={4}
            >
              {data.map((_, index) => (
                <Cell
                  key={index}
                  fill={
                    COLORS[index % COLORS.length]
                  }
                />
              ))}
            </Pie>

            <Tooltip
              formatter={(value) =>
                formatCurrency(Number(value))
              }
            />

            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </article>
  );
}