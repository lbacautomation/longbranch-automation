import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import type { Request, Response, NextFunction } from "express";
import { prisma } from "./prisma.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not configured");
}

const isAllowedOrigin = (
  origin: string | undefined
) => {
  if (!origin) {
    return true;
  }

  if (
    origin ===
    "http://localhost:5173"
  ) {
    return true;
  }

  if (
    origin ===
    "https://portal.longbranchcontrols.com"
  ) {
    return true;
  }

  if (
    origin.startsWith(
      "https://longbranch-automation-"
    ) &&
    origin.endsWith(
      ".vercel.app"
    )
  ) {
    return true;
  }

  return false;
};

app.use(
  cors({
    origin(
      origin,
      callback
    ) {
      if (
        isAllowedOrigin(origin)
      ) {
        callback(null, true);
        return;
      }

      callback(
        new Error(
          "Not allowed by CORS"
        )
      );
    },

    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

type AuthenticatedRequest = Request & {
  employee?: {
    id: number;
    name: string;
    email: string;
    role: string;
    mustChangePassword: boolean;
    mustCompleteProfile: boolean;
  };
};

const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.longbranch_session;

    if (!token) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const payload = jwt.verify(token, JWT_SECRET) as {
      employeeId: number;
    };

    const employee = await prisma.employee.findUnique({
      where: {
        id: payload.employeeId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        mustCompleteProfile: true,
      },
    });

    if (!employee || !employee.isActive) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    req.employee = {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      role: employee.role,
      mustChangePassword:
        employee.mustChangePassword,
      mustCompleteProfile: employee.mustCompleteProfile,
    };

    next();
  } catch {
    return res.status(401).json({
      message: "Authentication required",
    });
  }
};

app.get("/", (_req, res) => {
  res.json({
    message: "Longbranch Automation Books API is running",
  });
});


app.get(
  "/api/auth/profile",
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const employee =
        await prisma.employee.findUnique({
          where: {
            id: req.employee!.id,
          },

          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            state: true,
            zipCode: true,
            startDate: true,
            emergencyContact: true,
            emergencyPhone: true,
            role: true,
            mustChangePassword: true,
            mustCompleteProfile: true,
          },
        });

      if (!employee) {
        return res.status(404).json({
          message:
            "Employee not found",
        });
      }

      return res.json({
        employee,
      });
    } catch (error) {
      console.error(
        "Unable to load employee profile:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to load employee profile",
      });
    }
  }
);

app.put(
  "/api/auth/profile",
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const {
        name,
        phone,
        address,
        city,
        state,
        zipCode,
        emergencyContact,
        emergencyPhone,
      } = req.body;

      if (
        !name?.trim() ||
        !phone?.trim() ||
        !address?.trim() ||
        !city?.trim() ||
        !state?.trim() ||
        !zipCode?.trim() ||
        !emergencyContact?.trim() ||
        !emergencyPhone?.trim()
      ) {
        return res.status(400).json({
          message:
            "Please complete all required profile fields",
        });
      }

      const employee =
        await prisma.employee.update({
          where: {
            id: req.employee!.id,
          },

          data: {
            name: name.trim(),
            phone: phone.trim(),
            address: address.trim(),
            city: city.trim(),
            state: state.trim(),
            zipCode: zipCode.trim(),
            emergencyContact:
              emergencyContact.trim(),
            emergencyPhone:
              emergencyPhone.trim(),
            mustCompleteProfile:
              false,
          },

          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            mustChangePassword: true,
            mustCompleteProfile: true,
          },
        });

      return res.json({
        employee,
      });
    } catch (error) {
      console.error(
        "Unable to update employee profile:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to update employee profile",
      });
    }
  }
);


app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const employee = await prisma.employee.findUnique({
      where: {
        email: email.trim().toLowerCase(),
      },
    });

    if (!employee || !employee.isActive) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      employee.passwordHash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        employeeId: employee.id,
      },
      JWT_SECRET,
      {
        expiresIn: "8h",
      }
    );

    res.cookie("longbranch_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite:
        process.env.NODE_ENV === "production"
          ? "none"
          : "lax",
      maxAge: 8 * 60 * 60 * 1000,
    });

    return res.json({
  employee: {
    id: employee.id,
    name: employee.name,
    email: employee.email,
    role: employee.role,
    mustChangePassword:
      employee.mustChangePassword,
    mustCompleteProfile:
      employee.mustCompleteProfile,
  },
});
  } catch (error) {
    console.error("Unable to log in:", error);

    return res.status(500).json({
      message: "Unable to log in",
    });
  }
});

