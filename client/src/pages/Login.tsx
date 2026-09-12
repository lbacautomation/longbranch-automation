import {
  useState,
  type FormEvent,
} from "react";

import longbranchLogo from "../assets/longbranch-logo.png";

type Employee = {
  id: number;
  name: string;
  email: string;
  role: string;
  mustChangePassword: boolean;
  mustCompleteProfile: boolean;
};

type LoginProps = {
  onLogin: (
    employee: Employee
  ) => void;
};

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

function Login({
  onLogin,
}: LoginProps) {
  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      const response =
        await fetch(
          `${API_URL}/api/auth/login`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            credentials:
              "include",

            body:
              JSON.stringify({
                email,
                password,
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to log in"
        );
      }

      onLogin(
        data.employee
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to log in"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-shell">
        <section className="login-brand-panel">
          <img
            src={longbranchLogo}
            alt="Longbranch Automation & Controls"
            className="login-logo"
          />

          <div className="login-brand-copy">
            <p className="login-eyebrow">
              Longbranch Automation
              & Controls
            </p>

            <h1>
              Business Management
              System
            </h1>

            <p className="login-description">
              Secure employee access
              for customers,
              facilities, jobs,
              billing, and business
              operations.
            </p>
          </div>
        </section>

        <section className="login-form-panel">
          <div className="login-card">
            <div className="login-heading">
              <p className="login-eyebrow">
                Employee Portal
              </p>

              <h2>
                Welcome back
              </h2>

              <p>
                Sign in to continue
                to the Longbranch
                business management
                system.
              </p>
            </div>

            <form
              className="login-form"
              onSubmit={
                handleSubmit
              }
            >
              <div className="login-field">
                <label htmlFor="email">
                  Email address
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(
                    event
                  ) =>
                    setEmail(
                      event.target
                        .value
                    )
                  }
                  autoComplete="email"
                  placeholder="name@company.com"
                  required
                />
              </div>

              <div className="login-field">
                <label htmlFor="password">
                  Password
                </label>

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(
                    event
                  ) =>
                    setPassword(
                      event.target
                        .value
                    )
                  }
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  required
                />
              </div>

              {error && (
                <div className="login-error">
                  {error}
                </div>
              )}

              <button
                className="login-submit"
                type="submit"
                disabled={loading}
              >
                {loading
                  ? "Signing in..."
                  : "Sign In"}
              </button>
            </form>

            <p className="login-secure-note">
              Authorized employees
              only
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Login;