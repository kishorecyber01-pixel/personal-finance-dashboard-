import { useMemo, useState } from "react";

import { useFinance } from "../../context/FinanceContext";

import type { SavingsGoal } from "../../types/finance";

interface SavingsGoalsPanelProps {
  onAdd: () => void;
  onEdit: (goal: SavingsGoal) => void;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
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

export default function SavingsGoalsPanel({
  onAdd,
  onEdit,
}: SavingsGoalsPanelProps) {
  const {
    savingsGoals,
    deleteSavingsGoal,
    addMoneyToSavingsGoal,
  } = useFinance();

  const [customAmounts, setCustomAmounts] = useState<
    Record<string, string>
  >({});

  const statistics = useMemo(() => {
    const totalTarget = savingsGoals.reduce(
      (total, goal) => total + goal.targetAmount,
      0
    );

    const totalSaved = savingsGoals.reduce(
      (total, goal) => total + goal.savedAmount,
      0
    );

    const completed = savingsGoals.filter(
      (goal) => goal.savedAmount >= goal.targetAmount
    ).length;

    const overallProgress =
      totalTarget > 0
        ? Math.min((totalSaved / totalTarget) * 100, 100)
        : 0;

    return {
      completed,
      remaining: Math.max(totalTarget - totalSaved, 0),
      overallProgress,
    };
  }, [savingsGoals]);

  function handleDelete(goal: SavingsGoal) {
    const confirmed = window.confirm(
      `Delete the savings goal "${goal.name}"?`
    );

    if (confirmed) {
      deleteSavingsGoal(goal.id);
    }
  }

  function handleQuickAdd(
    goalId: string,
    amount: number
  ) {
    addMoneyToSavingsGoal(goalId, amount);
  }

  function handleCustomAdd(goalId: string) {
    const amount = Number(customAmounts[goalId]);

    if (!Number.isFinite(amount) || amount <= 0) {
      return;
    }

    addMoneyToSavingsGoal(goalId, amount);

    setCustomAmounts((current) => ({
      ...current,
      [goalId]: "",
    }));
  }

  return (
    <section className="panel savings-panel">
      <div className="panel-header">
        <div>
          <p className="panel-label">
            Financial planning
          </p>

          <h3>Savings Goals</h3>
        </div>

        <button
          className="primary-button"
          type="button"
          onClick={onAdd}
        >
          + Add goal
        </button>
      </div>

      <div className="savings-stats-grid">
        <article className="savings-stat-card">
          <span>Total goals</span>
          <strong>{savingsGoals.length}</strong>
        </article>

        <article className="savings-stat-card">
          <span>Completed</span>
          <strong>{statistics.completed}</strong>
        </article>

        <article className="savings-stat-card">
          <span>Remaining</span>
          <strong>
            {formatCurrency(statistics.remaining)}
          </strong>
        </article>

        <article className="savings-stat-card">
          <span>Overall progress</span>
          <strong>
            {Math.round(
              statistics.overallProgress
            )}
            %
          </strong>
        </article>
      </div>

      {savingsGoals.length === 0 ? (
        <div className="empty-state savings-empty-state">
          <div className="empty-state-icon">🎯</div>

          <h4>No savings goals yet</h4>

          <p>
            Create your first goal and start tracking
            your progress.
          </p>

          <button
            className="primary-button"
            type="button"
            onClick={onAdd}
          >
            Create savings goal
          </button>
        </div>
      ) : (
        <div className="savings-goals-grid">
          {savingsGoals.map((goal) => {
            const progress =
              goal.targetAmount > 0
                ? Math.min(
                    (goal.savedAmount /
                      goal.targetAmount) *
                      100,
                    100
                  )
                : 0;

            const remaining = Math.max(
              goal.targetAmount - goal.savedAmount,
              0
            );

            const completed = progress >= 100;

            const overdue =
              !completed &&
              new Date(
                `${goal.targetDate}T23:59:59`
              ).getTime() < Date.now();

            return (
              <article
                className={`savings-goal-card ${
                  completed ? "completed" : ""
                }`}
                key={goal.id}
              >
                <div className="savings-goal-header">
                  <div>
                    <p className="goal-status-label">
                      {completed
                        ? "Goal completed"
                        : overdue
                        ? "Target date passed"
                        : "In progress"}
                    </p>

                    <h4>{goal.name}</h4>
                  </div>

                  <div className="goal-card-actions">
                    <button
                      className="small-button"
                      type="button"
                      onClick={() => onEdit(goal)}
                    >
                      Edit
                    </button>

                    <button
                      className="small-button danger"
                      type="button"
                      onClick={() =>
                        handleDelete(goal)
                      }
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="goal-amount-row">
                  <div>
                    <span>Saved</span>
                    <strong>
                      {formatCurrency(
                        goal.savedAmount
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Target</span>
                    <strong>
                      {formatCurrency(
                        goal.targetAmount
                      )}
                    </strong>
                  </div>
                </div>

                <div className="goal-progress-header">
                  <span>
                    {Math.round(progress)}% complete
                  </span>

                  <span>
                    {completed
                      ? "Completed 🎉"
                      : `${formatCurrency(
                          remaining
                        )} remaining`}
                  </span>
                </div>

                <div className="goal-progress-track">
                  <div
                    className="goal-progress-fill"
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </div>

                <div className="goal-date-row">
                  <span>Target date</span>

                  <strong>
                    {formatDate(goal.targetDate)}
                  </strong>
                </div>

                {!completed && (
                  <div className="goal-contribution-area">
                    <p>Add money</p>

                    <div className="quick-add-buttons">
                      {[500, 1000, 5000].map(
                        (amount) => (
                          <button
                            key={amount}
                            className="quick-add-button"
                            type="button"
                            onClick={() =>
                              handleQuickAdd(
                                goal.id,
                                amount
                              )
                            }
                          >
                            +{formatCurrency(amount)}
                          </button>
                        )
                      )}
                    </div>

                    <div className="custom-add-row">
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={
                          customAmounts[goal.id] ?? ""
                        }
                        onChange={(event) =>
                          setCustomAmounts(
                            (current) => ({
                              ...current,
                              [goal.id]:
                                event.target.value,
                            })
                          )
                        }
                        placeholder="Custom amount"
                      />

                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() =>
                          handleCustomAdd(goal.id)
                        }
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}