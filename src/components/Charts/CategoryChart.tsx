import { useMemo } from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { useFinance } from "../../context/FinanceContext";

const chartColors = [
  "#101827",
  "#40506a",
  "#5f6f89",
  "#7e8da5",
  "#9daabc",
  "#bbc4d0",
  "#2f6f5e",
  "#b7791f",
  "#b84b4b",
  "#7557a8",
];

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

interface TooltipPayloadItem {
  value?: number;
  name?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

function CustomTooltip({
  active,
  payload,
}: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const item = payload[0];

  return (
    <div className="chart-tooltip">
      <strong>{item.name}</strong>
      <span>{formatCurrency(Number(item.value ?? 0))}</span>
    </div>
  );
}

export default function CategoryChart() {
  const { transactions } = useFinance();

  const currentMonth = getCurrentMonth();

  const chartData = useMemo(() => {
    const categoryTotals = new Map<string, number>();

    transactions
      .filter(
        (transaction) =>
          transaction.type === "expense" &&
          transaction.date.startsWith(currentMonth)
      )
      .forEach((transaction) => {
        const currentTotal =
          categoryTotals.get(transaction.category) ?? 0;

        categoryTotals.set(
          transaction.category,
          currentTotal + transaction.amount
        );
      });

    return Array.from(categoryTotals.entries())
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort((first, second) => second.value - first.value);
  }, [transactions, currentMonth]);

  const totalExpenses = chartData.reduce(
    (total, category) => total + category.value,
    0
  );

  return (
    <article className="panel chart-card">
      <div className="panel-header">
        <div>
          <p className="panel-label">Spending analysis</p>
          <h3>Spending by Category</h3>
        </div>

        <span className="chart-total">
          {formatCurrency(totalExpenses)}
        </span>
      </div>

      {chartData.length === 0 ? (
        <div className="empty-chart">
          <div className="chart-placeholder">◎</div>
          <h4>No expense data this month</h4>
          <p>
            Add expenses to see how your spending is distributed.
          </p>
        </div>
      ) : (
        <div className="pie-chart-layout">
          <div className="pie-chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={105}
                  paddingAngle={3}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={
                        chartColors[index % chartColors.length]
                      }
                    />
                  ))}
                </Pie>

                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="category-summary-list">
            {chartData.slice(0, 5).map((category, index) => {
              const percentage =
                totalExpenses > 0
                  ? (category.value / totalExpenses) * 100
                  : 0;

              return (
                <div
                  className="category-summary-item"
                  key={category.name}
                >
                  <span
                    className="category-color"
                    style={{
                      background:
                        chartColors[
                          index % chartColors.length
                        ],
                    }}
                  />

                  <div>
                    <strong>{category.name}</strong>
                    <span>
                      {Math.round(percentage)}% of expenses
                    </span>
                  </div>

                  <b>{formatCurrency(category.value)}</b>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </article>
  );
}