app.post("/api/auth/logout", (_req, res) => {
  res.clearCookie("longbranch_session", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite:
      process.env.NODE_ENV === "production"
        ? "none"
        : "lax",
  });

  return res.json({
    message: "Logged out successfully",
  });
});

app.get(
  "/api/auth/me",
  requireAuth,
  (req: AuthenticatedRequest, res) => {
    return res.json({
      employee: req.employee,
    });
  }
);


app.post(
  "/api/auth/change-password",
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const {
        currentPassword,
        newPassword,
      } = req.body;

      if (
        !currentPassword ||
        !newPassword
      ) {
        return res.status(400).json({
          message:
            "Current password and new password are required",
        });
      }

      if (newPassword.length < 12) {
        return res.status(400).json({
          message:
            "New password must be at least 12 characters",
        });
      }

      if (
        currentPassword ===
        newPassword
      ) {
        return res.status(400).json({
          message:
            "New password must be different from the temporary password",
        });
      }

      const employee =
        await prisma.employee.findUnique({
          where: {
            id: req.employee!.id,
          },
        });

      if (!employee) {
        return res.status(404).json({
          message:
            "Employee not found",
        });
      }

      const passwordMatches =
        await bcrypt.compare(
          currentPassword,
          employee.passwordHash
        );

      if (!passwordMatches) {
        return res.status(401).json({
          message:
            "Current password is incorrect",
        });
      }

      const passwordHash =
        await bcrypt.hash(
          newPassword,
          12
        );

      const updatedEmployee =
        await prisma.employee.update({
          where: {
            id: employee.id,
          },

          data: {
            passwordHash,
            mustChangePassword:
              false,
          },

          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            mustChangePassword:
              true,
            mustCompleteProfile:
              true,
          },
        });

      return res.json({
        employee:
          updatedEmployee,
      });
    } catch (error) {
      console.error(
        "Unable to change password:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to change password",
      });
    }
  }
);

app.post("/api/auth/setup", async (req, res) => {
  try {
    const employeeCount = await prisma.employee.count();

    if (employeeCount > 0) {
      return res.status(403).json({
        message: "Initial administrator has already been created",
      });
    }

    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required",
      });
    }

    if (password.length < 12) {
      return res.status(400).json({
        message: "Password must be at least 12 characters",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const employee = await prisma.employee.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        role: "ADMIN",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return res.status(201).json({
      employee,
    });
  } catch (error) {
    console.error("Unable to create administrator:", error);

    return res.status(500).json({
      message: "Unable to create administrator",
    });
  }
});

// Everything below this line requires an authenticated employee.
app.use("/api", requireAuth);

app.use(
  "/api",
  (
    req: AuthenticatedRequest,
    res,
    next
  ) => {
    if (
      req.employee
        ?.mustChangePassword
    ) {
      return res.status(403).json({
        message:
          "Password change required",
        code:
          "PASSWORD_CHANGE_REQUIRED",
      });
    }

    next();
  }
);

app.post(
  "/api/employees",
  async (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      if (
        req.employee?.role !==
        "ADMIN"
      ) {
        return res.status(403).json({
          message:
            "Administrator access required",
        });
      }

      const {
  name,
  email,
  password,
  phone,
  address,
  city,
  state,
  zipCode,
  startDate,
  emergencyContact,
  emergencyPhone,
} = req.body;

      if (
        !name?.trim() ||
        !email?.trim() ||
        !password
      ) {
        return res.status(400).json({
          message:
            "Name, email, and password are required",
        });
      }

      if (password.length < 12) {
        return res.status(400).json({
          message:
            "Password must be at least 12 characters",
        });
      }

      const normalizedEmail =
        email
          .trim()
          .toLowerCase();

      const existingEmployee =
        await prisma.employee.findUnique({
          where: {
            email: normalizedEmail,
          },
        });

      if (existingEmployee) {
        return res.status(409).json({
          message:
            "A user with this email already exists",
        });
      }

      const passwordHash =
        await bcrypt.hash(
          password,
          12
        );

      const employee =
        await prisma.employee.create({
       data: {
  name: name.trim(),
  email: normalizedEmail,
  passwordHash,
  role: "EMPLOYEE",
  isActive: true,
  mustChangePassword: true,
  mustCompleteProfile: true,

  phone: phone?.trim() || null,
  address: address?.trim() || null,
  city: city?.trim() || null,
  state: state?.trim() || null,
  zipCode: zipCode?.trim() || null,

  startDate: startDate
    ? new Date(startDate)
    : null,

  emergencyContact:
    emergencyContact?.trim() || null,

  emergencyPhone:
    emergencyPhone?.trim() || null,
},
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            mustChangePassword:
              true,
          },
        });

      return res.status(201).json({
        employee,
      });
    } catch (error) {
      console.error(
        "Unable to create employee:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to create user",
      });
    }
  }
);

