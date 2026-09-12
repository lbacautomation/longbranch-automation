import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { API_URL } from "../services/api";

import type {
  Customer,
  Job,
} from "../types";

type Estimate = {
  id: number;
  estimateNumber: string;
  issueDate: string;
  validUntil?: string | null;
  subtotal: number;
  discount: number;
  total: number;
  customer: Customer;
};

type DashboardProps = {
  employeeName?: string;
};

function Dashboard({ employeeName }: DashboardProps) {
  const firstName = employeeName?.split(" ")[0];
  const [customers, setCustomers] =
    useState<Customer[]>([]);

  const [jobs, setJobs] =
    useState<Job[]>([]);

  const [estimates, setEstimates] =
    useState<Estimate[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const loadDashboard =
      async () => {
        try {
          setLoading(true);
          setError("");

          const [
            customerResponse,
            jobResponse,
            estimateResponse,
          ] = await Promise.all([
            fetch(
              `${API_URL}/api/customers`,
              {
                credentials:
                  "include",
              }
            ),
            fetch(
              `${API_URL}/api/jobs`,
              {
                credentials:
                  "include",
              }
            ),
            fetch(
              `${API_URL}/api/estimates`,
              {
                credentials:
                  "include",
              }
            ),
          ]);

          if (
            !customerResponse.ok ||
            !jobResponse.ok ||
            !estimateResponse.ok
          ) {
            throw new Error(
              "Unable to load dashboard data"
            );
          }

          const customerData:
            Customer[] =
              await customerResponse.json();

          const jobData:
            Job[] =
              await jobResponse.json();

          const estimateData:
            Estimate[] =
              await estimateResponse.json();

          setCustomers(
            customerData
          );

          setJobs(
            jobData
          );

          setEstimates(
            estimateData
          );
        } catch (error) {
          console.error(error);

          setError(
            "Unable to load dashboard."
          );
        } finally {
          setLoading(false);
        }
      };

    void loadDashboard();
  }, []);

  const formatCurrency = (
    amount: number
  ) =>
    new Intl.NumberFormat(
      "en-US",
      {
        style: "currency",
        currency: "USD",
      }
    ).format(amount);

  const formatDate = (
    date: string | null | undefined
  ) => {
    if (!date) {
      return "—";
    }

    return new Date(
      date
    ).toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      }
    );
  };

  const totalEstimated =
    estimates.reduce(
      (sum, estimate) =>
        sum +
        Number(estimate.total),
      0
    );

  const averageEstimate =
    estimates.length > 0
      ? totalEstimated /
        estimates.length
      : 0;

  const activeJobs =
    jobs.filter(
      (job) =>
        job.status ===
          "OPEN" ||
        job.status ===
          "IN_PROGRESS"
    ).length;

  const completedJobs =
    jobs.filter(
      (job) =>
        job.status ===
        "COMPLETED"
    ).length;

  const recentJobs =
    useMemo(() => {
      return [...jobs]
        .sort((a, b) => {
          const aDate =
            a.startDate
              ? new Date(
                  a.startDate
                ).getTime()
              : 0;

          const bDate =
            b.startDate
              ? new Date(
                  b.startDate
                ).getTime()
              : 0;

          return (
            bDate -
            aDate
          );
        })
        .slice(0, 5);
    }, [jobs]);

  const recentEstimates =
    useMemo(() => {
      return [...estimates]
        .sort((a, b) => {
          return (
            new Date(
              b.issueDate
            ).getTime() -
            new Date(
              a.issueDate
            ).getTime()
          );
        })
        .slice(0, 5);
    }, [estimates]);

  if (loading) {
    return (
      <p>
        Loading dashboard...
      </p>
    );
  }

  return (
    <>
   <header className="page-header">
  <div>
    <p className="eyebrow">
     Welcome back{firstName ? `, ${firstName}!` : ""}
    </p>

    <h2>Dashboard</h2>

    <p className="subtitle">
      Here’s what’s happening at Longbranch today.
    </p>
  </div>
</header>
      {error && (
        <div className="form-error">
          {error}
        </div>
      )}

      <section className="summary-grid">
        <div className="summary-card">
          <span>
            Customers
          </span>

          <strong>
            {customers.length}
          </strong>
        </div>

        <div className="summary-card">
          <span>
            Total Jobs
          </span>

          <strong>
            {jobs.length}
          </strong>
        </div>

        <div className="summary-card">
          <span>
            Active Jobs
          </span>

          <strong>
            {activeJobs}
          </strong>
        </div>

        <div className="summary-card">
          <span>
            Completed Jobs
          </span>

          <strong>
            {completedJobs}
          </strong>
        </div>

        <div className="summary-card">
          <span>
            Total Estimated
          </span>

          <strong>
            {formatCurrency(
              totalEstimated
            )}
          </strong>
        </div>

        <div className="summary-card">
          <span>
            Estimate Count
          </span>

          <strong>
            {estimates.length}
          </strong>
        </div>

        <div className="summary-card">
          <span>
            Average Estimate
          </span>

          <strong>
            {formatCurrency(
              averageEstimate
            )}
          </strong>
        </div>
      </section>

      <section className="estimate-section">
        <div className="section-heading">
          <div>
            <h3>
              Recent Jobs
            </h3>

            <p>
              Latest project activity
            </p>
          </div>
        </div>

        <div className="estimate-table">
          <div className="table-row table-header">
            <span>
              Job Number
            </span>

            <span>
              Job Name
            </span>

            <span>
              Customer
            </span>

            <span>
              Status
            </span>

            <span>
              Start Date
            </span>
          </div>

          {recentJobs.length ===
          0 ? (
            <div className="table-row">
              <span>
                No jobs yet.
              </span>
            </div>
          ) : (
            recentJobs.map(
              (job) => (
                <div
                  className="table-row"
                  key={job.id}
                >
                  <strong>
                    {job.jobNumber}
                  </strong>

                  <span>
                    {job.name}
                  </span>

                  <span>
                    {job.facility
                      ?.customer
                      ?.name ||
                      "—"}
                  </span>

                  <span>
                    <span
                      className={`status ${job.status
                        ?.toLowerCase()
                        .replace(
                          "_",
                          "-"
                        )}`}
                    >
                      {job.status ||
                        "—"}
                    </span>
                  </span>

                  <span>
                    {formatDate(
                      job.startDate
                    )}
                  </span>
                </div>
              )
            )
          )}
        </div>
      </section>

      <section className="estimate-section">
        <div className="section-heading">
          <div>
            <h3>
              Recent Estimates
            </h3>

            <p>
              Latest estimate activity
            </p>
          </div>
        </div>

        <div className="estimate-table">
          <div className="table-row table-header">
            <span>
              Estimate
            </span>

            <span>
              Customer
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

          {recentEstimates.length ===
          0 ? (
            <div className="table-row">
              <span>
                No estimates yet.
              </span>
            </div>
          ) : (
            recentEstimates.map(
              (estimate) => (
                <div
                  className="table-row"
                  key={estimate.id}
                >
                  <strong>
                    {
                      estimate.estimateNumber
                    }
                  </strong>

                  <span>
                    {
                      estimate
                        .customer
                        .name
                    }
                  </span>

                  <span>
                    {formatDate(
                      estimate.issueDate
                    )}
                  </span>

                  <span>
                    {formatDate(
                      estimate.validUntil
                    )}
                  </span>

                  <strong className="amount">
                    {formatCurrency(
                      Number(
                        estimate.total
                      )
                    )}
                  </strong>
                </div>
              )
            )
          )}
        </div>
      </section>
    </>
  );
}

export default Dashboard;
