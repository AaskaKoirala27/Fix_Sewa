'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { Invoice } from '@/lib/types';
import StatusBadge from '@/components/ui/StatusBadge';

function fmt(dt: string) {
  return new Date(dt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function InvoiceReceiptPage({ params }: { params: { id: string } }) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Invoice>(`/invoices/${params.id}/receipt/`).then(r => setInvoice(r.data)).finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <p style={{ color: 'var(--color-text-muted)', padding: '2rem' }}>Loading…</p>;
  if (!invoice) return <p style={{ padding: '2rem' }}>Invoice not found.</p>;

  const balance = parseFloat(invoice.total) - parseFloat(invoice.amount_paid);

  return (
    <>
      {/* Print / action buttons (hidden on print) */}
      <div className="no-print" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
        <button className="btn-primary-custom" onClick={() => window.print()}>🖨 Print Receipt</button>
        <a href="/pos/invoices" className="btn-secondary-custom">Back to Invoices</a>
        <a href="/pos" className="btn-secondary-custom">New Sale</a>
      </div>

      {/* Receipt */}
      <div style={{ maxWidth: 640, margin: '0 auto', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '2.5rem' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem', borderBottom: '2px solid var(--color-border)', paddingBottom: '1.5rem' }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--font-xl)', fontWeight: 600, margin: '0 0 4px' }}>Fix Sewa</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-sm)', margin: 0 }}>Receipt</p>
        </div>

        {/* Invoice meta */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1rem', marginBottom: '1.5rem', fontSize: 'var(--font-sm)' }}>
          <div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>Invoice No</div>
            <div style={{ fontWeight: 700 }}>{invoice.invoice_no}</div>
          </div>
          <div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>Date</div>
            <div>{fmt(invoice.created_at)}</div>
          </div>
          <div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>Client</div>
            <div>{invoice.client_name}</div>
          </div>
          <div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>Status</div>
            <div><StatusBadge status={invoice.status} /></div>
          </div>
          {invoice.client_email && (
            <div style={{ gridColumn: '1/-1' }}>
              <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>Email</div>
              <div>{invoice.client_email}</div>
            </div>
          )}
        </div>

        {/* Line items */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem', fontSize: 'var(--font-sm)' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
              <th style={{ textAlign: 'left', padding: '8px 0', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 'var(--font-xs)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Item</th>
              <th style={{ textAlign: 'center', padding: '8px 0', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 'var(--font-xs)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Qty</th>
              <th style={{ textAlign: 'right', padding: '8px 0', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 'var(--font-xs)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Price</th>
              <th style={{ textAlign: 'right', padding: '8px 0', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 'var(--font-xs)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '10px 0' }}>{item.description}</td>
                <td style={{ padding: '10px 0', textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ padding: '10px 0', textAlign: 'right' }}>${parseFloat(item.unit_price).toFixed(2)}</td>
                <td style={{ padding: '10px 0', textAlign: 'right' }}>${parseFloat(item.line_total).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ marginLeft: 'auto', maxWidth: 240 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)' }}>
            <span>Subtotal</span><span>${invoice.subtotal}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)' }}>
            <span>Tax ({invoice.tax_rate}%)</span><span>${invoice.tax_amount}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontWeight: 700, fontSize: 'var(--font-md)', borderTop: '2px solid var(--color-border)', marginTop: 4 }}>
            <span>Total</span><span>${invoice.total}</span>
          </div>
          {parseFloat(invoice.amount_paid) > 0 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 'var(--font-sm)', color: 'var(--color-success)' }}>
                <span>Paid</span><span>${invoice.amount_paid}</span>
              </div>
              {balance > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 'var(--font-sm)', color: 'var(--color-danger)', fontWeight: 600 }}>
                  <span>Balance Due</span><span>${balance.toFixed(2)}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Payment history */}
        {invoice.payments.length > 0 && (
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
            <h3 style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: '0.5rem' }}>Payment History</h3>
            {invoice.payments.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)', padding: '4px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span>{new Date(p.paid_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} · {p.method}</span>
                <strong>${p.amount}</strong>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: 'var(--font-xs)' }}>
          Thank you for your business
        </div>
      </div>
    </>
  );
}