app.get("/api/customers", async (_req, res) => {
  try {
    const customers = await prisma.customer.findMany({
    include: {
  facilities: {
    include: {
      jobs: true,
    },
  },
},
      orderBy: {
        name: "asc",
      },
    });

    res.json(customers);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Unable to retrieve customers",
    });
  }
});

app.post("/api/customers", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      city,
      state,
      zipCode,
      notes,
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        message: "Customer name is required",
      });
    }

    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        city: city?.trim() || null,
        state: state?.trim() || null,
        zipCode: zipCode?.trim() || null,
        notes: notes?.trim() || null,
      },
    });

    res.status(201).json(customer);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Unable to create customer",
    });
  }
});

app.get("/api/customers/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const customer = await prisma.customer.findUnique({
      where: { id },
    include: {
  facilities: {
    include: {
      jobs: true,
    },
  },
},
});
    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    res.json(customer);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Unable to retrieve customer",
    });
  }
});

app.post("/api/customers/:id/facilities", async (req, res) => {
  try {
    const customerId = Number(req.params.id);
    const { name, address, city, state, zipCode, notes } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        message: "Facility name is required",
      });
    }

    const facility = await prisma.facility.create({
      data: {
        name: name.trim(),
        address: address || null,
        city: city || null,
        state: state || null,
        zipCode: zipCode || null,
        notes: notes || null,
        customerId,
      },
    });

    res.status(201).json(facility);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Unable to create facility",
    });
  }
});

app.delete("/api/facilities/:id", async (req, res) => {
  try {
    const facilityId =
      Number(req.params.id);

    if (!Number.isInteger(facilityId)) {
      return res.status(400).json({
        message: "Invalid facility id",
      });
    }

    const facility =
      await prisma.facility.findUnique({
        where: {
          id: facilityId,
        },
        include: {
          jobs: true,
        },
      });

    if (!facility) {
      return res.status(404).json({
        message: "Facility not found",
      });
    }

    if (facility.jobs.length > 0) {
      return res.status(409).json({
        message:
          "This facility cannot be deleted because jobs are still attached to it. Remove or reassign those jobs first.",
      });
    }

    await prisma.facility.delete({
      where: {
        id: facilityId,
      },
    });

    return res.json({
      message:
        "Facility deleted successfully",
    });
  } catch (error) {
    console.error(
      "Unable to delete facility:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to delete facility",
    });
  }
});

