# LBAC-BMS — Longbranch Automation & Controls Business Management System

A custom full-stack business management application developed for \***\*Longbranch Automation & Controls\*\***, an industrial automation and process control company serving the agriculture, chemical processing, and food processing industries.

## Project Overview

Longbranch Automation & Controls provides industrial automation, controls engineering, system integration, installation, maintenance, and technical support services.

This application provides Longbranch with a centralized system for managing the operational and financial side of the business, replacing disconnected spreadsheets and manual processes with a purpose-built application.

The system is designed around Longbranch's actual workflow:

```text

Customer

   │

   ├── Facility

   │      │

   │      └── Job

   │

   └── Invoice

          │

          └── InvoiceLineItem

```

Invoices can also be associated with jobs, keeping billing records connected to the work performed for a customer.

**---**

## Current Development Status

The authenticated full-stack application is deployed. Version 1.2 is active on the Railway production backend as of September 20, 2026. A functional walkthrough covered the main customer, facility, job, invoice, and PDF screens; this is not a claim of exhaustive automated testing.

Core customer, facility, job, invoice, authentication, and employee-access workflows are implemented across the React frontend, Express API, Prisma data layer, and PostgreSQL database.

Current production functionality includes:

- Secure employee login

- Password hashing with bcrypt

- JWT-based authenticated sessions

- HTTP-only authentication cookies

- Protected backend API routes

- Employee logout

- Administrator-controlled employee account creation

- Customer management

- Facility management

- Job management

- Invoice management

- PDF invoice generation

- Responsive desktop, tablet, and mobile layouts

- PostgreSQL production database

- Railway backend infrastructure

- Vercel frontend deployment configuration

Current follow-up items:

- Confirm the production database branch and preserve existing client data before any migrations.
- Complete and verify the customer address database migration; address fields have been prepared in the development schema/routes but are not yet documented as a released production feature.
- Connect the employee portal to the existing Longbranch website when website access is available.
- Complete client acceptance testing and persistence/authorization checks.

Unauthenticated users cannot access Longbranch business records.

**---**

## Dashboard

The application opens to a centralized business dashboard providing an overview of Longbranch's current operational and billing data.

The dashboard provides quick access to:

- Customers

- Jobs

- Invoices

- Billing activity

- Business management navigation

Additional reporting and operational metrics will continue to be added as the application develops.

**---**

## Customer Management

Customer management is implemented across the frontend and backend.

Current functionality includes:

- Create customers

- View all customers

- View individual customer details

- Edit customer information

- Delete customers

- Customer deletion confirmation

- Dependency protection when related business records exist

- Store customer contact information

- Store customer notes

- View associated facilities

- View jobs associated with customer facilities

- View invoices associated with a customer

- Navigate between related business records

The customer detail interface acts as a central account hub for customer-related activity.

**---**

## Facility Management

Facilities represent customer plant locations, job sites, or other operational locations.

Current functionality includes:

- Create facilities for customers

- Store facility address information

- Associate facilities with customers

- View facilities from customer records

- View jobs associated with facilities

- Delete facilities

- Facility deletion confirmation

- Dependency protection for facilities with related jobs

The relational structure maintains:

```text

Customer → Facility → Job

```

**---**

## Job Management

Full CRUD functionality has been implemented for jobs.

Current functionality includes:

- Create jobs for facilities

- Retrieve all jobs

- Retrieve individual jobs

- View detailed job information

- Edit existing jobs

- Delete jobs

- Job deletion confirmation

- Track job status

- Track start dates

- Track completion dates

- Associate jobs with facilities

- Return the associated facility and customer

- Navigate directly from customer records to related jobs

**---**

## Invoice Management

A complete invoice workflow has been implemented across the frontend and backend.

Current functionality includes:

- Create invoices

- Associate invoices with customers

- Optionally associate invoices with jobs

- Add multiple invoice line items

- Store quantity and rate for each line item

- Automatically calculate line-item amounts

- Calculate invoice subtotal

- Apply invoice discounts

- Calculate final invoice totals

- Set issue and due dates

- Track invoice status

- Retrieve all invoices

- Retrieve individual invoice details

- Edit invoices

- Delete invoices

- Invoice deletion confirmation

- Mark invoices as paid

- Display total invoiced

- Display outstanding balances

- Display paid totals

- Generate branded invoice documents

- Download invoices as PDF files

**---**

## Invoice Interface

The React frontend includes a dedicated invoice management interface designed around Longbranch's branding.

Interface features include:

- Longbranch Automation & Controls logo and branding

- Business management sidebar navigation

- Invoice summary cards

- Invoice list

- New invoice form

- Customer selection

- Job selection

- Dynamic invoice line items

- Automatic invoice calculations

- Invoice editing

- Detailed invoice view

- Payment status display

- Mark Paid functionality

- Delete Invoice functionality

- PDF invoice export

**---**

## PDF Invoice Generation

Invoices can be exported directly from the application as professional PDF documents.

Generated invoices include:

- Longbranch Automation & Controls branding

- Invoice number

- Issue date

- Due date

- Payment status

- Customer contact information

- Associated job

- Associated facility

- Itemized services or charges

- Quantity

- Rate

- Line-item totals

- Subtotal

- Discount

- Final invoice total

- Invoice notes

PDF generation is handled client-side using \***\*html2canvas\*\*** and \***\*jsPDF\*\***.

**---**

## Data Safety

Destructive actions include confirmation prompts before records are deleted.

Deletion workflows have been implemented for:

- Customers

- Facilities

- Jobs

- Invoices

Related-record protections are used where appropriate to prevent accidental deletion of business records that still have dependencies.

**---**

## API Endpoints

