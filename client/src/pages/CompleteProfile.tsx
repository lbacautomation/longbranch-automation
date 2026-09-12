import {
  useEffect,
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

type ProfileData = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  startDate: string;
  emergencyContact: string;
  emergencyPhone: string;
};

type CompleteProfileProps = {
  employeeName: string;

  onProfileCompleted: (
    employee: Employee
  ) => void;

  onLogout: () => void;
};

function CompleteProfile({
  employeeName,
  onProfileCompleted,
  onLogout,
}: CompleteProfileProps) {
  const [profile, setProfile] =
    useState<ProfileData>({
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      startDate: "",
      emergencyContact: "",
      emergencyPhone: "",
    });

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const loadProfile =
      async () => {
        try {
          setLoading(true);
          setError("");

          const response =
            await fetch(
              `${API_URL}/api/auth/profile`,
              {
                credentials:
                  "include",
              }
            );

          const data =
            await response.json();

          if (!response.ok) {
            throw new Error(
              data.message ||
                "Unable to load profile"
            );
          }

          const employee =
            data.employee;

          setProfile({
            name:
              employee.name ||
              "",

            email:
              employee.email ||
              "",

            phone:
              employee.phone ||
              "",

            address:
              employee.address ||
              "",

            city:
              employee.city ||
              "",

            state:
              employee.state ||
              "",

            zipCode:
              employee.zipCode ||
              "",

            startDate:
              employee.startDate
                ? employee.startDate.slice(
                    0,
                    10
                  )
                : "",

            emergencyContact:
              employee.emergencyContact ||
              "",

            emergencyPhone:
              employee.emergencyPhone ||
              "",
          });
        } catch (error) {
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load profile."
          );
        } finally {
          setLoading(false);
        }
      };

    void loadProfile();
  }, []);

  const updateField = (
    field: keyof ProfileData,
    value: string
  ) => {
    setProfile(
      (current) => ({
        ...current,
        [field]: value,
      })
    );
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    if (
      !profile.name.trim()
    ) {
      setError(
        "Your name is required."
      );

      return;
    }

    if (
      !profile.phone.trim()
    ) {
      setError(
        "Your phone number is required."
      );

      return;
    }

    if (
      !profile.address.trim() ||
      !profile.city.trim() ||
      !profile.state.trim() ||
      !profile.zipCode.trim()
    ) {
      setError(
        "Please complete your mailing address."
      );

      return;
    }

    if (
      !profile.emergencyContact.trim() ||
      !profile.emergencyPhone.trim()
    ) {
      setError(
        "Please complete your emergency contact information."
      );

      return;
    }

    try {
      setSaving(true);

      const response =
        await fetch(
          `${API_URL}/api/auth/profile`,
          {
            method: "PUT",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                name:
                  profile.name.trim(),

                phone:
                  profile.phone.trim(),

                address:
                  profile.address.trim(),

                city:
                  profile.city.trim(),

                state:
                  profile.state.trim(),

                zipCode:
                  profile.zipCode.trim(),

                emergencyContact:
                  profile.emergencyContact.trim(),

                emergencyPhone:
                  profile.emergencyPhone.trim(),
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to save profile"
        );
      }

      onProfileCompleted(
        data.employee
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to save profile."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="auth-loading">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="login-page complete-profile-page">
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
            Complete your profile
          </h1>

          <p className="login-description">
            Welcome, {employeeName}.
            Please review your employee
            information before continuing
            to the portal.
          </p>
        </div>
      </section>

      <section className="complete-profile-form-panel">
        <form
          className="complete-profile-card"
          onSubmit={
            handleSubmit
          }
        >
          <div className="complete-profile-heading">
            <p className="eyebrow">
              First Login
            </p>

            <h2>
              Employee Profile
            </h2>

            <p className="subtitle">
              Confirm your contact and
              emergency information.
            </p>
          </div>

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          <div className="complete-profile-section">
            <h3>
              Personal Information
            </h3>

            <div className="complete-profile-grid">
              <label>
                <span>
                  Employee Name
                </span>

                <input
                  type="text"
                  value={
                    profile.name
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "name",
                      event.target
                        .value
                    )
                  }
                  required
                />
              </label>

              <label>
                <span>
                  Email Address
                </span>

                <input
                  type="email"
                  value={
                    profile.email
                  }
                  disabled
                />
              </label>

              <label>
                <span>
                  Phone Number
                </span>

                <input
                  type="tel"
                  value={
                    profile.phone
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "phone",
                      event.target
                        .value
                    )
                  }
                  required
                />
              </label>

              <label>
                <span>
                  Start Date
                </span>

                <input
                  type="date"
                  value={
                    profile.startDate
                  }
                  disabled
                />
              </label>
            </div>
          </div>

          <div className="complete-profile-section">
            <h3>
              Mailing Address
            </h3>

            <div className="complete-profile-grid">
              <label className="full-width">
                <span>
                  Street Address
                </span>

                <input
                  type="text"
                  value={
                    profile.address
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "address",
                      event.target
                        .value
                    )
                  }
                  required
                />
              </label>

              <label>
                <span>
                  City
                </span>

                <input
                  type="text"
                  value={
                    profile.city
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "city",
                      event.target
                        .value
                    )
                  }
                  required
                />
              </label>

              <label>
                <span>
                  State
                </span>

                <input
                  type="text"
                  value={
                    profile.state
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "state",
                      event.target
                        .value
                    )
                  }
                  required
                />
              </label>

              <label>
                <span>
                  ZIP Code
                </span>

                <input
                  type="text"
                  value={
                    profile.zipCode
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "zipCode",
                      event.target
                        .value
                    )
                  }
                  required
                />
              </label>
            </div>
          </div>

          <div className="complete-profile-section">
            <h3>
              Emergency Contact
            </h3>

            <div className="complete-profile-grid">
              <label>
                <span>
                  Contact Name
                </span>

                <input
                  type="text"
                  value={
                    profile.emergencyContact
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "emergencyContact",
                      event.target
                        .value
                    )
                  }
                  required
                />
              </label>

              <label>
                <span>
                  Contact Phone
                </span>

                <input
                  type="tel"
                  value={
                    profile.emergencyPhone
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "emergencyPhone",
                      event.target
                        .value
                    )
                  }
                  required
                />
              </label>
            </div>
          </div>

          <div className="complete-profile-actions">
            <button
              type="submit"
              className="primary-button"
              disabled={saving}
            >
              {saving
                ? "Saving Profile..."
                : "Save & Continue"}
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={onLogout}
              disabled={saving}
            >
              Log Out
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default CompleteProfile;