app.post("/api/facilities/:id/jobs", async (req, res) => {
  try {
    const facilityId = Number(req.params.id);

    const {
      name,
      description,
      status,
      startDate,
      endDate,
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        message: "Job name is required",
      });
    }

    const year = new Date().getFullYear();

    const latestJob = await prisma.job.findFirst({
      where: {
        jobNumber: {
          startsWith: `LB-${year}-`,
        },
      },
      orderBy: {
        jobNumber: "desc",
      },
    });

    let nextNumber = 1;

    if (latestJob) {
      const lastNumber = Number(
        latestJob.jobNumber.split("-").pop()
      );

      if (!Number.isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    const jobNumber =
      `LB-${year}-${String(nextNumber).padStart(3, "0")}`;

    const job = await prisma.job.create({
      data: {
        jobNumber,
        name: name.trim(),
        description: description || null,
        status: status || "ACTIVE",
        startDate: startDate
          ? new Date(startDate)
          : null,
        endDate: endDate
          ? new Date(endDate)
          : null,
        facilityId,
      },
    });

    res.status(201).json(job);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Unable to create job",
    });
  }
});
app.get("/api/jobs", async (_req, res) => {
  try {
    const jobs = await prisma.job.findMany({
      include: {
        facility: {
          include: {
            customer: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(jobs);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Unable to retrieve jobs",
    });
  }
});

app.post("/api/jobs", async (req, res) => {
  try {
    const {
      jobNumber,
      name,
      description,
      status,
      startDate,
      endDate,
      facilityId,
    } = req.body;

    if (!jobNumber?.trim()) {
      return res.status(400).json({
        message: "Job number is required",
      });
    }

    if (!name?.trim()) {
      return res.status(400).json({
        message: "Job name is required",
      });
    }

    const parsedFacilityId =
      Number(facilityId);

    if (
      !Number.isInteger(
        parsedFacilityId
      )
    ) {
      return res.status(400).json({
        message:
          "Valid facility ID is required",
      });
    }

    const job =
      await prisma.job.create({
        data: {
          jobNumber:
            jobNumber.trim(),

          name:
            name.trim(),

          description:
            description?.trim() ||
            null,

          status:
            status || "OPEN",

          startDate:
            startDate
              ? new Date(
                  startDate
                )
              : null,

          endDate:
            endDate
              ? new Date(
                  endDate
                )
              : null,

          facilityId:
            parsedFacilityId,
        },

        include: {
          facility: {
            include: {
              customer: true,
            },
          },
        },
      });

    return res
      .status(201)
      .json(job);
  } catch (error) {
    console.error(
      "Unable to create job:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to create job",
    });
  }
});
app.get("/api/jobs/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        facility: {
          include: {
            customer: true,
          },
        },
      },
    });

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    res.json(job);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Unable to retrieve job",
    });
  }
});
app.put("/api/jobs/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const {
      jobNumber,
      name,
      description,
      status,
      startDate,
      endDate,
      facilityId,
    } = req.body;

    const existingJob = await prisma.job.findUnique({
      where: { id },
    });

    if (!existingJob) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    const updatedJob = await prisma.job.update({
      where: { id },
      data: {
        jobNumber: jobNumber?.trim() || existingJob.jobNumber,
        name: name?.trim() || existingJob.name,
        description:
          description !== undefined ? description || null : existingJob.description,
        status: status || existingJob.status,
        startDate:
          startDate !== undefined
            ? startDate
              ? new Date(startDate)
              : null
            : existingJob.startDate,
        endDate:
          endDate !== undefined
            ? endDate
              ? new Date(endDate)
              : null
            : existingJob.endDate,
        facilityId: facilityId || existingJob.facilityId,
      },
      include: {
        facility: {
          include: {
            customer: true,
          },
        },
      },
    });

    res.json(updatedJob);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Unable to update job",
    });
  }
});
app.delete("/api/jobs/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const existingJob = await prisma.job.findUnique({
      where: { id },
    });

    if (!existingJob) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    await prisma.job.delete({
      where: { id },
    });

    res.json({
      message: "Job deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Unable to delete job",
    });
  }
});

app.delete("/api/customers/:id", async (req, res) => {
  try {
    const customerId =
      Number(req.params.id);

    if (!Number.isInteger(customerId)) {
      return res.status(400).json({
        message: "Invalid customer id",
      });
    }

    const customer =
      await prisma.customer.findUnique({
        where: {
          id: customerId,
        },
        include: {
          facilities: {
            include: {
              jobs: true,
            },
          },
          invoices: true,
          estimates: true,
        },
      });

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    const hasFacilities =
      customer.facilities.length > 0;

    const hasJobs =
      customer.facilities.some(
        (facility) =>
          facility.jobs.length > 0
      );

    const hasInvoices =
      customer.invoices.length > 0;

    const hasEstimates =
      customer.estimates.length > 0;

    if (
      hasFacilities ||
      hasJobs ||
      hasInvoices ||
      hasEstimates
    ) {
      return res.status(409).json({
        message:
          "This customer cannot be deleted because related facilities, jobs, estimates, or invoices still exist. Remove those records first.",
      });
    }

    await prisma.customer.delete({
      where: {
        id: customerId,
      },
    });

    return res.json({
      message:
        "Customer deleted successfully",
    });
  } catch (error) {
    console.error(
      "Unable to delete customer:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to delete customer",
    });
  }
});

