import { useState } from "react";

import { supabase } from "../../lib/supabase";

type AuthMode = "login" | "register";

interface AuthPageProps {
  onAuthenticated: () => void;
}

export default function AuthPage({
  onAuthenticated,
}: AuthPageProps) {
  const [mode, setMode] =
    useState<AuthMode>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] =
    useState(false);

  function resetMessages() {
    setMessage("");
    setError("");
  }

  function switchMode(newMode: AuthMode) {
    setMode(newMode);
    setPassword("");
    setConfirmPassword("");
    resetMessages();
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    resetMessages();

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      setError(
        "Please enter your email and password."
      );
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must contain at least 6 characters."
      );
      return;
    }

    if (
      mode === "register" &&
      password !== confirmPassword
    ) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      if (mode === "register") {
        const { data, error: signUpError } =
          await supabase.auth.signUp({
            email: cleanEmail,
            password,
          });

        if (signUpError) {
          throw signUpError;
        }

        if (data.session) {
          onAuthenticated();
          return;
        }

        setMessage(
          "Account created. Check your email and confirm your account before signing in."
        );

        setMode("login");
        setPassword("");
        setConfirmPassword("");
        return;
      }

      const { error: loginError } =
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

      if (loginError) {
        throw loginError;
      }

      onAuthenticated();
    } catch (caughtError) {
      const errorMessage =
        caughtError instanceof Error
          ? caughtError.message
          : "Authentication failed. Please try again.";

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-brand-panel">
        <div className="auth-brand-content">
          <div className="brand-icon">₹</div>

          <p className="eyebrow">
            Personal finance management
          </p>

          <h1>Take control of your money with FinTrack.</h1>

          <p>
            Track income, expenses, budgets,
            savings goals, recurring payments,
            reports, and financial alerts in one
            secure dashboard.
          </p>
        </div>
      </section>

      <section className="auth-form-panel">
        <div className="auth-card">
          <div className="auth-card-header">
            <p className="panel-label">
              Welcome to FinTrack
            </p>

            <h2>
              {mode === "login"
                ? "Sign in to your account"
                : "Create your account"}
            </h2>

            <p>
              {mode === "login"
                ? "Enter your credentials to access your dashboard."
                : "Create an account to start managing your finances."}
            </p>
          </div>

          <div className="auth-mode-tabs">
            <button
              type="button"
              className={
                mode === "login" ? "active" : ""
              }
              onClick={() => switchMode("login")}
            >
              Sign in
            </button>

            <button
              type="button"
              className={
                mode === "register" ? "active" : ""
              }
              onClick={() =>
                switchMode("register")
              }
            >
              Register
            </button>
          </div>

          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >
            <label>
              Email address

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </label>

            <label>
              Password

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Minimum 6 characters"
                autoComplete={
                  mode === "login"
                    ? "current-password"
                    : "new-password"
                }
                required
              />
            </label>

            {mode === "register" && (
              <label>
                Confirm password

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value
                    )
                  }
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  required
                />
              </label>
            )}

            {error && (
              <div className="auth-message auth-error">
                {error}
              </div>
            )}

            {message && (
              <div className="auth-message auth-success">
                {message}
              </div>
            )}

            <button
              className="primary-button auth-submit"
              type="submit"
              disabled={isLoading}
            >
              {isLoading
                ? "Please wait..."
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}