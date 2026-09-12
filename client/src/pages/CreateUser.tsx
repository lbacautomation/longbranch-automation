import { useState } from "react";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

type CreateUserProps = {
  onDone: () => void;
};

function CreateUser({
  onDone,
}: CreateUserProps) {
  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [startDate, setStartDate] =
    useState("");

  const [address, setAddress] =
    useState("");

  const [city, setCity] =
    useState("");

  const [state, setState] =
    useState("");

  const [zipCode, setZipCode] =
    useState("");

  const [
    emergencyContact,
    setEmergencyContact,
  ] = useState("");

  const [
    emergencyPhone,
    setEmergencyPhone,
  ] = useState("");

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError(
        "Employee name is required."
      );
      return;
    }

    if (!email.trim()) {
      setError(
        "Email address is required."
      );
      return;
    }

    if (
      password !== confirmPassword
    ) {
      setError(
        "Passwords do not match."
      );
      return;
    }

    if (password.length < 12) {
      setError(
        "Password must be at least 12 characters."
      );
      return;
    }

    try {
      setLoading(true);

      const response =
        await fetch(
          `${API_URL}/api/employees`,
          {
            method: "POST",
            credentials: "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              name:
                name.trim(),

              email:
                email.trim(),

              password,

              phone:
                phone.trim() ||
                null,

              startDate:
                startDate ||
                null,

              address:
                address.trim() ||
                null,

              city:
                city.trim() ||
                null,

              state:
                state.trim() ||
                null,

              zipCode:
                zipCode.trim() ||
                null,

              emergencyContact:
                emergencyContact.trim() ||
                null,

              emergencyPhone:
                emergencyPhone.trim() ||
                null,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to create user"
        );
      }

      setSuccess(
        `${data.employee.name} has been created successfully.`
      );

      setName("");
      setEmail("");
      setPhone("");
      setStartDate("");
      setAddress("");
      setCity("");
      setState("");
      setZipCode("");
      setEmergencyContact("");
      setEmergencyPhone("");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to create user"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="create-user-page">
      <div className="create-user-header">
        <div>
          <p className="page-eyebrow">
            Administration
          </p>

          <h1>Create User</h1>

          <p>
            Create an employee account
            and login credentials.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={onDone}
        >
          Back to Dashboard
        </button>
      </div>

      <div className="create-user-card">
        <form
          className="create-user-form"
          onSubmit={handleSubmit}
        >
          <div className="create-user-section">
            <div className="create-user-section-header">
              <h2>
                Employee Information
              </h2>

              <p>
                Basic employee and
                contact information.
              </p>
            </div>

            <div className="create-user-grid">
              <div className="create-user-field">
                <label htmlFor="user-name">
                  Employee Name
                </label>

                <input
                  id="user-name"
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target
                        .value
                    )
                  }
                  placeholder="Employee name"
                  required
                />
              </div>

              <div className="create-user-field">
                <label htmlFor="user-email">
                  Email Address
                </label>

                <input
                  id="user-email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target
                        .value
                    )
                  }
                  placeholder="name@company.com"
                  autoComplete="off"
                  required
                />
              </div>

              <div className="create-user-field">
                <label htmlFor="user-phone">
                  Phone Number
                </label>

                <input
                  id="user-phone"
                  type="tel"
                  value={phone}
                  onChange={(event) =>
                    setPhone(
                      event.target
                        .value
                    )
                  }
                  placeholder="Phone number"
                />
              </div>

              <div className="create-user-field">
                <label htmlFor="start-date">
                  Start Date
                </label>

                <input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(event) =>
                    setStartDate(
                      event.target
                        .value
                    )
                  }
                />
              </div>
            </div>
          </div>

          <div className="create-user-section">
            <div className="create-user-section-header">
              <h2>
                Address
              </h2>

              <p>
                Employee mailing
                address.
              </p>
            </div>

            <div className="create-user-grid">
              <div className="create-user-field full-width">
                <label htmlFor="user-address">
                  Street Address
                </label>

                <input
                  id="user-address"
                  type="text"
                  value={address}
                  onChange={(event) =>
                    setAddress(
                      event.target
                        .value
                    )
                  }
                  placeholder="Street address"
                />
              </div>

              <div className="create-user-field">
                <label htmlFor="user-city">
                  City
                </label>

                <input
                  id="user-city"
                  type="text"
                  value={city}
                  onChange={(event) =>
                    setCity(
                      event.target
                        .value
                    )
                  }
                  placeholder="City"
                />
              </div>

              <div className="create-user-field">
                <label htmlFor="user-state">
                  State
                </label>

                <input
                  id="user-state"
                  type="text"
                  value={state}
                  onChange={(event) =>
                    setState(
                      event.target
                        .value
                    )
                  }
                  placeholder="State"
                />
              </div>

              <div className="create-user-field">
                <label htmlFor="user-zip">
                  ZIP Code
                </label>

                <input
                  id="user-zip"
                  type="text"
                  value={zipCode}
                  onChange={(event) =>
                    setZipCode(
                      event.target
                        .value
                    )
                  }
                  placeholder="ZIP code"
                />
              </div>
            </div>
          </div>

          <div className="create-user-section">
            <div className="create-user-section-header">
              <h2>
                Emergency Contact
              </h2>

              <p>
                Emergency contact
                information for this
                employee.
              </p>
            </div>

            <div className="create-user-grid">
              <div className="create-user-field">
                <label htmlFor="emergency-contact">
                  Contact Name
                </label>

                <input
                  id="emergency-contact"
                  type="text"
                  value={
                    emergencyContact
                  }
                  onChange={(event) =>
                    setEmergencyContact(
                      event.target
                        .value
                    )
                  }
                  placeholder="Emergency contact name"
                />
              </div>

              <div className="create-user-field">
                <label htmlFor="emergency-phone">
                  Contact Phone
                </label>

                <input
                  id="emergency-phone"
                  type="tel"
                  value={
                    emergencyPhone
                  }
                  onChange={(event) =>
                    setEmergencyPhone(
                      event.target
                        .value
                    )
                  }
                  placeholder="Emergency contact phone"
                />
              </div>
            </div>
          </div>

          <div className="create-user-section">
            <div className="create-user-section-header">
              <h2>
                Login Credentials
              </h2>

              <p>
                The employee will be
                required to change this
                password after logging
                in.
              </p>
            </div>

            <div className="create-user-grid">
              <div className="create-user-field">
                <label htmlFor="user-password">
                  Temporary Password
                </label>

                <input
                  id="user-password"
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target
                        .value
                    )
                  }
                  placeholder="Minimum 12 characters"
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className="create-user-field">
                <label htmlFor="confirm-password">
                  Confirm Password
                </label>

                <input
                  id="confirm-password"
                  type="password"
                  value={
                    confirmPassword
                  }
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target
                        .value
                    )
                  }
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          {success && (
            <div className="create-user-success">
              {success}
            </div>
          )}

          <div className="create-user-actions">
            <button
              type="submit"
              className="create-user-submit"
              disabled={loading}
            >
              {loading
                ? "Creating User..."
                : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default CreateUser;