app.post("/api/invoices", async (req, res) => {
  try {
    const {
      invoiceNumber,
      customerId,
      jobId,
      issueDate,
      dueDate,
      discount = 0,
      notes,
      lineItems,
    } = req.body;

    if (!invoiceNumber?.trim()) {
      return res.status(400).json({
        message: "Invoice number is required",
      });
    }

    if (!customerId) {
      return res.status(400).json({
        message: "Customer is required",
      });
    }

    if (!Array.isArray(lineItems) || lineItems.length === 0) {
      return res.status(400).json({
        message: "At least one line item is required",
      });
    }

    const calculatedItems = lineItems.map((item) => {
      const quantity = Number(item.quantity);
      const rate = Number(item.rate);

      return {
        description: item.description,
        quantity,
        rate,
        amount: quantity * rate,
      };
    });

    const subtotal = calculatedItems.reduce(
      (sum, item) => sum + item.amount,
      0
    );

    const discountAmount = Number(discount) || 0;
    const total = Math.max(subtotal - discountAmount, 0);

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: invoiceNumber.trim(),
        customerId: Number(customerId),
        jobId: jobId ? Number(jobId) : null,
        issueDate: issueDate ? new Date(issueDate) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : null,
        discount: discountAmount,
        subtotal,
        total,
        notes: notes || null,

        lineItems: {
          create: calculatedItems,
        },
      },

      include: {
        customer: true,
        job: true,
        lineItems: true,
      },
    });

    res.status(201).json(invoice);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Unable to create invoice",
    });
  }
});
app.get("/api/invoices", async (_req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        customer: true,
        job: true,
        lineItems: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(invoices);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Unable to retrieve invoices",
    });
  }
});
app.get("/api/invoices/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        job: {
          include: {
            facility: true,
          },
        },
        lineItems: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    res.json(invoice);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Unable to retrieve invoice",
    });
  }
});
app.patch("/api/invoices/:id/status", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        message: "Invalid invoice ID",
      });
    }

    const allowedStatuses = ["DRAFT", "SENT", "PAID"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid invoice status",
      });
    }

    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!existingInvoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: { status },
      include: {
        customer: true,
        job: {
          include: {
            facility: true,
          },
        },
        lineItems: true,
      },
    });

    res.json(invoice);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Unable to update invoice status",
    });
  }
});

app.delete("/api/invoices/:id", async (req, res) => {
  try {
    const invoiceId =
      Number(req.params.id);

    if (!Number.isInteger(invoiceId)) {
      return res.status(400).json({
        message: "Invalid invoice id",
      });
    }

    const invoice =
      await prisma.invoice.findUnique({
        where: {
          id: invoiceId,
        },
      });

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    await prisma.invoiceLineItem.deleteMany({
      where: {
        invoiceId,
      },
    });

    await prisma.invoice.delete({
      where: {
        id: invoiceId,
      },
    });

    return res.json({
      message:
        "Invoice deleted successfully",
    });
  } catch (error) {
    console.error(
      "Unable to delete invoice:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to delete invoice",
    });
  }
});

app.put("/api/invoices/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const {
      invoiceNumber,
      customerId,
      jobId,
      issueDate,
      dueDate,
      discount = 0,
      notes,
      lineItems,
    } = req.body;

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        message: "Invalid invoice ID",
      });
    }

    if (!invoiceNumber?.trim()) {
      return res.status(400).json({
        message: "Invoice number is required",
      });
    }

    if (!customerId) {
      return res.status(400).json({
        message: "Customer is required",
      });
    }

    if (!Array.isArray(lineItems) || lineItems.length === 0) {
      return res.status(400).json({
        message: "At least one line item is required",
      });
    }

    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!existingInvoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    const calculatedItems = lineItems.map((item) => {
      const quantity = Number(item.quantity);
      const rate = Number(item.rate);

      return {
        description: item.description.trim(),
        quantity,
        rate,
        amount: quantity * rate,
      };
    });

    const subtotal = calculatedItems.reduce(
      (sum, item) => sum + item.amount,
      0
    );

    const discountAmount = Number(discount) || 0;

    const total = Math.max(
      subtotal - discountAmount,
      0
    );

    const updatedInvoice = await prisma.invoice.update({
      where: { id },

      data: {
        invoiceNumber: invoiceNumber.trim(),

        customerId: Number(customerId),

        jobId: jobId
          ? Number(jobId)
          : null,

        issueDate: issueDate
          ? new Date(issueDate)
          : existingInvoice.issueDate,

        dueDate: dueDate
          ? new Date(dueDate)
          : null,

        subtotal,
        discount: discountAmount,
        total,

        notes: notes || null,

        lineItems: {
          deleteMany: {},

          create: calculatedItems,
        },
      },

      include: {
        customer: true,

        job: {
          include: {
            facility: true,
          },
        },

        lineItems: true,
      },
    });

    res.json(updatedInvoice);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Unable to update invoice",
    });
  }
});