\| Method | Endpoint                        | Description                                    |

\| ------ | ------------------------------- | ---------------------------------------------- |

\| GET    | `/`                             | API health check                               |

\| GET    | `/api/customers`                | Retrieve customers with related business data  |

\| POST   | `/api/customers`                | Create a customer                              |

\| GET    | `/api/customers/:id`            | Retrieve an individual customer                |

\| PUT    | `/api/customers/:id`            | Update a customer                              |

\| DELETE | `/api/customers/:id`            | Delete a customer                              |

\| POST   | `/api/customers/:id/facilities` | Create a facility for a customer               |

\| DELETE | `/api/facilities/:id`           | Delete a facility                              |

\| POST   | `/api/facilities/:id/jobs`      | Create a job for a facility                    |

\| GET    | `/api/jobs`                     | Retrieve all jobs                              |

\| GET    | `/api/jobs/:id`                 | Retrieve an individual job                     |

\| PUT    | `/api/jobs/:id`                 | Update a job                                   |

\| DELETE | `/api/jobs/:id`                 | Delete a job                                   |

\| GET    | `/api/invoices`                 | Retrieve all invoices                          |

\| POST   | `/api/invoices`                 | Create an invoice                              |

\| GET    | `/api/invoices/:id`             | Retrieve an invoice with related business data |

\| PUT    | `/api/invoices/:id`             | Update an invoice                              |

\| PATCH  | `/api/invoices/:id/status`      | Update invoice payment status                  |

\| DELETE | `/api/invoices/:id`             | Delete an invoice                              |

**---**

## Database

PostgreSQL is used as the relational database, with Prisma ORM providing schema management, migrations, relationships, and database access.

Current primary models include:

- `Customer`

- `Facility`

- `Job`

- `Invoice`

- `InvoiceLineItem`

- `Employee`

The relational structure reflects Longbranch's real-world workflow, where work is performed for customers at specific facilities and billing can be associated directly with that work.

**---**

## Application Architecture

The frontend has been refactored into a modular page and component architecture rather than maintaining application functionality inside a single root component.

```text

client/src/

├── assets/

├── components/

├── pages/

│   ├── Dashboard.tsx

│   ├── Customers.tsx

│   ├── Jobs.tsx

│   ├── Invoices.tsx

│   ├── Login.tsx

│   └── CreateUser.tsx

├── services/

├── types/

├── App.tsx

└── main.tsx

```

This structure allows individual business modules to be developed and maintained independently as the system grows.

**---**

## Technology Stack

### Frontend

- React

- TypeScript

- Vite

- CSS

- html2canvas

- jsPDF

### Backend

- Node.js

- Express

- TypeScript

- Prisma ORM

- PostgreSQL

- bcryptjs

- JSON Web Tokens

- cookie-parser

### Infrastructure & Deployment

- Railway

- Neon PostgreSQL

- Vercel

- GitHub

### Development & Testing

- Postman

- Git

- GitHub

- VS Code

- Browser developer tools

**---**

## Production Deployment

The application is deployed as an authenticated employee portal for Longbranch Automation & Controls. The custom portal domain is not yet confirmed as connected to the existing company website.

Production architecture:

```text

Employee Device

      │

      ▼

Vercel Frontend

      │

      ▼

Railway API

      │

      ▼

Neon PostgreSQL

---

## Version 1.2 deployment update — September 20, 2026

**Deployment:** Railway production service `longbranch-automation` reported an active, successful deployment for the commit labeled “Complete v1.2 invoice access and PDF styling.” Deploy logs showed the Node.js server listening on port `8080`, with no fatal startup error visible in the reviewed excerpt.

**Database configuration:** A mismatch in the Railway `DATABASE_URL` target was identified and corrected to the intended Neon connection. The application subsequently displayed business data during a functional walkthrough. Deployment success and visible data alone do not establish that every write, migration, or access-control path has been verified. Do not include connection strings or credentials in this README.

**Functional walkthrough:** The reviewed test exercised navigation and screens for customers, facilities, jobs, invoice creation/editing, displayed invoice totals, and branded PDF output. The tested areas appeared to function; full persistence after refresh, permission boundaries, and exhaustive regression coverage have not been independently confirmed.

**Warnings:** Deploy logs included a PostgreSQL client SSL-mode compatibility warning about future `pg`/`pg-connection-string` behavior. This was not a fatal startup error; review SSL configuration before upgrading those dependencies.

**Pending:** Customer address fields were prepared in the development schema and routes, and Prisma Client was regenerated, but the database migration was paused because of database/shadow-database configuration concerns. Do not run a migration against production until the target database and migration plan are verified. No production customer-address release is claimed here.

---

## Planned Features

Following the authenticated production release, development is planned to continue with:

- Expanded employee account administration

- Additional role-based permissions

- Password reset workflow

- Employee activation and deactivation

- Estimates and quotes

- Customer payment history

- Expense tracking

- Vendor management

- Inventory and parts management

- Purchase tracking

- Job-specific labor and material costs

- Expanded financial reporting

- Expanded dashboard analytics

- Search and filtering

- Additional printable/exportable business documents

- Workflow and navigation improvements

---

## Project Goals

The goal of this project is to build a practical business application around the specific operational needs of Longbranch Automation & Controls rather than relying on a generic bookkeeping platform.

The application combines customer management, facility management, job tracking, billing, and financial workflows into a centralized system with a straightforward interface designed for everyday business use.

---

## Development

This project is designed and developed by **Jennifer** as a custom full-stack software engineering project for Longbranch Automation & Controls.

The repository documents the application's development incrementally as database models, API functionality, business logic, frontend workflows, authentication, and production infrastructure are implemented.

```
