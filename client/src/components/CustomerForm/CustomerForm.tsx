import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { API_URL } from "../../services/api";
import type { Customer } from "../../types";

type CustomerFormProps = {
  customer?: Customer | null;
  onCancel: () => void;
  onSaved: (customer: Customer) => void;
};

type CustomerRecord = Customer & {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  version?: number;
};

type FormFields = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  notes: string;
};

type SaveStatus = "saved" | "unsaved" | "saving" | "error" | "conflict";

const emptyFields: FormFields = {
  name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  notes: "",
};

function fieldsFromCustomer(customer?: Customer | null): FormFields {
  if (!customer) return { ...emptyFields };
  const record = customer as CustomerRecord;
  return {
    name: record.name ?? "",
    email: record.email ?? "",
    phone: record.phone ?? "",
    address: record.address ?? "",
    city: record.city ?? "",
    state: record.state ?? "",
    zipCode: record.zipCode ?? "",
    notes: record.notes ?? "",
  };
}

function snapshot(fields: FormFields): string {
  return JSON.stringify(fields);
}

function CustomerForm({ customer, onCancel, onSaved }: CustomerFormProps) {
  const isEditing = Boolean(customer);
  const [fields, setFields] = useState<FormFields>(() => fieldsFromCustomer(customer));
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [error, setError] = useState("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const fieldsRef = useRef(fields);
  fieldsRef.current = fields;
  const versionRef = useRef<number | undefined>((customer as CustomerRecord | null | undefined)?.version);
  const savedSnapshotRef = useRef(snapshot(fields));
  const savingRef = useRef(false);
  const conflictRef = useRef(false);
  const mountedRef = useRef(true);
  const customerIdRef = useRef(customer?.id);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Only reset when switching to a different customer, not after an autosave.
  useEffect(() => {
    const initial = fieldsFromCustomer(customer);
    fieldsRef.current = initial;
    setFields(initial);
    savedSnapshotRef.current = snapshot(initial);
    versionRef.current = (customer as CustomerRecord | null | undefined)?.version;
    customerIdRef.current = customer?.id;
    conflictRef.current = false;
    savingRef.current = false;
    setStatus("saved");
    setError("");
    setLastSaved(null);
    // The parent should not replace the customer while editing the same ID.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer?.id]);

  const dirty = snapshot(fields) !== savedSnapshotRef.current;

  const updateField = (field: keyof FormFields, value: string) => {
    setFields((previous) => ({ ...previous, [field]: value }));
    if (!conflictRef.current) {
      setStatus("unsaved");
      setError("");
    }
  };

  const save = async (manual: boolean) => {
    if (savingRef.current || conflictRef.current) return;

    const currentFields = fieldsRef.current;
    const currentSnapshot = snapshot(currentFields);
    const hasChanges = currentSnapshot !== savedSnapshotRef.current;

    if (isEditing && !hasChanges) {
      if (manual && customer) onSaved(customer);
      return;
    }

    if (!currentFields.name.trim()) {
      setStatus("error");
      setError("Customer name is required.");
      return;
    }

    if (isEditing && (!Number.isInteger(versionRef.current) || (versionRef.current ?? 0) < 1)) {
      setStatus("error");
      setError("Customer version is missing. Please reload this customer before saving.");
      return;
    }

    savingRef.current = true;
    setStatus("saving");
    setError("");

    try {
      const response = await fetch(
        isEditing ? `${API_URL}/api/customers/${customer!.id}` : `${API_URL}/api/customers`,
        {
          credentials: "include",
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...Object.fromEntries(
              Object.entries(currentFields).map(([key, value]) => [key, value.trim() || null])
            ),
            name: currentFields.name.trim(),
            ...(isEditing ? { expectedVersion: versionRef.current } : {}),
          }),
        }
      );

      if (response.status === 409) {
        conflictRef.current = true;
        setStatus("conflict");
        setError("Another employee changed this customer. Your changes have NOT been overwritten. Copy any unsaved information, then reload the customer before trying again.");
        return;
      }

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.message || "Unable to save customer.");
      }

      const savedCustomer = (await response.json()) as CustomerRecord;
      if (!mountedRef.current) return;

      versionRef.current = savedCustomer.version;
      savedSnapshotRef.current = currentSnapshot;
      setLastSaved(new Date());

      // If a user typed during the request, their newer changes stay unsaved.
      const changedDuringSave = snapshot(fieldsRef.current) !== currentSnapshot;
      setStatus(changedDuringSave ? "unsaved" : "saved");
      if (manual) {
        if (changedDuringSave) {
          setError("Some fields changed while saving. Please save again before leaving.");
        } else {
          onSaved(savedCustomer);
        }
      }
    } catch (caught) {
      if (!mountedRef.current) return;
      setStatus("error");
      setError(caught instanceof Error ? caught.message : "Unable to save customer.");
    } finally {
      savingRef.current = false;
    }
  };

  // Autosave only edits to existing customers, every 60 seconds.
  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => {
    if (!isEditing) return;
    const interval = window.setInterval(() => {
      if (!savingRef.current && !conflictRef.current &&
          snapshot(fieldsRef.current) !== savedSnapshotRef.current) {
        void saveRef.current(false);
      }
    }, 60_000);
    return () => window.clearInterval(interval);
  }, [isEditing, customer?.id]);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (snapshot(fieldsRef.current) !== savedSnapshotRef.current || savingRef.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, []);

  const handleCancel = () => {
    if (savingRef.current) {
      window.alert("A save is still in progress. Please wait before leaving.");
      return;
    }
    if (dirty && !window.confirm("You have unsaved customer changes. Leave without saving them?")) return;
    onCancel();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void save(true);
  };

  const saving = status === "saving";
  const statusText = conflictRef.current
    ? "Save blocked — another employee updated this record"
    : saving
      ? "Saving..."
      : dirty
        ? "Unsaved changes — autosaves every 60 seconds"
        : lastSaved
          ? `All changes saved at ${lastSaved.toLocaleTimeString()}`
          : isEditing
            ? "No unsaved changes"
            : "New customers are saved when you click Create Customer";

  return (
    <>
      <header className="page-header">
        <div>
          <div className="section-heading">
            <p className="eyebrow">Customers</p>
            <p className="section-description">Manage customer accounts and facilities.</p>
          </div>
          <h2>{isEditing ? "Edit Customer" : "New Customer"}</h2>
          <p className="subtitle">
            {isEditing ? "Update customer information." : "Add a new customer record."}
          </p>
        </div>
        <button type="button" className="secondary-button" onClick={handleCancel}>
          Back to Customers
        </button>
      </header>

      <form className="invoice-form customer-form" onSubmit={handleSubmit}>
        <p role="status" aria-live="polite">{statusText}</p>
        {error && <div className="form-error" role="alert">{error}</div>}

        <section className="form-card">
          <div className="form-card-header">
            <div>
              <h3>Customer Details</h3>
              <p>Basic contact information for this customer.</p>
            </div>
          </div>
          <div className="form-grid customer-form-grid">
            <label>
              <span>Customer Name</span>
              <input type="text" value={fields.name} onChange={(e) => updateField("name", e.target.value)} placeholder="Customer or company name" required />
            </label>
            <label>
              <span>Email</span>
              <input type="email" value={fields.email} onChange={(e) => updateField("email", e.target.value)} placeholder="email@example.com" />
            </label>
            <label>
              <span>Phone</span>
              <input type="tel" value={fields.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="Phone number" />
            </label>
            <label>
              <span>Address</span>
              <input type="text" value={fields.address} onChange={(e) => updateField("address", e.target.value)} placeholder="Street address" />
            </label>
            <label>
              <span>City</span>
              <input type="text" value={fields.city} onChange={(e) => updateField("city", e.target.value)} placeholder="City" />
            </label>
            <label>
              <span>State</span>
              <input type="text" value={fields.state} onChange={(e) => updateField("state", e.target.value)} placeholder="State" />
            </label>
            <label>
              <span>ZIP Code</span>
              <input type="text" value={fields.zipCode} onChange={(e) => updateField("zipCode", e.target.value)} placeholder="ZIP code" />
            </label>
          </div>
        </section>

        <section className="form-card">
          <div className="form-card-header">
            <div>
              <h3>Notes</h3>
              <p>Optional information about the customer.</p>
            </div>
          </div>
          <textarea rows={4} value={fields.notes} onChange={(e) => updateField("notes", e.target.value)} placeholder="Add customer notes..." />
        </section>

        <div className="customer-form-actions">
          <button type="submit" className="primary-button" disabled={saving || status === "conflict"}>
            {saving ? "Saving Changes..." : isEditing ? "Save Changes" : "Create Customer"}
          </button>
        </div>
      </form>
    </>
  );
}

export default CustomerForm;