app.get(
  "/api/employees",
  async (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      if (
        req.employee?.role !==
        "ADMIN"
      ) {
        return res.status(403).json({
          message:
            "Administrator access required",
        });
      }

      const employees =
        await prisma.employee.findMany({
          select: {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  mustChangePassword: true,
  mustCompleteProfile: true,

  phone: true,
  address: true,
  city: true,
  state: true,
  zipCode: true,
  startDate: true,
  emergencyContact: true,
  emergencyPhone: true,

  createdAt: true,
},

          orderBy: {
            name: "asc",
          },
        });

      return res.json(employees);
    } catch (error) {
      console.error(
        "Unable to retrieve users:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to retrieve users",
      });
    }
  }
);

app.patch(
  "/api/employees/:id/require-password-change",
  async (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      if (
        req.employee?.role !==
        "ADMIN"
      ) {
        return res.status(403).json({
          message:
            "Administrator access required",
        });
      }

      const employeeId =
        Number(req.params.id);

      if (
        !Number.isInteger(
          employeeId
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid user ID",
        });
      }

      if (
        employeeId ===
        req.employee.id
      ) {
        return res.status(400).json({
          message:
            "You cannot require a password change for your own administrator account from this screen",
        });
      }

      const existingEmployee =
        await prisma.employee.findUnique({
          where: {
            id: employeeId,
          },
        });

      if (!existingEmployee) {
        return res.status(404).json({
          message:
            "User not found",
        });
      }

      const employee =
        await prisma.employee.update({
          where: {
            id: employeeId,
          },

          data: {
            mustChangePassword:
              true,
          },

          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            mustChangePassword:
              true,
            createdAt: true,
          },
        });

      return res.json(employee);
    } catch (error) {
      console.error(
        "Unable to require password change:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to require password change",
      });
    }
  }
);

app.delete(
  "/api/employees/:id",
  async (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      if (
        req.employee?.role !==
        "ADMIN"
      ) {
        return res.status(403).json({
          message:
            "Administrator access required",
        });
      }

      const employeeId =
        Number(req.params.id);

      if (
        !Number.isInteger(
          employeeId
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid user ID",
        });
      }

      if (
        employeeId ===
        req.employee.id
      ) {
        return res.status(400).json({
          message:
            "You cannot delete your own administrator account",
        });
      }

      const existingEmployee =
        await prisma.employee.findUnique({
          where: {
            id: employeeId,
          },
        });

      if (!existingEmployee) {
        return res.status(404).json({
          message:
            "User not found",
        });
      }

      await prisma.employee.delete({
        where: {
          id: employeeId,
        },
      });

      return res.json({
        message:
          "User deleted successfully",
      });
    } catch (error) {
      console.error(
        "Unable to delete user:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to delete user",
      });
    }
  }
);

// ESTIMATES

const getNextEstimateNumber = async () => {
  const existingEstimates =
    await prisma.estimate.findMany({
      select: {
        estimateNumber: true,
      },
    });

  const highestNumber =
    existingEstimates.reduce(
      (highest, estimate) => {
        const match =
          estimate.estimateNumber.match(
            /(\d+)$/
          );

        const number =
          match
            ? Number(match[1])
            : 0;

        return Math.max(
          highest,
          number
        );
      },
      0
    );

  return `LBAC-EST-${String(
    highestNumber + 1
  ).padStart(3, "0")}`;
};

