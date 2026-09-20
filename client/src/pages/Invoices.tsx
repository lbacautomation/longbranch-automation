import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import longbranchLogo from "../assets/longbranch-logo.png";
import { API_URL } from "../services/api";

import type {
  Customer,
  Invoice,
  Job,
  LineItem,
} from "../types";

function Invoices() {
  const [invoices, setInvoices] =
    useState<Invoice[]>([]);

  const [customers, setCustomers] =
    useState<Customer[]>([]);

  const [jobs, setJobs] =
    useState<Job[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [showNewInvoice, setShowNewInvoice] =
    useState(false);

  const [selectedInvoice, setSelectedInvoice] =
    useState<Invoice | null>(null);

  const [editingInvoiceId, setEditingInvoiceId] =
    useState<number | null>(null);

  const [saving, setSaving] =
    useState(false);

  const [formError, setFormError] =
    useState("");

  const [invoiceNumber, setInvoiceNumber] =
    useState("");

  const [customerId, setCustomerId] =
    useState("");

  const [jobId, setJobId] =
    useState("");

  const [issueDate, setIssueDate] =
    useState(
      new Date()
        .toISOString()
        .slice(0, 10)
    );

  const [dueDate, setDueDate] =
    useState("");

  const [discount, setDiscount] =
    useState("0");

  const [notes, setNotes] =
    useState("");

  const [lineItems, setLineItems] =
    useState<LineItem[]>([
      {
        description: "",
        quantity: "1",
        rate: "",
      },
    ]);

  const invoicePdfRef =
    useRef<HTMLDivElement | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);

    const [
  invoiceResponse,
  customerResponse,
  jobResponse,
] = await Promise.all([
  fetch(`${API_URL}/api/invoices`, {
    credentials: "include",
  }),
  fetch(`${API_URL}/api/customers`, {
    credentials: "include",
  }),
  fetch(`${API_URL}/api/jobs`, {
    credentials: "include",
  }),
]);
      if (
        !invoiceResponse.ok ||
        !customerResponse.ok ||
        !jobResponse.ok
      ) {
        throw new Error(
          "Unable to load Longbranch data"
        );
      }

      const invoiceData: Invoice[] =
        await invoiceResponse.json();

      const customerData: Customer[] =
        await customerResponse.json();

      const jobData: Job[] =
        await jobResponse.json();

      setInvoices(invoiceData);
      setCustomers(customerData);
      setJobs(jobData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalInvoiced =
    invoices.reduce(
      (sum, invoice) =>
        sum + Number(invoice.total),
      0
    );

  const totalPaid =
    invoices
      .filter(
        (invoice) =>
          invoice.status === "PAID"
      )
      .reduce(
        (sum, invoice) =>
          sum + Number(invoice.total),
        0
      );

  const outstanding =
    totalInvoiced - totalPaid;

  const filteredJobs =
    useMemo(() => {
      if (!customerId) {
        return jobs;
      }

      return jobs.filter(
        (job) =>
          job.facility?.customer?.id ===
          Number(customerId)
      );
    }, [jobs, customerId]);

  const invoiceSubtotal =
    lineItems.reduce(
      (sum, item) => {
        const quantity =
          Number(item.quantity) || 0;

        const rate =
          Number(item.rate) || 0;

        return (
          sum +
          quantity * rate
        );
      },
      0
    );

  const discountAmount =
    Number(discount) || 0;

  const invoiceTotal =
    Math.max(
      invoiceSubtotal -
        discountAmount,
      0
    );

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
    date: string | null
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

  const createNextInvoiceNumber =
    () => {
      const numbers =
        invoices.map(
          (invoice) => {
            const match =
              invoice.invoiceNumber.match(
                /(\d+)$/
              );

            return match
              ? Number(match[1])
              : 0;
          }
        );

      const nextNumber =
        numbers.length > 0
          ? Math.max(
              ...numbers
            ) + 1
          : 1;

      return `LBAC-INV-${String(
        nextNumber
      ).padStart(3, "0")}`;
    };

  const openNewInvoice = () => {
    setEditingInvoiceId(null);
    setSelectedInvoice(null);

    setInvoiceNumber(
      createNextInvoiceNumber()
    );

    setCustomerId("");
    setJobId("");

    setIssueDate(
      new Date()
        .toISOString()
        .slice(0, 10)
    );

    setDueDate("");
    setDiscount("0");
    setNotes("");

    setLineItems([
      {
        description: "",
        quantity: "1",
        rate: "",
      },
    ]);

    setFormError("");
    setShowNewInvoice(true);
  };

  const openInvoice = async (
    invoiceId: number
  ) => {
    try {
      const response =
        await fetch(
          `${API_URL}/api/invoices/${invoiceId}`,
          {
            credentials: "include",
          }
        );

      if (!response.ok) {
        throw new Error(
          "Unable to load invoice"
        );
      }

      const data: Invoice =
        await response.json();

      setEditingInvoiceId(null);
      setShowNewInvoice(false);
      setSelectedInvoice(data);
    } catch (error) {
      console.error(error);
    }
  };

  const startEditingInvoice =
    () => {
      if (!selectedInvoice) {
        return;
      }

      setEditingInvoiceId(
        selectedInvoice.id
      );

      setInvoiceNumber(
        selectedInvoice.invoiceNumber
      );

      setCustomerId(
        String(
          selectedInvoice.customer.id
        )
      );

      setJobId(
        selectedInvoice.job
          ? String(
              selectedInvoice.job.id
            )
          : ""
      );

      setIssueDate(
        selectedInvoice.issueDate.slice(
          0,
          10
        )
      );

      setDueDate(
        selectedInvoice.dueDate
          ? selectedInvoice.dueDate.slice(
              0,
              10
            )
          : ""
      );

      setDiscount(
        selectedInvoice.discount
      );

      setNotes(
        selectedInvoice.notes || ""
      );

      setLineItems(
        selectedInvoice.lineItems?.map(
          (item) => ({
            description:
              item.description,
            quantity:
              item.quantity,
            rate:
              item.rate,
          })
        ) || [
          {
            description: "",
            quantity: "1",
            rate: "",
          },
        ]
      );

      setSelectedInvoice(null);
      setShowNewInvoice(true);
      setFormError("");
    };

  const updateLineItem = (
    index: number,
    field: keyof LineItem,
    value: string
  ) => {
    setLineItems(
      (currentItems) =>
        currentItems.map(
          (
            item,
            itemIndex
          ) =>
            itemIndex === index
              ? {
                  ...item,
                  [field]:
                    value,
                }
              : item
        )
    );
  };

  const addLineItem = () => {
    setLineItems(
      (currentItems) => [
        ...currentItems,
        {
          description: "",
          quantity: "1",
          rate: "",
        },
      ]
    );
  };

  const removeLineItem = (
    index: number
  ) => {
    if (
      lineItems.length === 1
    ) {
      return;
    }

    setLineItems(
      (currentItems) =>
        currentItems.filter(
          (
            _,
            itemIndex
          ) =>
            itemIndex !==
            index
        )
    );
  };

  const handleCreateInvoice =
    async (
      event: FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      setFormError("");

      if (
        !invoiceNumber.trim()
      ) {
        setFormError(
          "Invoice number is required."
        );
        return;
      }

      if (!customerId) {
        setFormError(
          "Please select a customer."
        );
        return;
      }

      const validLineItems =
        lineItems.filter(
          (item) =>
            item.description.trim() &&
            Number(
              item.quantity
            ) > 0
        );

      if (
        validLineItems.length ===
        0
      ) {
        setFormError(
          "Add at least one invoice line item."
        );
        return;
      }

      try {
        setSaving(true);

        const url =
          editingInvoiceId
            ? `${API_URL}/api/invoices/${editingInvoiceId}`
            : `${API_URL}/api/invoices`;

        const response =
          await fetch(
            url,
            {
               credentials: "include",
              method:
                editingInvoiceId
                  ? "PUT"
                  : "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  {
                    invoiceNumber:
                      invoiceNumber.trim(),

                    customerId:
                      Number(
                        customerId
                      ),

                    jobId:
                      jobId
                        ? Number(
                            jobId
                          )
                        : null,

                    issueDate,

                    dueDate:
                      dueDate ||
                      null,

                    discount:
                      discountAmount,

                    notes:
                      notes ||
                      null,

                    lineItems:
                      validLineItems.map(
                        (
                          item
                        ) => ({
                          description:
                            item.description.trim(),

                          quantity:
                            Number(
                              item.quantity
                            ),

                          rate:
                            Number(
                              item.rate
                            ) || 0,
                        })
                      ),
                  }
                ),
            }
          );

        if (!response.ok) {
          const errorData =
            await response.json();

          throw new Error(
            errorData.message ||
              (editingInvoiceId
                ? "Unable to update invoice"
                : "Unable to create invoice")
          );
        }

        const savedInvoice:
          Invoice =
            await response.json();

        await loadData();

        setEditingInvoiceId(
          null
        );

        setShowNewInvoice(
          false
        );

        setSelectedInvoice(
          savedInvoice
        );
      } catch (error) {
        console.error(error);

        setFormError(
          error instanceof Error
            ? error.message
            : editingInvoiceId
              ? "Unable to update invoice."
              : "Unable to create invoice."
        );
      } finally {
        setSaving(false);
      }
    };

  const handleMarkPaid =
    async () => {
      if (!selectedInvoice) {
        return;
      }

      try {
       const response =
  await fetch(
    `${API_URL}/api/invoices/${selectedInvoice.id}/status`,
    {
      credentials: "include",
      method: "PATCH",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
                    status:
                      "PAID",
                  }
                ),
            }
          );

        if (!response.ok) {
          throw new Error(
            "Unable to mark invoice as paid"
          );
        }

        const updatedInvoice:
          Invoice =
            await response.json();

        setSelectedInvoice(
          updatedInvoice
        );

        setInvoices(
          (
            currentInvoices
          ) =>
            currentInvoices.map(
              (invoice) =>
                invoice.id ===
                updatedInvoice.id
                  ? {
                      ...invoice,
                      status:
                        updatedInvoice.status,
                    }
                  : invoice
            )
        );
      } catch (error) {
        console.error(error);
      }
    };

    const handleDeleteInvoice = async () => {
  if (!selectedInvoice) {
    return;
  }

  const confirmed = window.confirm(
    `Are you sure you want to delete ${selectedInvoice.invoiceNumber}?\n\nThis action cannot be undone.`
  );

  if (!confirmed) {
    return;
  }

  try {
    setFormError("");

   const response =
  await fetch(
    `${API_URL}/api/invoices/${selectedInvoice.id}`,
    {
      method: "DELETE",
      credentials: "include",
    }
  );

    if (!response.ok) {
      let message =
        "Unable to delete invoice.";

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

    setSelectedInvoice(null);

    await loadData();
  } catch (error) {
    console.error(error);

    setFormError(
      error instanceof Error
        ? error.message
        : "Unable to delete invoice."
    );
  }
};

  const cancelInvoiceForm =
    () => {
      setEditingInvoiceId(null);
      setShowNewInvoice(false);
      setFormError("");
    };

  // Build the customer-facing PDF independently of the portal layout.
  const handleDownloadPdf = async () => {
    if (!selectedInvoice || !invoicePdfRef.current) return;

    try {
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const left = 18;
      const right = pageWidth - 18;
      const contentWidth = right - left;
      const navy = [36, 54, 77] as const;
      const muted = [82, 98, 118] as const;
      const pale = [234, 240, 247] as const;
      let y = 0;
      let pageNumber = 1;

      const color = (rgb: readonly number[]) =>
        pdf.setTextColor(rgb[0], rgb[1], rgb[2]);

      const footer = () => {
        pdf.setDrawColor(210, 222, 235);
        pdf.line(left, pageHeight - 21, right, pageHeight - 21);
        color(muted);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8.5);
        pdf.text("Longbranch Automation & Controls", left, pageHeight - 15);
        pdf.text(`Page ${pageNumber}`, right, pageHeight - 15, { align: "right" });
      };

      const nextPage = () => {
        footer();
        pdf.addPage();
        pageNumber += 1;
        y = 22;
      };

      const ensureSpace = (height: number) => {
        if (y + height > pageHeight - 27) nextPage();
      };

      // Capture only the logo; all PDF text and tables remain crisp vector content.
      const logo = invoicePdfRef.current.querySelector<HTMLImageElement>(
        ".invoice-detail-logo"
      );
      if (logo) {
        const logoCanvas = await html2canvas(logo, {
          scale: 2,
          backgroundColor: null,
          useCORS: true,
        });
        const logoWidth = 57;
        const logoHeight = (logoCanvas.height / logoCanvas.width) * logoWidth;
        pdf.addImage(logoCanvas.toDataURL("image/png"), "PNG", left, 19, logoWidth, logoHeight);
      }

      color(navy);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(23);
      pdf.text("INVOICE", right, 28, { align: "right" });

      const metaX = right - 69;
      let metaY = 39;
      const meta = [
        ["INVOICE #", selectedInvoice.invoiceNumber],
        ["ISSUE DATE", formatDate(selectedInvoice.issueDate)],
        ["DUE DATE", formatDate(selectedInvoice.dueDate)],
      ];
      meta.forEach(([label, value]) => {
        color(muted);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.text(label, metaX, metaY);
        color(navy);
        pdf.setFontSize(9.5);
        pdf.text(value, right, metaY, { align: "right" });
        metaY += 8;
      });

      y = 76;
      pdf.setDrawColor(...navy);
      pdf.setLineWidth(0.5);
      pdf.line(left, y, right, y);
      y += 10;

      const halfGap = 5;
      const halfWidth = (contentWidth - halfGap) / 2;
      const sectionHeader = (title: string, x: number) => {
        pdf.setFillColor(...pale);
        pdf.rect(x, y, halfWidth, 8, "F");
        color(navy);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        pdf.text(title, x + 3, y + 5.5);
      };
      sectionHeader("BILL TO", left);
      sectionHeader("JOB", left + halfWidth + halfGap);
      y += 13;

      const customerLines = [
        selectedInvoice.customer.name,
        selectedInvoice.customer.email,
        selectedInvoice.customer.phone,
      ].filter((value): value is string => Boolean(value));
      const jobLines = selectedInvoice.job
        ? [
            selectedInvoice.job.jobNumber,
            selectedInvoice.job.name,
            selectedInvoice.job.facility?.name,
          ].filter((value): value is string => Boolean(value))
        : ["No job assigned"];
      const partyLineCount = Math.max(customerLines.length, jobLines.length);
      for (let index = 0; index < partyLineCount; index += 1) {
        const drawPartyLine = (value: string | undefined, x: number) => {
          if (!value) return;
          color(index === 0 ? navy : muted);
          pdf.setFont("helvetica", index === 0 ? "bold" : "normal");
          pdf.setFontSize(index === 0 ? 11 : 9);
          const lines = pdf.splitTextToSize(value, halfWidth - 5);
          pdf.text(lines[0], x, y);
        };
        drawPartyLine(customerLines[index], left);
        drawPartyLine(jobLines[index], left + halfWidth + halfGap);
        y += 6;
      }
      y += 14;

      const columns = {
        description: left + 3,
        qty: left + contentWidth * 0.73,
        rate: left + contentWidth * 0.86,
        amount: right - 3,
      };
      const tableHeader = () => {
        pdf.setFillColor(...navy);
        pdf.rect(left, y, contentWidth, 10, "F");
        pdf.setTextColor(255, 255, 255);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8.5);
        pdf.text("DESCRIPTION", columns.description, y + 6.5);
        pdf.text("QTY", columns.qty, y + 6.5, { align: "right" });
        pdf.text("RATE", columns.rate, y + 6.5, { align: "right" });
        pdf.text("AMOUNT", columns.amount, y + 6.5, { align: "right" });
        y += 10;
      };
      tableHeader();

      for (const item of selectedInvoice.lineItems ?? []) {
        color(navy);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9.5);
        const descriptionLines: string[] = pdf.splitTextToSize(
          item.description,
          contentWidth * 0.57
        );
        const rowHeight = Math.max(12, descriptionLines.length * 5 + 6);
        if (y + rowHeight > pageHeight - 35) {
          nextPage();
          tableHeader();
        }
        pdf.text(descriptionLines, columns.description, y + 7);
        pdf.text(String(item.quantity), columns.qty, y + 7, { align: "right" });
        pdf.text(formatCurrency(Number(item.rate)), columns.rate, y + 7, { align: "right" });
        pdf.setFont("helvetica", "bold");
        pdf.text(formatCurrency(Number(item.amount)), columns.amount, y + 7, {
          align: "right",
        });
        pdf.setDrawColor(220, 229, 239);
        pdf.line(left, y + rowHeight, right, y + rowHeight);
        y += rowHeight;
      }

      y += 12;
      const notesWidth = contentWidth * 0.56;
      const totalsX = left + contentWidth * 0.62;
      const notesLines: string[] = pdf.splitTextToSize(
        selectedInvoice.notes || "No notes",
        notesWidth - 6
      );
      ensureSpace(Math.max(45, notesLines.length * 5 + 18));
      pdf.setFillColor(...pale);
      pdf.rect(left, y, notesWidth, 8, "F");
      color(navy);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.text("NOTES", left + 3, y + 5.5);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      color(muted);
      pdf.text(notesLines, left + 3, y + 15);

      const totalRow = (label: string, value: number, rowY: number) => {
        color(navy);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9.5);
        pdf.text(label, totalsX + 3, rowY);
        pdf.setFont("helvetica", "bold");
        pdf.text(formatCurrency(value), right - 3, rowY, { align: "right" });
      };
      totalRow("Subtotal", Number(selectedInvoice.subtotal), y + 5);
      totalRow("Discount", Number(selectedInvoice.discount), y + 15);
      pdf.setFillColor(...pale);
      pdf.rect(totalsX, y + 22, right - totalsX, 13, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      color(navy);
      pdf.text("Total", totalsX + 3, y + 30);
      pdf.text(formatCurrency(Number(selectedInvoice.total)), right - 3, y + 30, {
        align: "right",
      });

      footer();
      pdf.save(`${selectedInvoice.invoiceNumber}.pdf`);
    } catch (error) {
      console.error("Unable to generate invoice PDF", error);
      window.alert("Unable to generate the invoice PDF. Please try again.");
    }
  };

  return (
    <>
      {selectedInvoice ? (
        <>
          <header className="page-header">
            <div>
              <p className="eyebrow">
                Longbranch Automation
                & Controls
              </p>

              <h2>
                {
                  selectedInvoice.invoiceNumber
                }
              </h2>

              <p className="subtitle">
                Invoice details
              </p>
            </div>

            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                setSelectedInvoice(
                  null
                )
              }
            >
              Back to Invoices
            </button>
          </header>

          <section
            className="invoice-detail"
            ref={invoicePdfRef}
          >
           <div className="invoice-detail-top">
  <div className="invoice-company">
    <img
      src={longbranchLogo}
      alt="Longbranch Automation & Controls"
      className="invoice-detail-logo"
    />
  </div>

  <div className="invoice-heading">
    <h1>INVOICE</h1>

    <div className="invoice-detail-meta">
      <div>
        <span>Invoice #</span>
        <strong>
          {selectedInvoice.invoiceNumber}
        </strong>
      </div>

      <div>
        <span>Issue Date</span>
        <strong>
          {formatDate(selectedInvoice.issueDate)}
        </strong>
      </div>

      <div>
        <span>Due Date</span>
        <strong>
          {formatDate(selectedInvoice.dueDate)}
        </strong>
      </div>
    </div>
  </div>
</div>

            <div className="invoice-party-grid">
              <div>
                <span className="invoice-label">
                  Bill To
                </span>

                <h3>
                  {
                    selectedInvoice
                      .customer
                      .name
                  }
                </h3>

                {selectedInvoice
                  .customer
                  .email && (
                  <p>
                    {
                      selectedInvoice
                        .customer
                        .email
                    }
                  </p>
                )}

                {selectedInvoice
                  .customer
                  .phone && (
                  <p>
                    {
                      selectedInvoice
                        .customer
                        .phone
                    }
                  </p>
                )}
              </div>

              <div>
                <span className="invoice-label">
                  Job
                </span>

                {selectedInvoice.job ? (
                  <>
                    <h3>
                      {
                        selectedInvoice
                          .job
                          .jobNumber
                      }
                    </h3>

                    <p>
                      {
                        selectedInvoice
                          .job.name
                      }
                    </p>

                    {selectedInvoice
                      .job
                      .facility && (
                      <p>
                        {
                          selectedInvoice
                            .job
                            .facility
                            .name
                        }
                      </p>
                    )}
                  </>
                ) : (
                  <p>
                    No job assigned
                  </p>
                )}
              </div>
            </div>

            <div className="invoice-detail-table">
              <div className="invoice-detail-row invoice-detail-header">
                <span>
                  Description
                </span>
                <span>Qty</span>
                <span>Rate</span>
                <span>
                  Amount
                </span>
              </div>

              {selectedInvoice
                .lineItems?.map(
                  (item) => (
                    <div
                      className="invoice-detail-row"
                      key={
                        item.id
                      }
                    >
                      <span>
                        {
                          item.description
                        }
                      </span>

                      <span>
                        {
                          item.quantity
                        }
                      </span>

                      <span>
                        {formatCurrency(
                          Number(
                            item.rate
                          )
                        )}
                      </span>

                      <strong>
                        {formatCurrency(
                          Number(
                            item.amount
                          )
                        )}
                      </strong>
                    </div>
                  )
                )}
            </div>

            <div className="invoice-detail-bottom">
              <div className="invoice-notes">
                <span className="invoice-label">
                  Notes
                </span>

                <p>
                  {selectedInvoice.notes ||
                    "No notes"}
                </p>
              </div>

              <div className="invoice-detail-totals">
                <div>
                  <span>
                    Subtotal
                  </span>

                  <strong>
                    {formatCurrency(
                      Number(
                        selectedInvoice.subtotal
                      )
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Discount
                  </span>

                  <strong>
                    {formatCurrency(
                      Number(
                        selectedInvoice.discount
                      )
                    )}
                  </strong>
                </div>

                <div className="invoice-detail-grand-total">
                  <span>
                    Total
                  </span>

                  <strong>
                    {formatCurrency(
                      Number(
                        selectedInvoice.total
                      )
                    )}
                  </strong>
                </div>
              </div>
            </div>

            <div
              className="invoice-actions"
              data-html2canvas-ignore="true"
            >
              <button
                type="button"
                className="secondary-button"
                onClick={
                  startEditingInvoice
                }
              >
                Edit Invoice
              </button>

              <button
  type="button"
  className="secondary-button"
  onClick={
    handleDownloadPdf
  }
>
  Download PDF
</button>

<button
  type="button"
  className="danger-button"
  onClick={handleDeleteInvoice}
>
  Delete Invoice
</button>


              {selectedInvoice.status !==
                "PAID" && (
                <button
                  type="button"
                  className="primary-button"
                  onClick={
                    handleMarkPaid
                  }
                >
                  Mark Paid
                </button>
              )}
            </div>
          </section>
        </>
      ) : showNewInvoice ? (
        <>
          <header className="page-header">
            <div>
              <p className="eyebrow">
                Longbranch Automation
                & Controls
              </p>

              <h2>
                {editingInvoiceId
                  ? "Edit Invoice"
                  : "New Invoice"}
              </h2>

              <p className="subtitle">
                {editingInvoiceId
                  ? "Update this customer invoice."
                  : "Create a customer invoice."}
              </p>
            </div>

            <button
              type="button"
              className="secondary-button"
              onClick={
                cancelInvoiceForm
              }
            >
              Back to Invoices
            </button>
          </header>

          <form
            className="invoice-form"
            onSubmit={
              handleCreateInvoice
            }
          >
            {formError && (
              <div className="form-error">
                {formError}
              </div>
            )}

            <section className="form-card">
              <div className="form-card-header">
                <div>
                  <h3>
                    Invoice Details
                  </h3>

                  <p>
                    Customer, job, and
                    billing information.
                  </p>
                </div>
              </div>

              <div className="form-grid">
                <label>
                  <span>
                    Invoice Number
                  </span>

                  <input
                    type="text"
                    value={
                      invoiceNumber
                    }
                    onChange={(
                      event
                    ) =>
                      setInvoiceNumber(
                        event.target
                          .value
                      )
                    }
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

                      setJobId("");
                    }}
                  >
                    <option value="">
                      Select customer
                    </option>

                    {customers.map(
                      (customer) => (
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
                    Job
                  </span>

                  <select
                    value={jobId}
                    onChange={(
                      event
                    ) =>
                      setJobId(
                        event.target
                          .value
                      )
                    }
                  >
                    <option value="">
                      No job selected
                    </option>

                    {filteredJobs.map(
                      (job) => (
                        <option
                          key={
                            job.id
                          }
                          value={
                            job.id
                          }
                        >
                          {
                            job.jobNumber
                          }{" "}
                          —{" "}
                          {
                            job.name
                          }
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label>
                  <span>
                    Issue Date
                  </span>

                  <input
                    type="date"
                    value={
                      issueDate
                    }
                    onChange={(
                      event
                    ) =>
                      setIssueDate(
                        event.target
                          .value
                      )
                    }
                  />
                </label>

                <label>
                  <span>
                    Due Date
                  </span>

                  <input
                    type="date"
                    value={
                      dueDate
                    }
                    onChange={(
                      event
                    ) =>
                      setDueDate(
                        event.target
                          .value
                      )
                    }
                  />
                </label>
              </div>
            </section>

            <section className="form-card">
              <div className="form-card-header line-item-heading">
                <div>
                  <h3>
                    Line Items
                  </h3>

                  <p>
                    Add the work,
                    materials, or
                    services being
                    billed.
                  </p>
                </div>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={
                    addLineItem
                  }
                >
                  + Add Line
                </button>
              </div>

              <div className="line-items">
                <div className="line-item-row line-item-header">
                  <span>
                    Description
                  </span>
                  <span>Qty</span>
                  <span>Rate</span>
                  <span>
                    Amount
                  </span>
                  <span />
                </div>

                {lineItems.map(
                  (
                    item,
                    index
                  ) => {
                    const amount =
                      (Number(
                        item.quantity
                      ) || 0) *
                      (Number(
                        item.rate
                      ) || 0);

                    return (
                      <div
                        className="line-item-row"
                        key={
                          index
                        }
                      >
                        <input
                          type="text"
                          placeholder="Description"
                          value={
                            item.description
                          }
                          onChange={(
                            event
                          ) =>
                            updateLineItem(
                              index,
                              "description",
                              event
                                .target
                                .value
                            )
                          }
                        />

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            item.quantity
                          }
                          onChange={(
                            event
                          ) =>
                            updateLineItem(
                              index,
                              "quantity",
                              event
                                .target
                                .value
                            )
                          }
                        />

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={
                            item.rate
                          }
                          onChange={(
                            event
                          ) =>
                            updateLineItem(
                              index,
                              "rate",
                              event
                                .target
                                .value
                            )
                          }
                        />

                        <strong>
                          {formatCurrency(
                            amount
                          )}
                        </strong>

                        <button
                          type="button"
                          className="remove-line-button"
                          onClick={() =>
                            removeLineItem(
                              index
                            )
                          }
                          disabled={
                            lineItems.length ===
                            1
                          }
                        >
                          ×
                        </button>
                      </div>
                    );
                  }
                )}
              </div>
            </section>

            <div className="invoice-bottom-grid">
              <section className="form-card">
                <div className="form-card-header">
                  <div>
                    <h3>
                      Notes
                    </h3>

                    <p>
                      Optional invoice
                      or payment notes.
                    </p>
                  </div>
                </div>

                <textarea
                  rows={6}
                  value={
                    notes
                  }
                  onChange={(
                    event
                  ) =>
                    setNotes(
                      event.target
                        .value
                    )
                  }
                  placeholder="Add invoice notes..."
                />
              </section>

              <section className="form-card totals-card">
                <div className="invoice-total-row">
                  <span>
                    Subtotal
                  </span>

                  <strong>
                    {formatCurrency(
                      invoiceSubtotal
                    )}
                  </strong>
                </div>

                <label className="discount-row">
                  <span>
                    Discount
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      discount
                    }
                    onChange={(
                      event
                    ) =>
                      setDiscount(
                        event.target
                          .value
                      )
                    }
                  />
                </label>

                <div className="invoice-total-row grand-total">
                  <span>
                    Total
                  </span>

                  <strong>
                    {formatCurrency(
                      invoiceTotal
                    )}
                  </strong>
                </div>

                <button
                  type="submit"
                  className="primary-button save-invoice-button"
                  disabled={
                    saving
                  }
                >
                  {saving
                    ? editingInvoiceId
                      ? "Saving Changes..."
                      : "Creating Invoice..."
                    : editingInvoiceId
                      ? "Save Changes"
                      : "Create Invoice"}
                </button>
              </section>
            </div>
          </form>
        </>
      ) : (
        <>
          <header className="page-header">
            <div>
              <p className="eyebrow">
                Longbranch Automation
                & Controls
              </p>

              <h2>
                Invoices
              </h2>

              <p className="subtitle">
                Create, manage, and
                track customer
                invoices.
              </p>
            </div>

            <button
              type="button"
              className="primary-button"
              onClick={
                openNewInvoice
              }
            >
              + New Invoice
            </button>
          </header>

          <section className="summary-grid">
            <div className="summary-card">
              <span>
                Total Invoiced
              </span>

              <strong>
                {formatCurrency(
                  totalInvoiced
                )}
              </strong>
            </div>

            <div className="summary-card">
              <span>
                Outstanding
              </span>

              <strong>
                {formatCurrency(
                  outstanding
                )}
              </strong>
            </div>

            <div className="summary-card">
              <span>
                Paid
              </span>

              <strong>
                {formatCurrency(
                  totalPaid
                )}
              </strong>
            </div>
          </section>

          <section className="invoice-section">
            <div className="section-heading">
              <div>
                <h3>
                  Invoices
                </h3>

                <p>
                  Recent customer
                  invoices
                </p>
              </div>
            </div>

            <div className="invoice-table">
              <div className="table-row table-header">
                <span>
                  Invoice
                </span>

                <span>
                  Customer
                </span>

                <span>
                  Due Date
                </span>

                <span>
                  Status
                </span>

                <span className="amount">
                  Total
                </span>
              </div>

              {loading ? (
                <div className="table-row">
                  <span>
                    Loading invoices...
                  </span>
                </div>
              ) : invoices.length ===
                0 ? (
                <div className="table-row">
                  <span>
                    No invoices yet.
                  </span>
                </div>
              ) : (
                invoices.map(
                  (invoice) => (
                    <div
                      className="table-row invoice-row"
                      key={
                        invoice.id
                      }
                      onClick={() =>
                        openInvoice(
                          invoice.id
                        )
                      }
                    >
                      <strong>
                        {
                          invoice.invoiceNumber
                        }
                      </strong>

                      <span>
                        {
                          invoice
                            .customer
                            .name
                        }
                      </span>

                      <span>
                        {formatDate(
                          invoice.dueDate
                        )}
                      </span>

                      <span>
                        <span
                          className={`status ${invoice.status.toLowerCase()}`}
                        >
                          {
                            invoice.status
                          }
                        </span>
                      </span>

                      <strong className="amount">
                        {formatCurrency(
                          Number(
                            invoice.total
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
      )}
    </>
  );
}

export default Invoices;