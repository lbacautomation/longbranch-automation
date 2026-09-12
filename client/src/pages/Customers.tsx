import {
  useEffect,
  useState,
} from "react";

import CustomerForm from "../components/CustomerForm/CustomerForm";
import CustomerTable from "../components/CustomerTable/CustomerTable";
import FacilityForm from "../components/FacilityForm/FacilityForm";
import { API_URL } from "../services/api";

import type {
  Customer,
} from "../types";

type Estimate = {
  id: number;
  estimateNumber: string;
  issueDate: string;
  validUntil?: string | null;
  total: number;
  customer: Customer;
};

type CustomersProps = {
  onNavigate: (
    page: string
  ) => void;

  onOpenJob: (
    jobId: number
  ) => void;
};

function Customers({
  onNavigate,
  onOpenJob,
}: CustomersProps) {

  const [customers, setCustomers] =
    useState<Customer[]>([]);

  const [
    estimates,
    setEstimates,
  ] = useState<Estimate[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    showNewCustomer,
    setShowNewCustomer,
  ] = useState(false);

  const [
    selectedCustomer,
    setSelectedCustomer,
  ] = useState<Customer | null>(
    null
  );

  const [
    editingCustomer,
    setEditingCustomer,
  ] = useState<Customer | null>(
    null
  );

  const [
    showFacilityForm,
    setShowFacilityForm,
  ] = useState(false);

  const loadCustomers =
    async () => {
      try {
        setLoading(true);
        setError("");

        const [
          customerResponse,
          estimateResponse,
        ] = await Promise.all([
          fetch(
            `${API_URL}/api/customers`, {
  credentials: "include",
}
          ),
          fetch(
            `${API_URL}/api/estimates`, {
  credentials: "include",
}
          ),
        ]);

        if (
          !customerResponse.ok ||
          !estimateResponse.ok
        ) {
          throw new Error(
            "Unable to load customer data"
          );
        }

        const customerData:
          Customer[] =
            await customerResponse.json();

        const estimateData:
          Estimate[] =
            await estimateResponse.json();

        setCustomers(
          customerData
        );

        setEstimates(
          estimateData
        );
      } catch (error) {
        console.error(error);

        setError(
          "Unable to load customers."
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleCustomerSaved =
    async (
      savedCustomer: Customer
    ) => {
      await loadCustomers();

      setShowNewCustomer(
        false
      );

      setEditingCustomer(
        null
      );

      setSelectedCustomer(
        savedCustomer
      );
    };

    const handleDeleteCustomer = async () => {
  if (!selectedCustomer) {
    return;
  }

  const confirmed = window.confirm(
    `Are you sure you want to delete ${selectedCustomer.name}?\n\nThis action cannot be undone.`
  );

  if (!confirmed) {
    return;
  }

  try {
    setError("");

    const response = await fetch(
      `${API_URL}/api/customers/${selectedCustomer.id}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    if (!response.ok) {
      let message =
        "Unable to delete customer.";

      try {
        const data =
          await response.json();

        if (data.message) {
          message =
            data.message;
        }
      } catch {
        // Ignore non-JSON response
      }

      throw new Error(message);
    }

    setSelectedCustomer(null);
    setEditingCustomer(null);

    await loadCustomers();
  } catch (error) {
    console.error(error);

    setError(
      error instanceof Error
        ? error.message
        : "Unable to delete customer."
    );
  }
};

  const handleFacilitySaved =
    async () => {
      if (!selectedCustomer) {
        return;
      }

      try {
        const response =
          await fetch(
            `${API_URL}/api/customers/${selectedCustomer.id}`,
            {
              credentials: "include",
            }
          );

        if (!response.ok) {
          throw new Error(
            "Unable to reload customer"
          );
        }

        const updatedCustomer:
          Customer =
            await response.json();

        setSelectedCustomer(
          updatedCustomer
        );

        await loadCustomers();

        setShowFacilityForm(
          false
        );
      } catch (error) {
        console.error(error);
      }
    };

    const handleDeleteFacility = async (
  facilityId: number,
  facilityName: string
) => {
  const confirmed = window.confirm(
    `Are you sure you want to delete ${facilityName}?\n\nThis action cannot be undone.`
  );

  if (!confirmed) {
    return;
  }

  try {
    setError("");

    const response = await fetch(
      `${API_URL}/api/facilities/${facilityId}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    if (!response.ok) {
      let message =
        "Unable to delete facility.";

      try {
        const data =
          await response.json();

        if (data.message) {
          message =
            data.message;
        }
      } catch {
        // Ignore non-JSON response
      }

      throw new Error(message);
    }

    if (selectedCustomer) {
      const customerResponse =
        await fetch(
          `${API_URL}/api/customers/${selectedCustomer.id}`,
          {
            credentials: "include",
          }
        );

      if (customerResponse.ok) {
        const updatedCustomer:
          Customer =
            await customerResponse.json();

        setSelectedCustomer(
          updatedCustomer
        );
      }
    }

    await loadCustomers();
  } catch (error) {
    console.error(error);

    setError(
      error instanceof Error
        ? error.message
        : "Unable to delete facility."
    );
  }
};

  if (
    showFacilityForm &&
    selectedCustomer
  ) {
    return (
      <FacilityForm
        customerId={
          selectedCustomer.id
        }
        onCancel={() =>
          setShowFacilityForm(
            false
          )
        }
        onSaved={
          handleFacilitySaved
        }
      />
    );
  }

  if (
    showNewCustomer ||
    editingCustomer
  ) {
    return (
      <CustomerForm
        customer={
          editingCustomer
        }
        onCancel={() => {
          setShowNewCustomer(
            false
          );

          setEditingCustomer(
            null
          );
        }}
        onSaved={
          handleCustomerSaved
        }
      />
    );
  }

  if (selectedCustomer) {
    const facilities =
      selectedCustomer.facilities ||
      [];

    const jobs =
      facilities.flatMap(
        (facility) =>
          facility.jobs || []
      );

    const customerEstimates =
      estimates.filter(
        (estimate) =>
          estimate.customer.id ===
          selectedCustomer.id
      );

    return (
      <>
        <header className="page-header">
          <div>
            <p className="eyebrow">
              Longbranch Automation
              & Controls
            </p>

            <h2>
              {
                selectedCustomer.name
              }
            </h2>

            <p className="subtitle">
              Customer details
            </p>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              setSelectedCustomer(
                null
              )
            }
          >
            Back to Customers
          </button>
        </header> 

        {error && (
  <div className="form-error">
    {error}
  </div>
)}
<div className="customer-detail-grid">

        <section className="form-card">
          <div className="form-card-header">
            <div>
              <h3>
                Contact Information
              </h3>

              <p>
                Customer account
                details.
              </p>
            </div>

        <button
  type="button"
  className="secondary-button"
  onClick={() =>
    setEditingCustomer(
      selectedCustomer
    )
  }
>
  Edit Customer
</button>

<button
  type="button"
  className="danger-button"
  onClick={handleDeleteCustomer}
>
  Delete Customer
</button>

</div>

          <div className="form-grid">
            <div>
              <span className="invoice-label">
                Name
              </span>

              <p>
                {
                  selectedCustomer.name
                }
              </p>
            </div>

            <div>
              <span className="invoice-label">
                Email
              </span>

              <p>
                {selectedCustomer.email ||
                  "—"}
              </p>
            </div>

            <div>
              <span className="invoice-label">
                Phone
              </span>

              <p>
                {selectedCustomer.phone ||
                  "—"}
              </p>
            </div>
            <div>
  <span className="invoice-label">
    Address
  </span>
  <p>{selectedCustomer.address || "—"}</p>
</div>

<div>
  <span className="invoice-label">
    City
  </span>
  <p>{selectedCustomer.city || "—"}</p>
</div>

<div>
  <span className="invoice-label">
    State
  </span>
  <p>{selectedCustomer.state || "—"}</p>
</div>

<div>
  <span className="invoice-label">
    ZIP Code
  </span>
  <p>{selectedCustomer.zipCode || "—"}</p>
</div>
          </div>
        </section>

        <section className="form-card">
          <div className="form-card-header">
            <div>
              <h3>
                Notes
              </h3>

              <p>
                Customer notes and
                account information.
              </p>
            </div>
          </div>
          

          <p>
            {selectedCustomer.notes ||
              "No notes"}
          </p>
          
        </section>

        <section className="invoice-section">
          <div className="section-heading">
            <div>
              <h3>
                Facilities
              </h3>

              <p>
                Customer locations
                and sites
              </p>
            </div>

            <button
              type="button"
              className="primary-button"
              onClick={() =>
                setShowFacilityForm(
                  true
                )
              }
            >
              + Add Facility
            </button>
          </div>

          {facilities.length ===
          0 ? (
            <p>
              No facilities yet.
            </p>
          ) : (
            <div className="invoice-table">
              <div className="table-row table-header">
                <span>
                  Name
                </span>

                <span>
                  City
                </span>

                <span>
                  State
                </span>

                <span>
                  Jobs
                </span>

                 <span>
                  Actions
                  </span>
              </div>

              {facilities.map(
                (facility) => (
                  <div
                    className="table-row"
                    key={
                      facility.id
                    }
                  >
                    <strong>
                      {
                        facility.name
                      }
                    </strong>

                    <span>
                      {facility.city ||
                        "—"}
                    </span>

                    <span>
                      {facility.state ||
                        "—"}
                    </span>

                   <span>
  {
    (
      facility.jobs ||
      []
    ).length
  }
</span>

<span>
  <button
    type="button"
    className="danger-button"
    onClick={() =>
      handleDeleteFacility(
        facility.id,
        facility.name
      )
    }
  >
    Delete
  </button>
</span>
</div>
                )
              )}
            </div>
          )}
        </section>

        <section className="invoice-section">
          <div className="section-heading">
            <div>
              <h3>
                Jobs
              </h3>

              <p>
                Jobs associated with
                this customer
              </p>
            </div>

            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                onNavigate(
                  "jobs"
                )
              }
            >
              View All Jobs
            </button>
          </div>

          {jobs.length === 0 ? (
            <p>
              No jobs yet.
            </p>
          ) : (
            <div className="invoice-table">
              <div className="table-row table-header">
                <span>
                  Job Number
                </span>

                <span>
                  Name
                </span>

                <span>
                  Status
                </span>
              </div>

              {jobs.map(
                (job) => (
                  <div
  className="table-row invoice-row"
  key={job.id}
  onClick={() =>
    onOpenJob(job.id)
  }
>
                    <strong>
                      {
                        job.jobNumber
                      }
                    </strong>

                    <span>
                      {job.name}
                    </span>

                    <span>
                      {job.status ||
                        "—"}
                    </span>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        <section className="invoice-section">
          <div className="section-heading">
            <div>
              <h3>
                Estimates
              </h3>

              <p>
                Estimate activity for
                this customer
              </p>
            </div>

            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                onNavigate(
                  "estimates"
                )
              }
            >
              View All Estimates
            </button>
          </div>

          {customerEstimates.length ===
          0 ? (
            <p>
              No estimates yet.
            </p>
          ) : (
            <div className="invoice-table">
              <div className="table-row table-header">
                <span>
                  Estimate
                </span>

                <span>
                  Issue Date
                </span>

                <span>
                  Valid Until
                </span>

                <span className="amount">
                  Total
                </span>
              </div>

              {customerEstimates.map(
                (estimate) => (
                  <div
                    className="table-row"
                    key={
                      estimate.id
                    }
                  >
                    <strong>
                      {
                        estimate.estimateNumber
                      }
                    </strong>

                    <span>
                      {new Date(
                        estimate.issueDate
                      ).toLocaleDateString(
                        "en-US",
                        {
                          month:
                            "short",
                          day:
                            "numeric",
                          year:
                            "numeric",
                          timeZone:
                            "UTC",
                        }
                      )}
                    </span>

                    <span>
                      {estimate.validUntil
                        ? new Date(
                            estimate.validUntil
                          ).toLocaleDateString(
                            "en-US",
                            {
                              month:
                                "short",
                              day:
                                "numeric",
                              year:
                                "numeric",
                              timeZone:
                                "UTC",
                            }
                          )
                        : "—"}
                    </span>

                    <strong className="amount">
                      {new Intl.NumberFormat(
                        "en-US",
                        {
                          style:
                            "currency",
                          currency:
                            "USD",
                        }
                      ).format(
                        Number(
                          estimate.total
                        )
                      )}
                    </strong>
                  </div>
                )
              )}
            </div>
          )}
        </section>
        </div>
      </>
    );
  }

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">
            Longbranch Automation
            & Controls
          </p>

          <h2>
            Customers
          </h2>

          <p className="subtitle">
            Manage customer
            records, facilities,
            and jobs.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() =>
            setShowNewCustomer(
              true
            )
          }
        >
          + New Customer
        </button>
      </header>

      {error && (
        <div className="form-error">
          {error}
        </div>
      )}

      <CustomerTable
        customers={customers}
        loading={loading}
        onSelectCustomer={
          setSelectedCustomer
        }
      />
    </>
  );
}

export default Customers;