app.post("/api/estimates", async (req, res) => {
  try {
    const {
      customerId,
      jobId,
      issueDate,
      validUntil,
      discount = 0,
      notes,
      lineItems,
    } = req.body;

    const parsedCustomerId =
      Number(customerId);

    if (!Number.isInteger(parsedCustomerId)) {
      return res.status(400).json({
        message: "Customer is required",
      });
    }

    if (
      !Array.isArray(lineItems) ||
      lineItems.length === 0
    ) {
      return res.status(400).json({
        message:
          "At least one line item is required",
      });
    }

    const calculatedItems =
      lineItems.map((item) => {
        const description =
          String(
            item.description ?? ""
          ).trim();

        const quantity =
          Number(item.quantity);

        const rate =
          Number(item.rate);

        if (
          !description ||
          !Number.isFinite(quantity) ||
          quantity <= 0 ||
          !Number.isFinite(rate) ||
          rate < 0
        ) {
          throw new Error(
            "INVALID_ESTIMATE_LINE_ITEM"
          );
        }

        return {
          description,
          quantity,
          rate,
          amount:
            quantity * rate,
        };
      });

    const subtotal =
      calculatedItems.reduce(
        (sum, item) =>
          sum + item.amount,
        0
      );

    const discountAmount =
      Number(discount) || 0;

    if (discountAmount < 0) {
      return res.status(400).json({
        message:
          "Discount cannot be negative",
      });
    }

    const total =
      Math.max(
        subtotal -
          discountAmount,
        0
      );

    const estimateNumber =
      await getNextEstimateNumber();

    const estimate =
      await prisma.estimate.create({
        data: {
          estimateNumber,

          customerId:
            parsedCustomerId,

          jobId:
            jobId
              ? Number(jobId)
              : null,

          issueDate:
            issueDate
              ? new Date(issueDate)
              : new Date(),

          validUntil:
            validUntil
              ? new Date(validUntil)
              : null,

          subtotal,

          discount:
            discountAmount,

          total,

          notes:
            notes?.trim() ||
            null,

          lineItems: {
            create:
              calculatedItems,
          },
        },

        include: {
          customer: true,

          job: {
            include: {
              facility: true,
            },
          },

          lineItems: true,
        },
      });

    return res
      .status(201)
      .json(estimate);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "INVALID_ESTIMATE_LINE_ITEM"
    ) {
      return res.status(400).json({
        message:
          "Every estimate line item needs a description, a quantity greater than zero, and a non-negative rate",
      });
    }

    console.error(
      "Unable to create estimate:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to create estimate",
    });
  }
});

app.get(
  "/api/estimates",
  async (_req, res) => {
    try {
      const estimates =
        await prisma.estimate.findMany({
          include: {
            customer: true,

            job: {
              include: {
                facility: true,
              },
            },

            lineItems: true,
          },

          orderBy: {
            createdAt: "desc",
          },
        });

      return res.json(estimates);
    } catch (error) {
      console.error(
        "Unable to retrieve estimates:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to retrieve estimates",
      });
    }
  }
);

app.get(
  "/api/estimates/:id",
  async (req, res) => {
    try {
      const id =
        Number(req.params.id);

      if (!Number.isInteger(id)) {
        return res.status(400).json({
          message:
            "Invalid estimate ID",
        });
      }

      const estimate =
        await prisma.estimate.findUnique({
          where: {
            id,
          },

          include: {
            customer: true,

            job: {
              include: {
                facility: true,
              },
            },

            lineItems: true,
          },
        });

      if (!estimate) {
        return res.status(404).json({
          message:
            "Estimate not found",
        });
      }

      return res.json(estimate);
    } catch (error) {
      console.error(
        "Unable to retrieve estimate:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to retrieve estimate",
      });
    }
  }
);

