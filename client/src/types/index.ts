export type Customer = {
  id: number;
 name: string;
email?: string | null;
phone?: string | null;
address?: string | null;
city?: string | null;
state?: string | null;
zipCode?: string | null;
notes?: string | null;

  facilities?: {
    id: number;
    name: string;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    zipCode?: string | null;

    jobs?: {
      id: number;
      jobNumber: string;
      name: string;
      status?: string;
    }[];
  }[];
};

export type Job = {
  id: number;
  jobNumber: string;
  name: string;
  description?: string | null;
  status?: string;
  startDate?: string | null;
  endDate?: string | null;

  facilityId?: number;

  facility?: {
    id: number;
    name: string;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    zipCode?: string | null;

    customer?: {
      id: number;
      name: string;
    };
  };
};
export type Invoice = {
  id: number;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string | null;
  status: string;
  subtotal: string;
  discount: string;
  total: string;
  notes: string | null;

  customer: {
    id: number;
    name: string;
    email?: string | null;
    phone?: string | null;
  };

  job: {
    id: number;
    jobNumber: string;
    name: string;

    facility?: {
      id: number;
      name: string;
      address?: string | null;
      city?: string | null;
      state?: string | null;
      zipCode?: string | null;

      customer?: {
        id: number;
        name: string;
      };
    };
  } | null;

  lineItems?: {
    id: number;
    description: string;
    quantity: string;
    rate: string;
    amount: string;
  }[];
};

export type LineItem = {
  description: string;
  quantity: string;
  rate: string;
};