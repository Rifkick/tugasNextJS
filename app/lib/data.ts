import postgres from 'postgres';
import {
  CustomerField,
  CustomersTableType,
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
  Revenue,
} from './definitions';
import { formatCurrency } from './utils';

/* =============================
   DATABASE CONNECTION
============================= */
const sql = postgres(process.env.DATABASE_URL!, {
  ssl: 'require',
});

/* =============================
   FETCH REVENUE
============================= */
export async function fetchRevenue() {
  try {
    const data = await sql<Revenue[]>`
      SELECT * FROM public.revenue
    `;
    return data;
  } catch (error) {
    console.error('Database Error:', error);
    return []; // ⬅️ jangan crash app
  }
}

/* =============================
   LATEST INVOICES
============================= */
export async function fetchLatestInvoices() {
  try {
    const data = await sql<LatestInvoiceRaw[]>`
      SELECT
        invoices.id,
        invoices.amount,
        customers.name,
        customers.email,
        customers.image_url
      FROM public.invoices
      JOIN public.customers
        ON invoices.customer_id = customers.id
      ORDER BY invoices.date DESC
      LIMIT 5
    `;

    return data.map((invoice) => ({
      ...invoice,
      amount: formatCurrency(invoice.amount),
    }));
  } catch (error) {
    console.error('Database Error:', error);
    return [];
  }
}

/* =============================
   DASHBOARD CARD DATA
============================= */
export async function fetchCardData() {
  try {
    const invoiceCountPromise =
      sql`SELECT COUNT(*) FROM public.invoices`;
    const customerCountPromise =
      sql`SELECT COUNT(*) FROM public.customers`;
    const invoiceStatusPromise = sql`
      SELECT
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS paid,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS pending
      FROM public.invoices
    `;

    const [invoices, customers, status] = await Promise.all([
      invoiceCountPromise,
      customerCountPromise,
      invoiceStatusPromise,
    ]);

    return {
      numberOfInvoices: Number(invoices[0].count),
      numberOfCustomers: Number(customers[0].count),
      totalPaidInvoices: formatCurrency(status[0].paid ?? 0),
      totalPendingInvoices: formatCurrency(status[0].pending ?? 0),
    };
  } catch (error) {
    console.error('Database Error:', error);
    return {
      numberOfInvoices: 0,
      numberOfCustomers: 0,
      totalPaidInvoices: formatCurrency(0),
      totalPendingInvoices: formatCurrency(0),
    };
  }
}

/* =============================
   FILTERED INVOICES
============================= */
const ITEMS_PER_PAGE = 6;

export async function fetchFilteredInvoices(
  query: string,
  currentPage: number,
) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const data = await sql<InvoicesTable[]>`
      SELECT
        invoices.id,
        invoices.amount,
        invoices.date,
        invoices.status,
        customers.name,
        customers.email,
        customers.image_url
      FROM public.invoices
      JOIN public.customers
        ON invoices.customer_id = customers.id
      WHERE
        customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`} OR
        invoices.amount::text ILIKE ${`%${query}%`} OR
        invoices.status ILIKE ${`%${query}%`}
      ORDER BY invoices.date DESC
      LIMIT ${ITEMS_PER_PAGE}
      OFFSET ${offset}
    `;
    return data;
  } catch (error) {
    console.error('Database Error:', error);
    return [];
  }
}

/* =============================
   INVOICE BY ID
============================= */
export async function fetchInvoiceById(id: string) {
  try {
    const data = await sql<InvoiceForm[]>`
      SELECT
        id,
        customer_id,
        amount,
        status
      FROM public.invoices
      WHERE id = ${id}
    `;

    return {
      ...data[0],
      amount: data[0].amount / 100,
    };
  } catch (error) {
    console.error('Database Error:', error);
    return null;
  }
}

/* =============================
   CUSTOMERS
============================= */
export async function fetchCustomers() {
  try {
    return await sql<CustomerField[]>`
      SELECT id, name
      FROM public.customers
      ORDER BY name ASC
    `;
  } catch (error) {
    console.error('Database Error:', error);
    return [];
  }
}

export async function fetchFilteredCustomers(query: string) {
  try {
    const data = await sql<CustomersTableType[]>`
      SELECT
        customers.id,
        customers.name,
        customers.email,
        customers.image_url,
        COUNT(invoices.id) AS total_invoices,
        SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) AS total_pending,
        SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END) AS total_paid
      FROM public.customers
      LEFT JOIN public.invoices
        ON customers.id = invoices.customer_id
      WHERE
        customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`}
      GROUP BY
        customers.id,
        customers.name,
        customers.email,
        customers.image_url
      ORDER BY customers.name ASC
    `;

    return data.map((c) => ({
      ...c,
      total_pending: formatCurrency(c.total_pending ?? 0),
      total_paid: formatCurrency(c.total_paid ?? 0),
    }));
  } catch (error) {
    console.error('Database Error:', error);
    return [];
  }
}