app.put(
  "/api/estimates/:id",
  async (req, res) => {
    try {
      const id =
        Number(req.params.id);

      const {
        customerId,
        jobId,
        issueDate,
        validUntil,
        discount = 0,
        notes,
        lineItems,
      } = req.body;

      if (!Number.isInteger(id)) {
        return res.status(400).json({
          message:
            "Invalid estimate ID",
        });
      }

      const parsedCustomerId =
        Number(customerId);

      if (
        !Number.isInteger(
          parsedCustomerId
        )
      ) {
        return res.status(400).json({
          message:
            "Customer is required",
        });
      }

      if (
        !Array.isArray(lineItems) ||
        lineItems.length === 0
      ) {
        return res.status(400).json({
          message:
            "At least one line item is required",
        });
      }

      const existingEstimate =
        await prisma.estimate.findUnique({
          where: {
            id,
          },
        });

      if (!existingEstimate) {
        return res.status(404).json({
          message:
            "Estimate not found",
        });
      }

      const calculatedItems =
        lineItems.map((item) => {
          const description =
            String(
              item.description ?? ""
            ).trim();

          const quantity =
            Number(item.quantity);

          const rate =
            Number(item.rate);

          if (
            !description ||
            !Number.isFinite(
              quantity
            ) ||
            quantity <= 0 ||
            !Number.isFinite(rate) ||
            rate < 0
          ) {
            throw new Error(
              "INVALID_ESTIMATE_LINE_ITEM"
            );
          }

          return {
            description,
            quantity,
            rate,
            amount:
              quantity * rate,
          };
        });

      const subtotal =
        calculatedItems.reduce(
          (sum, item) =>
            sum + item.amount,
          0
        );

      const discountAmount =
        Number(discount) || 0;

      if (discountAmount < 0) {
        return res.status(400).json({
          message:
            "Discount cannot be negative",
        });
      }

      const total =
        Math.max(
          subtotal -
            discountAmount,
          0
        );

      const updatedEstimate =
        await prisma.estimate.update({
          where: {
            id,
          },

          data: {
            customerId:
              parsedCustomerId,

            jobId:
              jobId
                ? Number(jobId)
                : null,

            issueDate:
              issueDate
                ? new Date(
                    issueDate
                  )
                : existingEstimate.issueDate,

            validUntil:
              validUntil
                ? new Date(
                    validUntil
                  )
                : null,

            subtotal,

            discount:
              discountAmount,

            total,

            notes:
              notes?.trim() ||
              null,

            lineItems: {
              deleteMany: {},

              create:
                calculatedItems,
            },
          },

          include: {
            customer: true,

            job: {
              include: {
                facility: true,
              },
            },

            lineItems: true,
          },
        });

      return res.json(
        updatedEstimate
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.message ===
          "INVALID_ESTIMATE_LINE_ITEM"
      ) {
        return res.status(400).json({
          message:
            "Every estimate line item needs a description, a quantity greater than zero, and a non-negative rate",
        });
      }

      console.error(
        "Unable to update estimate:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to update estimate",
      });
    }
  }
);

app.delete(
  "/api/estimates/:id",
  async (req, res) => {
    try {
      const estimateId =
        Number(req.params.id);

      if (
        !Number.isInteger(
          estimateId
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid estimate ID",
        });
      }

      const estimate =
        await prisma.estimate.findUnique({
          where: {
            id: estimateId,
          },
        });

      if (!estimate) {
        return res.status(404).json({
          message:
            "Estimate not found",
        });
      }

      await prisma.estimate.delete({
        where: {
          id: estimateId,
        },
      });

      return res.json({
        message:
          "Estimate deleted successfully",
      });
    } catch (error) {
      console.error(
        "Unable to delete estimate:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to delete estimate",
      });
    }
  }
);

app.post("/api/facilities", async (req, res) => {
  try {
    const {
      name,
      address,
      city,
      state,
      zipCode,
      notes,
      customerId,
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        message: "Facility name is required",
      });
    }

    const parsedCustomerId =
      Number(customerId);

    if (
      !Number.isInteger(
        parsedCustomerId
      )
    ) {
      return res.status(400).json({
        message:
          "Valid customer ID is required",
      });
    }

    const facility =
      await prisma.facility.create({
        data: {
          name: name.trim(),

          address:
            address?.trim() ||
            null,

          city:
            city?.trim() ||
            null,

          state:
            state?.trim() ||
            null,

          zipCode:
            zipCode?.trim() ||
            null,

          notes:
            notes?.trim() ||
            null,

          customerId:
            parsedCustomerId,
        },

        include: {
          jobs: true,
        },
      });

    return res
      .status(201)
      .json(facility);
  } catch (error) {
    console.error(
      "Unable to create facility:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to create facility",
    });
  }
});

app.put("/api/customers/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        message: "Invalid customer id",
      });
    }

    const {
      name,
      email,
      phone,
      address,
      city,
      state,
      zipCode,
      notes,
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        message: "Customer name is required",
      });
    }

    const customer = await prisma.customer.update({
      where: {
        id,
      },

      data: {
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        city: city?.trim() || null,
        state: state?.trim() || null,
        zipCode: zipCode?.trim() || null,
        notes: notes?.trim() || null,
      },
    });

    res.json(customer);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Unable to update customer",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Longbranch server running on port ${PORT}`);
});
