'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import type { Invoice } from '@/lib/types';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';

function fmt(dt: string) {
  return new Date(dt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (statusFilter) params.status = statusFilter;
    if (search) params.search = search;
    api.get('/invoices/', { params })
      .then(r => setInvoices(Array.isArray(r.data) ? r.data : r.data.results ?? []))
      .finally(() => setLoading(false));
  }, [statusFilter, search]);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-subtitle">View and manage all invoices</p>
        </div>
        <Link href="/pos" className="btn-primary-custom">Open POS</Link>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input className="form-input" style={{ maxWidth: 280 }} placeholder="Search invoice no, client…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="form-input" style={{ maxWidth: 180 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
          <option value="void">Void</option>
        </select>
      </div>

      <div className="card-custom">
        <div className="card-body-custom" style={{ padding: 0 }}>
          {loading ? (
            <p style={{ padding: '1.5rem', color: 'var(--color-text-muted)' }}>Loading…</p>
          ) : invoices.length === 0 ? (
            <EmptyState icon="🧾" title="No invoices found" description="Use the POS terminal to create invoices." />
          ) : (
            <div className="table-scroll-wrapper">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>Invoice No</th>
                    <th>Client</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Paid</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv => (
                    <tr key={inv.id}>
                      <td><strong>{inv.invoice_no}</strong></td>
                      <td>{inv.client_name}</td>
                      <td>{fmt(inv.created_at)}</td>
                      <td>${inv.total}</td>
                      <td>${inv.amount_paid}</td>
                      <td><StatusBadge status={inv.status} /></td>
                      <td>
                        <div className="action-links">
                          <Link href={`/pos/invoices/${inv.id}`}>Receipt</Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
