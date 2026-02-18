// ── Auth & Users ───────────────────────────────────────────────────────────────

export interface Role {
  id: number;
  role_name: string;
  description: string;
  is_active: boolean;
}

export interface Menu {
  id: number;
  menu_name: string;
  url: string;
  display_order: number;
  is_active: boolean;
  icon: string;
}

export interface User {
  id: string;
  full_name: string;
  username: string;
  email: string;
  is_active: boolean;
  is_approved: boolean;
  created_at: string;
  roles: Role[];
  menus: Menu[];
}

// ── Staff ──────────────────────────────────────────────────────────────────────

export interface Staff {
  id: number;
  full_name: string;
  email: string;
  phone_number: string;
  specialty: string;
  is_active: boolean;
}

// ── Appointments ───────────────────────────────────────────────────────────────

export type AppointmentStatus = 'Scheduled' | 'Completed' | 'Cancelled' | 'No-Show';

export interface Appointment {
  id: number;
  staff: number;
  staff_name: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  start_time: string;
  duration_minutes: number;
  status: AppointmentStatus;
  notes: string;
  created_at: string;
  updated_at: string;
}

// ── POS: Products ─────────────────────────────────────────────────────────────

export type ProductCategory = 'service' | 'product';

export interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  category: ProductCategory;
  stock_qty: number;
  is_active: boolean;
  created_at: string;
}

// ── POS: Invoice Items ─────────────────────────────────────────────────────────

export interface InvoiceItem {
  id: number;
  product: number;
  description: string;
  unit_price: string;
  quantity: number;
  line_total: string;
}

// ── POS: Payments ──────────────────────────────────────────────────────────────

export type PaymentMethod = 'cash' | 'card';

export interface Payment {
  id: number;
  invoice: number;
  amount: string;
  method: PaymentMethod;
  reference: string;
  paid_at: string;
  recorded_by: string;
  recorded_by_name: string;
}

// ── POS: Invoices ──────────────────────────────────────────────────────────────

export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'partial' | 'void';

export interface Invoice {
  id: number;
  invoice_no: string;
  appointment: number | null;
  client_name: string;
  client_email: string;
  subtotal: string;
  tax_rate: string;
  tax_amount: string;
  total: string;
  amount_paid: string;
  status: InvoiceStatus;
  notes: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  items: InvoiceItem[];
  payments: Payment[];
}

// ── Dashboard Stats ────────────────────────────────────────────────────────────

export interface DashboardStats {
  total_appointments: number;
  scheduled_appointments: number;
  completed_appointments: number;
  cancelled_appointments: number;
  today_appointments: number;
  total_staff: number;
  active_staff: number;
  total_users: number;
  active_users: number;
  pending_approvals: number;
  recent_appointments: Appointment[];
}

// ── POS Reports ────────────────────────────────────────────────────────────────

export interface DailyRevenue {
  date: string;
  revenue: string;
}

export interface TopService {
  name: string;
  count: number;
  revenue: string;
}

export interface SalesReport {
  revenue_today: string;
  revenue_this_week: string;
  revenue_this_month: string;
  daily_revenue: DailyRevenue[];
  top_services: TopService[];
  payment_breakdown: { cash: string; card: string };
}

// ── API Responses ──────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  detail?: string;
  [key: string]: unknown;
}
