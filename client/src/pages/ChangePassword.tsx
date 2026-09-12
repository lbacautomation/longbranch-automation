import {
  useState,
  type FormEvent,
} from "react";

import longbranchLogo from "../assets/longbranch-logo.png";
import { API_URL } from "../services/api";

type Employee = {
  id: number;
  name: string;
  email: string;
  role: string;
  mustChangePassword: boolean;
  mustCompleteProfile: boolean;
};

type ChangePasswordProps = {
  employeeName: string;

  onPasswordChanged: (
    employee: Employee
  ) => void;

  onLogout: () => void;
};

function ChangePassword({
  employeeName,
  onPasswordChanged,
  onLogout,
}: ChangePasswordProps) {
  const [
    currentPassword,
    setCurrentPassword,
  ] = useState("");

  const [
    newPassword,
    setNewPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [error, setError] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      setError(
        "Complete all password fields."
      );

      return;
    }

    if (newPassword.length < 12) {
      setError(
        "Your new password must be at least 12 characters."
      );

      return;
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      setError(
        "The new passwords do not match."
      );

      return;
    }

    if (
      newPassword ===
      currentPassword
    ) {
      setError(
        "Choose a new password that is different from your temporary password."
      );

      return;
    }

    try {
      setSaving(true);

      const response =
        await fetch(
          `${API_URL}/api/auth/change-password`,
          {
            method: "POST",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                currentPassword,
                newPassword,
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to change password"
        );
      }

      onPasswordChanged(
        data.employee
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to change password."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="login-page">
      <section className="login-brand-panel">
        <div className="login-brand-copy">
          <img
            src={longbranchLogo}
            alt="Longbranch Automation & Controls"
            className="login-logo"
          />

          <p className="login-eyebrow">
            Employee Portal
          </p>

          <h1>
            Welcome to Longbranch Automation
            & Controls
          </h1>

          <p className="login-description">
            We’re glad you’re here,
            {employeeName
              ? ` ${employeeName}`
              : ""}
            . Before accessing the
            portal, please replace
            your temporary password
            with a new password that
            only you know.
          </p>
        </div>
      </section>

      <section className="login-form-panel">
        <form
          className="login-card"
          onSubmit={
            handleSubmit
          }
        >
          <div>
            <p className="eyebrow">
              Account Setup
            </p>

            <h2>
              Please Change Your Password
            </h2>

            <p className="subtitle">
              For security, create a new
              password before continuing.
              Your new password must
              contain at least 12
              characters.
            </p>
          </div>

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          <label>
            <span>
              Temporary Password
            </span>

            <input
              type="password"
              autoComplete="current-password"
              value={
                currentPassword
              }
              onChange={(
                event
              ) =>
                setCurrentPassword(
                  event.target.value
                )
              }
            />
          </label>

          <label>
            <span>
              New Password
            </span>

            <input
              type="password"
              autoComplete="new-password"
              value={
                newPassword
              }
              onChange={(
                event
              ) =>
                setNewPassword(
                  event.target.value
                )
              }
            />
          </label>

          <label>
            <span>
              Confirm New Password
            </span>

            <input
              type="password"
              autoComplete="new-password"
              value={
                confirmPassword
              }
              onChange={(
                event
              ) =>
                setConfirmPassword(
                  event.target.value
                )
              }
            />
          </label>

          <button
            type="submit"
            className="primary-button"
            disabled={saving}
          >
            {saving
              ? "Updating Password..."
              : "Set New Password"}
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={onLogout}
            disabled={saving}
          >
            Log Out
          </button>
        </form>
      </section>
    </div>
  );
}

export default ChangePassword;