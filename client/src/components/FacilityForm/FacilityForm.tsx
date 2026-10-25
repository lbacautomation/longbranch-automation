
import { useState, type FormEvent } from "react";
import { API_URL } from "../../services/api";

export type EditableFacility = {
  id: number;
  name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  notes?: string | null;
  version: number;
};

type FacilityFormProps = {
  customerId: number;
  facility?: EditableFacility | null;
  onCancel: () => void;
  onSaved: () => void | Promise<void>;
};

function FacilityForm({
  customerId,
  facility = null,
  onCancel,
  onSaved,
}: FacilityFormProps) {
  const isEditing = facility !== null;

  const [name, setName] = useState(
    facility?.name ?? ""
  );
  const [address, setAddress] = useState(
    facility?.address ?? ""
  );
  const [city, setCity] = useState(
    facility?.city ?? ""
  );
  const [state, setState] = useState(
    facility?.state ?? ""
  );
  const [zipCode, setZipCode] = useState(
    facility?.zipCode ?? ""
  );
  const [notes, setNotes] = useState(
    facility?.notes ?? ""
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (saving) return;

    setError("");
    setConflict(false);

    if (!name.trim()) {
      setError("Facility name is required.");
      return;
    }

    if (
      isEditing &&
      (!Number.isInteger(facility.version) ||
        facility.version < 1)
    ) {
      setError(
        "The facility version is missing. Reload the customer before editing."
      );
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: name.trim(),
        address: address.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        zipCode: zipCode.trim() || null,
        notes: notes.trim() || null,
        customerId,
        ...(facility
          ? { expectedVersion: facility.version }
          : {}),
      };

      const url = facility
        ? `${API_URL}/api/facilities/${facility.id}`
        : `${API_URL}/api/facilities`;

      const response = await fetch(url, {
        method: facility ? "PUT" : "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let message = facility
          ? "Unable to update facility."
          : "Unable to create facility.";

        try {
          const data = await response.json();

          if (typeof data.message === "string") {
            message = data.message;
          }
        } catch {
          // The server may return a non-JSON error.
        }

        if (response.status === 409) {
          setConflict(true);
        }

        throw new Error(message);
      }

      await onSaved();
    } catch (caughtError) {
      console.error(caughtError);

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to save facility."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">
            Longbranch Automation &amp; Controls
          </p>

          <h2>
            {isEditing ? "Edit Facility" : "New Facility"}
          </h2>

          <p className="subtitle">
            {isEditing
              ? "Update this customer location or site."
              : "Add a customer location or site."}
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={onCancel}
          disabled={saving}
        >
          Back to Customer
        </button>
      </header>

      <form
        className="invoice-form"
        onSubmit={handleSubmit}
      >
        {error && (
          <div
            className="form-error"
            role="alert"
          >
            <p>{error}</p>

            {conflict && (
              <p>
                Your changes were not saved. Return
                to the customer, reload the latest
                facility information, and try again.
              </p>
            )}
          </div>
        )}

        <section className="form-card">
          <div className="form-card-header">
            <div>
              <h3>Facility Details</h3>
              <p>Location and site information.</p>
            </div>
          </div>

          <div className="form-grid">
            <label>
              <span>Facility Name *</span>
              <input
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Main Plant"
                required
                disabled={saving}
              />
            </label>

            <label>
              <span>Address</span>
              <input
                type="text"
                value={address}
                onChange={(event) =>
                  setAddress(event.target.value)
                }
                placeholder="123 Industrial Way"
                disabled={saving}
              />
            </label>

            <label>
              <span>City</span>
              <input
                type="text"
                value={city}
                onChange={(event) =>
                  setCity(event.target.value)
                }
                placeholder="Columbus"
                disabled={saving}
              />
            </label>

            <label>
              <span>State</span>
              <input
                type="text"
                value={state}
                onChange={(event) =>
                  setState(event.target.value)
                }
                placeholder="GA"
                disabled={saving}
              />
            </label>

            <label>
              <span>ZIP Code</span>
              <input
                type="text"
                value={zipCode}
                onChange={(event) =>
                  setZipCode(event.target.value)
                }
                placeholder="31901"
                disabled={saving}
              />
            </label>
          </div>
        </section>

        <section className="form-card">
          <div className="form-card-header">
            <div>
              <h3>Notes</h3>
              <p>
                Optional information about this
                facility.
              </p>
            </div>
          </div>

          <textarea
            rows={6}
            value={notes}
            onChange={(event) =>
              setNotes(event.target.value)
            }
            placeholder="Add facility notes..."
            disabled={saving}
          />
        </section>

        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <button
            type="submit"
            className="primary-button"
            disabled={saving || conflict}
          >
            {saving
              ? "Saving Facility..."
              : isEditing
                ? "Save Changes"
                : "Create Facility"}
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </button>
        </div>
      </form>
    </>
  );
}

export default FacilityForm;
