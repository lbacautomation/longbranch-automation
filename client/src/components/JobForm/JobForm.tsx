import {
  useMemo,
  useState,
  type FormEvent,
} from "react";

import { API_URL } from "../../services/api";

import type {
  Customer,
  Job,
} from "../../types";

type JobFormProps = {
  customers: Customer[];
  job?: Job | null;
  onCancel: () => void;
  onSaved: (
    job?: Job
  ) => void;
};

function JobForm({
  customers,
  job,
  onCancel,
  onSaved,
}: JobFormProps) {
  const isEditing =
    Boolean(job);

  const [name, setName] =
    useState(
      job?.name || ""
    );

  const [
    description,
    setDescription,
  ] =
    useState(
      job?.description || ""
    );

  const [status, setStatus] =
    useState(
      job?.status || "OPEN"
    );

  const [
    customerId,
    setCustomerId,
  ] =
    useState(
      job?.facility
        ?.customer
        ?.id
        ? String(
            job.facility
              .customer.id
          )
        : ""
    );

  const [
    facilityId,
    setFacilityId,
  ] =
    useState(
      job?.facility?.id
        ? String(
            job.facility.id
          )
        : ""
    );

  const [
    startDate,
    setStartDate,
  ] =
    useState(
      job?.startDate
        ? job.startDate.slice(
            0,
            10
          )
        : ""
    );

  const [
    endDate,
    setEndDate,
  ] =
    useState(
      job?.endDate
        ? job.endDate.slice(
            0,
            10
          )
        : ""
    );

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const selectedCustomer =
    customers.find(
      (customer) =>
        customer.id ===
        Number(customerId)
    );

  const facilities =
    useMemo(
      () =>
        selectedCustomer
          ?.facilities || [],
      [selectedCustomer]
    );

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    if (!name.trim()) {
      setError(
        "Job name is required."
      );

      return;
    }

    if (!facilityId) {
      setError(
        "Please select a facility."
      );

      return;
    }

    try {
      setSaving(true);

      const url =
        isEditing
          ? `${API_URL}/api/jobs/${job?.id}`
          : `${API_URL}/api/facilities/${facilityId}/jobs`;

      const body =
        isEditing
          ? {
              jobNumber:
                job?.jobNumber,

              name:
                name.trim(),

              description:
                description.trim() ||
                null,

              status,

              startDate:
                startDate ||
                null,

              endDate:
                endDate ||
                null,

              facilityId:
                Number(
                  facilityId
                ),
            }
          : {
              name:
                name.trim(),

              description:
                description.trim() ||
                null,

              status,

              startDate:
                startDate ||
                null,

              endDate:
                endDate ||
                null,
            };

      const response =
        await fetch(
          url,
          {
            credentials:
              "include",

            method:
              isEditing
                ? "PUT"
                : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                body
              ),
          }
        );

      if (!response.ok) {
        let message =
          isEditing
            ? "Unable to update job."
            : "Unable to create job.";

        try {
          const data =
            await response.json();

          if (
            data.message
          ) {
            message =
              data.message;
          }
        } catch {
          // Ignore non-JSON errors
        }

        throw new Error(
          message
        );
      }

      const savedJob:
        Job =
          await response.json();

      onSaved(
        savedJob
      );
    } catch (error) {
      console.error(
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : isEditing
            ? "Unable to update job."
            : "Unable to create job."
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
            Longbranch Automation
            & Controls
          </p>

          <h2>
            {isEditing
              ? "Edit Job"
              : "New Job"}
          </h2>

          <p className="subtitle">
            {isEditing
              ? "Update job information."
              : "Create a job for a customer facility."}
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={
            onCancel
          }
        >
          Back to Jobs
        </button>
      </header>

      <form
        className="invoice-form"
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
                Job Details
              </h3>

              <p>
                Basic project and
                facility information.
              </p>
            </div>
          </div>

          <div className="form-grid">
            <label>
              <span>
                Job Name
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
                placeholder="PLC Controls Upgrade"
              />
            </label>

            <label>
              <span>
                Customer
              </span>

              <select
                value={
                  customerId
                }
                onChange={(
                  event
                ) => {
                  setCustomerId(
                    event.target
                      .value
                  );

                  setFacilityId(
                    ""
                  );
                }}
              >
                <option value="">
                  Select customer
                </option>

                {customers.map(
                  (
                    customer
                  ) => (
                    <option
                      key={
                        customer.id
                      }
                      value={
                        customer.id
                      }
                    >
                      {
                        customer.name
                      }
                    </option>
                  )
                )}
              </select>
            </label>

            <label>
              <span>
                Facility
              </span>

              <select
                value={
                  facilityId
                }
                onChange={(
                  event
                ) =>
                  setFacilityId(
                    event.target
                      .value
                  )
                }
                disabled={
                  !customerId
                }
              >
                <option value="">
                  Select facility
                </option>

                {facilities.map(
                  (
                    facility
                  ) => (
                    <option
                      key={
                        facility.id
                      }
                      value={
                        facility.id
                      }
                    >
                      {
                        facility.name
                      }
                    </option>
                  )
                )}
              </select>
            </label>

            <label>
              <span>
                Status
              </span>

              <select
                value={status}
                onChange={(
                  event
                ) =>
                  setStatus(
                    event.target
                      .value
                  )
                }
              >
                <option value="OPEN">
                  Open
                </option>

                <option value="IN_PROGRESS">
                  In Progress
                </option>

                <option value="COMPLETED">
                  Completed
                </option>

                <option value="ON_HOLD">
                  On Hold
                </option>
              </select>
            </label>

            <label>
              <span>
                Start Date
              </span>

              <input
                type="date"
                value={
                  startDate
                }
                onChange={(
                  event
                ) =>
                  setStartDate(
                    event.target
                      .value
                  )
                }
              />
            </label>

            <label>
              <span>
                End Date
              </span>

              <input
                type="date"
                value={
                  endDate
                }
                onChange={(
                  event
                ) =>
                  setEndDate(
                    event.target
                      .value
                  )
                }
              />
            </label>
          </div>
        </section>

        <section className="form-card">
          <div className="form-card-header">
            <div>
              <h3>
                Description
              </h3>

              <p>
                Optional details
                about the work.
              </p>
            </div>
          </div>

          <textarea
            rows={6}
            value={
              description
            }
            onChange={(
              event
            ) =>
              setDescription(
                event.target
                  .value
              )
            }
            placeholder="Describe the job..."
          />
        </section>

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
              : "Creating Job..."
            : isEditing
              ? "Save Changes"
              : "Create Job"}
        </button>
      </form>
    </>
  );
}

export default JobForm;