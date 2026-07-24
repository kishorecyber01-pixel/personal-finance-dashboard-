import { useMemo } from "react";
import { useFinance } from "../../context/FinanceContext";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function FinancialInsights() {
  const { transactions, budgets } = useFinance();

  const insights = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((a, b) => a + b.amount, 0);

    const expenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((a, b) => a + b.amount, 0);

    const savings = income - expenses;

    const savingsRate =
      income === 0 ? 0 : (savings / income) * 100;

    const averageDailySpending =
      expenses / 30;

    const categoryTotals = new Map<string, number>();

    transactions
      .filter((t) => t.type === "expense")
      .forEach((transaction) => {
        categoryTotals.set(
          transaction.category,
          (categoryTotals.get(transaction.category) ?? 0) +
            transaction.amount
        );
      });

    let biggestCategory = "-";
    let biggestAmount = 0;

    categoryTotals.forEach((value, key) => {
      if (value > biggestAmount) {
        biggestCategory = key;
        biggestAmount = value;
      }
    });

    const budgetTotal = budgets.reduce(
      (sum, budget) => sum + budget.monthlyLimit,
      0
    );

    const utilization =
      budgetTotal === 0
        ? 0
        : (expenses / budgetTotal) * 100;

    const healthScore = Math.min(
      100,
      Math.max(
        0,
        Math.round(
          savingsRate * 0.6 +
            (100 - utilization) * 0.4
        )
      )
    );

    return {
      income,
      expenses,
      savings,
      savingsRate,
      averageDailySpending,
      biggestCategory,
      biggestAmount,
      utilization,
      healthScore,
    };
  }, [transactions, budgets]);

  const cards = [
    {
      title: "❤️ Financial Health",
      value: `${insights.healthScore}/100`,
      subtitle:
        insights.healthScore > 80
          ? "Excellent"
          : insights.healthScore > 60
          ? "Good"
          : "Needs attention",
    },
    {
      title: "💰 Savings Rate",
      value: `${insights.savingsRate.toFixed(1)}%`,
      subtitle: "Income saved",
    },
    {
      title: "🔥 Biggest Expense",
      value: insights.biggestCategory,
      subtitle: formatCurrency(
        insights.biggestAmount
      ),
    },
    {
      title: "📅 Avg Daily Spend",
      value: formatCurrency(
        insights.averageDailySpending
      ),
      subtitle: "Last 30 days",
    },
    {
      title: "🎯 Budget Usage",
      value: `${insights.utilization.toFixed(0)}%`,
      subtitle: "Current usage",
    },
    {
      title: "🏦 Net Savings",
      value: formatCurrency(insights.savings),
      subtitle: "Overall",
    },
  ];

  return (
    <section className="insights-grid">
      {cards.map((card) => (
        <article
          className="insight-card"
          key={card.title}
        >
          <h4>{card.title}</h4>

          <h2>{card.value}</h2>

          <p>{card.subtitle}</p>
        </article>
      ))}
    </section>
  );
}