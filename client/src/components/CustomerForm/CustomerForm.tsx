import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import { API_URL } from "../../services/api";

import type {
  Customer,
} from "../../types";

type CustomerFormProps = {
  customer?: Customer | null;
  onCancel: () => void;
  onSaved: (
    customer: Customer
  ) => void;
};

type CustomerWithAddress =
  Customer & {
    address?: string | null;
    city?: string | null;
    state?: string | null;
    zipCode?: string | null;
  };

function CustomerForm({
  customer,
  onCancel,
  onSaved,
}: CustomerFormProps) {
  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [address, setAddress] =
    useState("");

  const [city, setCity] =
    useState("");

  const [state, setState] =
    useState("");

  const [zipCode, setZipCode] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const isEditing =
    Boolean(customer);

  useEffect(() => {
    if (!customer) {
      setName("");
      setEmail("");
      setPhone("");
      setAddress("");
      setCity("");
      setState("");
      setZipCode("");
      setNotes("");
      return;
    }

    const customerData =
      customer as CustomerWithAddress;

    setName(
      customerData.name || ""
    );

    setEmail(
      customerData.email || ""
    );

    setPhone(
      customerData.phone || ""
    );

    setAddress(
      customerData.address || ""
    );

    setCity(
      customerData.city || ""
    );

    setState(
      customerData.state || ""
    );

    setZipCode(
      customerData.zipCode || ""
    );

    setNotes(
      customerData.notes || ""
    );
  }, [customer]);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    if (!name.trim()) {
      setError(
        "Customer name is required."
      );
      return;
    }

    try {
      setSaving(true);

      const url =
        isEditing
          ? `${API_URL}/api/customers/${customer?.id}`
          : `${API_URL}/api/customers`;

      const response =
        await fetch(
          url,
          {
            credentials: "include",

            method:
              isEditing
                ? "PUT"
                : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              name:
                name.trim(),

              email:
                email.trim() ||
                null,

              phone:
                phone.trim() ||
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

              notes:
                notes.trim() ||
                null,
            }),
          }
        );

      if (!response.ok) {
        const data =
          await response.json();

        throw new Error(
          data.message ||
            (isEditing
              ? "Unable to update customer."
              : "Unable to create customer.")
        );
      }

      const savedCustomer:
        Customer =
          await response.json();

      onSaved(
        savedCustomer
      );
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : isEditing
            ? "Unable to update customer."
            : "Unable to create customer."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <header className="page-header">
        <div>
          <div className="section-heading">
  <p className="eyebrow">
    Customers
  </p>

  <p className="section-description">
    Manage customer accounts and facilities.
  </p>
</div>

          <h2>
            {isEditing
              ? "Edit Customer"
              : "New Customer"}
          </h2>

          <p className="subtitle">
            {isEditing
              ? "Update customer information."
              : "Add a new customer record."}
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={
            onCancel
          }
        >
          Back to Customers
        </button>
      </header>

      <form
        className="invoice-form customer-form"
        onSubmit={
          handleSubmit
        }
      >
        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

        <section className="form-card">
          <div className="form-card-header">
            <div>
              <h3>
                Customer Details
              </h3>

              <p>
                Basic contact
                information for this
                customer.
              </p>
            </div>
          </div>

          <div className="form-grid customer-form-grid">
            <label>
              <span>
                Customer Name
              </span>

              <input
                type="text"
                value={name}
                onChange={(
                  event
                ) =>
                  setName(
                    event.target
                      .value
                  )
                }
                placeholder="Customer or company name"
              />
            </label>

            <label>
              <span>
                Email
              </span>

              <input
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
                placeholder="email@example.com"
              />
            </label>

            <label>
              <span>
                Phone
              </span>

              <input
                type="tel"
                value={phone}
                onChange={(
                  event
                ) =>
                  setPhone(
                    event.target
                      .value
                  )
                }
                placeholder="Phone number"
              />
            </label>

            <label>
              <span>
                Address
              </span>

              <input
                type="text"
                value={address}
                onChange={(
                  event
                ) =>
                  setAddress(
                    event.target
                      .value
                  )
                }
                placeholder="Street address"
              />
            </label>

            <label>
              <span>
                City
              </span>

              <input
                type="text"
                value={city}
                onChange={(
                  event
                ) =>
                  setCity(
                    event.target
                      .value
                  )
                }
                placeholder="City"
              />
            </label>

            <label>
              <span>
                State
              </span>

              <input
                type="text"
                value={state}
                onChange={(
                  event
                ) =>
                  setState(
                    event.target
                      .value
                  )
                }
                placeholder="State"
              />
            </label>

            <label>
              <span>
                ZIP Code
              </span>

              <input
                type="text"
                value={zipCode}
                onChange={(
                  event
                ) =>
                  setZipCode(
                    event.target
                      .value
                  )
                }
                placeholder="ZIP code"
              />
            </label>
          </div>
        </section>

        <section className="form-card">
          <div className="form-card-header">
            <div>
              <h3>
                Notes
              </h3>

              <p>
                Optional information
                about the customer.
              </p>
            </div>
          </div>

          <textarea
            rows={4}
            value={notes}
            onChange={(
              event
            ) =>
              setNotes(
                event.target
                  .value
              )
            }
            placeholder="Add customer notes..."
          />
        </section>

        <div className="customer-form-actions">
          <button
            type="submit"
            className="primary-button"
            disabled={
              saving
            }
          >
            {saving
              ? isEditing
                ? "Saving Changes..."
                : "Creating Customer..."
              : isEditing
                ? "Save Changes"
                : "Create Customer"}
          </button>
        </div>
      </form>
    </>
  );
}

export default CustomerForm;