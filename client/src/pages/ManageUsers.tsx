import {
  useEffect,
  useState,
} from "react";

import { API_URL } from "../services/api";

type EmployeeUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  mustChangePassword: boolean;
  mustCompleteProfile?: boolean;

  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  startDate?: string | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;

  createdAt: string;
};

function ManageUsers() {
  const [users, setUsers] =
    useState<EmployeeUser[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [
    expandedUserId,
    setExpandedUserId,
  ] = useState<number | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await fetch(
          `${API_URL}/api/employees`,
          {
            credentials: "include",
          }
        );

      if (!response.ok) {
        const data =
          await response.json();

        throw new Error(
          data.message ||
            "Unable to load users"
        );
      }

      const data:
        EmployeeUser[] =
          await response.json();

      setUsers(data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load users."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const toggleProfile = (
    userId: number
  ) => {
    setExpandedUserId(
      (currentId) =>
        currentId === userId
          ? null
          : userId
    );
  };

  const formatDate = (
    value?: string | null
  ) => {
    if (!value) {
      return "—";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "—";
    }

    return date.toLocaleDateString();
  };

  const requirePasswordChange =
    async (
      user: EmployeeUser
    ) => {
      const confirmed =
        window.confirm(
          `Require ${user.name} to change their password the next time they access the portal?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setError("");
        setMessage("");

        const response =
          await fetch(
            `${API_URL}/api/employees/${user.id}/require-password-change`,
            {
              method: "PATCH",
              credentials:
                "include",
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to update user"
          );
        }

        setUsers(
          (currentUsers) =>
            currentUsers.map(
              (currentUser) =>
                currentUser.id ===
                user.id
                  ? {
                      ...currentUser,
                      ...data,
                    }
                  : currentUser
            )
        );

        setMessage(
          `${user.name} will be required to change their password.`
        );
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to update user."
        );
      }
    };

  const deleteUser =
    async (
      user: EmployeeUser
    ) => {
      const confirmed =
        window.confirm(
          `Delete ${user.name} (${user.email})?\n\nThis permanently removes their portal account.`
        );

      if (!confirmed) {
        return;
      }

      try {
        setError("");
        setMessage("");

        const response =
          await fetch(
            `${API_URL}/api/employees/${user.id}`,
            {
              method: "DELETE",
              credentials:
                "include",
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to delete user"
          );
        }

        setUsers(
          (currentUsers) =>
            currentUsers.filter(
              (currentUser) =>
                currentUser.id !==
                user.id
            )
        );

        if (
          expandedUserId ===
          user.id
        ) {
          setExpandedUserId(
            null
          );
        }

        setMessage(
          `${user.name} was deleted.`
        );
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to delete user."
        );
      }
    };

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">
            Longbranch Automation
            & Controls
          </p>

          <h2>
            Manage Users
          </h2>

          <p className="subtitle">
            Manage employee portal
            accounts, profiles, and
            password requirements.
          </p>
        </div>
      </header>

      {error && (
        <div className="form-error">
          {error}
        </div>
      )}

      {message && (
        <div className="form-success">
          {message}
        </div>
      )}

      <section className="form-card">
        <div className="form-card-header">
          <div>
            <h3>
              Employee Accounts
            </h3>

            <p>
              View employee profiles,
              require password resets,
              or remove portal accounts.
            </p>
          </div>
        </div>

        <div className="invoice-table">
          <div className="table-row table-header">
            <span>
              Employee
            </span>

            <span>
              Email
            </span>

            <span>
              Role
            </span>

            <span>
              Password
            </span>

            <span>
              Actions
            </span>
          </div>

          {loading ? (
            <div className="table-row">
              <span>
                Loading users...
              </span>
            </div>
          ) : users.length === 0 ? (
            <div className="table-row">
              <span>
                No users found.
              </span>
            </div>
          ) : (
            users.map(
              (user) => (
                <div
                  className="employee-account"
                  key={user.id}
                >
                  <div className="table-row">
                    <strong>
                      {user.name}
                    </strong>

                    <span>
                      {user.email}
                    </span>

                    <span>
                      {user.role}
                    </span>

                    <span>
                      {user.mustChangePassword
                        ? "Change required"
                        : "Current"}
                    </span>

                    <span className="employee-actions">
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() =>
                          toggleProfile(
                            user.id
                          )
                        }
                      >
                        {expandedUserId ===
                        user.id
                          ? "Hide Profile"
                          : "View Profile"}
                      </button>

                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() =>
                          requirePasswordChange(
                            user
                          )
                        }
                        disabled={
                          user.role ===
                          "ADMIN"
                        }
                      >
                        Require Reset
                      </button>

                      <button
                        type="button"
                        className="danger-button"
                        onClick={() =>
                          deleteUser(
                            user
                          )
                        }
                        disabled={
                          user.role ===
                          "ADMIN"
                        }
                      >
                        Delete
                      </button>
                    </span>
                  </div>

                  {expandedUserId ===
                    user.id && (
                    <div className="employee-profile-panel">
                      <div className="employee-profile-grid">
                        <div>
                          <span className="invoice-label">
                            Phone
                          </span>

                          <p>
                            {user.phone ||
                              "—"}
                          </p>
                        </div>

                        <div>
                          <span className="invoice-label">
                            Start Date
                          </span>

                          <p>
                            {formatDate(
                              user.startDate
                            )}
                          </p>
                        </div>

                        <div>
                          <span className="invoice-label">
                            Street Address
                          </span>

                          <p>
                            {user.address ||
                              "—"}
                          </p>
                        </div>

                        <div>
                          <span className="invoice-label">
                            City
                          </span>

                          <p>
                            {user.city ||
                              "—"}
                          </p>
                        </div>

                        <div>
                          <span className="invoice-label">
                            State
                          </span>

                          <p>
                            {user.state ||
                              "—"}
                          </p>
                        </div>

                        <div>
                          <span className="invoice-label">
                            ZIP Code
                          </span>

                          <p>
                            {user.zipCode ||
                              "—"}
                          </p>
                        </div>

                        <div>
                          <span className="invoice-label">
                            Emergency Contact
                          </span>

                          <p>
                            {user.emergencyContact ||
                              "—"}
                          </p>
                        </div>

                        <div>
                          <span className="invoice-label">
                            Emergency Phone
                          </span>

                          <p>
                            {user.emergencyPhone ||
                              "—"}
                          </p>
                        </div>

                        <div>
                          <span className="invoice-label">
                            Profile Status
                          </span>

                          <p>
                            {user.mustCompleteProfile
                              ? "Profile completion required"
                              : "Complete"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            )
          )}
        </div>
      </section>
    </>
  );
}

export default ManageUsers;