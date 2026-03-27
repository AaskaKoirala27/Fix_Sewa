'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import type { Product, Invoice } from '@/lib/types';
import StatusBadge from '@/components/ui/StatusBadge';

interface LineItem {
  product: Product;
  quantity: number;
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<LineItem[]>([]);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [search, setSearch] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [creating, setCreating] = useState(false);
  const [charging, setCharging] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/products/?is_active=true').then(r => {
      setProducts(Array.isArray(r.data) ? r.data : r.data.results ?? []);
    });
  }, []);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  function addToCart(product: Product) {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product, quantity: 1 }];
    });
  }

  function removeFromCart(productId: number) {
    setCart(prev => prev.filter(i => i.product.id !== productId));
  }

  function updateQty(productId: number, qty: number) {
    if (qty < 1) { removeFromCart(productId); return; }
    setCart(prev => prev.map(i => i.product.id === productId ? { ...i, quantity: qty } : i));
  }

  const subtotal = cart.reduce((sum, i) => sum + parseFloat(i.product.price) * i.quantity, 0);

  async function handleCreateInvoice() {
    if (!clientName.trim()) { setMessage('Client name is required'); return; }
    if (cart.length === 0) { setMessage('Add at least one item to the cart'); return; }
    setCreating(true);
    setMessage('');
    try {
      // Create invoice
      const { data: inv } = await api.post<Invoice>('/invoices/', {
        client_name: clientName,
        client_email: clientEmail,
        status: 'pending',
      });
      // Add items
      for (const item of cart) {
        await api.post(`/invoices/${inv.id}/add_item/`, {
          product: item.product.id,
          quantity: item.quantity,
        });
      }
      // Fetch final invoice
      const { data: final } = await api.get<Invoice>(`/invoices/${inv.id}/`);
      setInvoice(final);
      setPaymentAmount(final.total);
    } catch {
      setMessage('Failed to create invoice. Please try again.');
    } finally {
      setCreating(false);
    }
  }

  async function handleCharge() {
    if (!invoice) return;
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) { setMessage('Enter a valid payment amount'); return; }
    setCharging(true);
    setMessage('');
    try {
      await api.post(`/invoices/${invoice.id}/record_payment/`, {
        amount: paymentAmount,
        method: paymentMethod,
      });
      const { data: updated } = await api.get<Invoice>(`/invoices/${invoice.id}/`);
      setInvoice(updated);
      if (updated.status === 'paid') {
        setMessage('Payment complete!');
        setCart([]);
        setClientName('');
        setClientEmail('');
        setTimeout(() => {
          window.open(`/pos/invoices/${updated.id}`, '_blank');
        }, 500);
      }
    } catch {
      setMessage('Payment failed. Please try again.');
    } finally {
      setCharging(false);
    }
  }

  function handleNewSale() {
    setInvoice(null);
    setCart([]);
    setClientName('');
    setClientEmail('');
    setPaymentAmount('');
    setMessage('');
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', alignItems: 'start' }}>
      {/* Left: Product grid */}
      <div>
        <div className="page-header" style={{ marginBottom: '1rem' }}>
          <h1 className="page-title">POS Terminal</h1>
        </div>

        <input
          className="form-input"
          style={{ marginBottom: '1rem', maxWidth: '100%' }}
          placeholder="Search products & services…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
          {filtered.map(p => (
            <button
              key={p.id}
              onClick={() => addToCart(p)}
              style={{
                background: 'var(--color-surface)',
                border: '1.5px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '1rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all .2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
            >
              <div style={{ fontSize: 'var(--font-sm)', fontWeight: 600, marginBottom: 4 }}>{p.name}</div>
              <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-muted)', marginBottom: 8 }}>
                {p.category === 'product' ? `Stock: ${p.stock_qty}` : 'Service'}
              </div>
              <div style={{ fontSize: 'var(--font-md)', fontWeight: 700, color: 'var(--color-accent)' }}>
                ${parseFloat(p.price).toFixed(2)}
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <p style={{ color: 'var(--color-text-muted)', gridColumn: '1/-1' }}>No products found.</p>
          )}
        </div>
      </div>

      {/* Right: Cart + checkout */}
      <div style={{ position: 'sticky', top: '1.5rem' }}>
        <div className="card-custom">
          <div className="card-header-custom">
            <h2>Current Sale</h2>
            {invoice && <StatusBadge status={invoice.status} />}
          </div>
          <div className="card-body-custom">
            {message && (
              <div className={message.includes('complete') ? 'login-success' : 'login-error'} style={{ marginBottom: '1rem' }}>
                {message}
              </div>
            )}

            {!invoice ? (
              <>
                {/* Client */}
                <div className="form-custom">
                  <div className="form-group">
                    <label>Client Name *</label>
                    <input className="form-input" type="text" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Walk-in client" />
                  </div>
                  <div className="form-group">
                    <label>Client Email</label>
                    <input className="form-input" type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="optional@email.com" />
                  </div>
                </div>

                {/* Cart items */}
                {cart.length === 0 ? (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-sm)', textAlign: 'center', padding: '1rem 0' }}>
                    Tap products to add them
                  </p>
                ) : (
                  <div style={{ marginBottom: '1rem' }}>
                    {cart.map(item => (
                      <div key={item.product.id} style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '8px 0', borderBottom: '1px solid var(--color-border)',
                      }}>
                        <div style={{ flex: 1, fontSize: 'var(--font-sm)' }}>
                          {item.product.name}
                          <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-xs)' }}>
                            ${parseFloat(item.product.price).toFixed(2)} each
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <button onClick={() => updateQty(item.product.id, item.quantity - 1)} style={{ width: 24, height: 24, border: '1px solid var(--color-border)', borderRadius: 4, cursor: 'pointer', background: 'none' }}>−</button>
                          <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600, minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                          <button onClick={() => updateQty(item.product.id, item.quantity + 1)} style={{ width: 24, height: 24, border: '1px solid var(--color-border)', borderRadius: 4, cursor: 'pointer', background: 'none' }}>+</button>
                        </div>
                        <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)', minWidth: 60, textAlign: 'right' }}>
                          ${(parseFloat(item.product.price) * item.quantity).toFixed(2)}
                        </div>
                        <button onClick={() => removeFromCart(item.product.id)} style={{ color: 'var(--color-danger)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}>×</button>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ borderTop: '2px solid var(--color-border)', paddingTop: '1rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 'var(--font-md)' }}>
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  className="btn-primary-custom"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={handleCreateInvoice}
                  disabled={creating || cart.length === 0}
                >
                  {creating ? 'Creating Invoice…' : 'Create Invoice'}
                </button>
              </>
            ) : (
              <>
                {/* Invoice summary */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-sm)' }}>Invoice</span>
                    <strong>{invoice.invoice_no}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-sm)' }}>Subtotal</span>
                    <span>${invoice.subtotal}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-sm)' }}>Tax</span>
                    <span>${invoice.tax_amount}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 'var(--font-md)', borderTop: '2px solid var(--color-border)', paddingTop: 8 }}>
                    <span>Total</span>
                    <span>${invoice.total}</span>
                  </div>
                  {parseFloat(invoice.amount_paid) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-success)', marginTop: 4 }}>
                      <span style={{ fontSize: 'var(--font-sm)' }}>Paid</span>
                      <span>${invoice.amount_paid}</span>
                    </div>
                  )}
                </div>

                {invoice.status !== 'paid' && (
                  <div className="form-custom" style={{ marginBottom: '1rem' }}>
                    <div className="form-group">
                      <label>Payment Amount</label>
                      <input className="form-input" type="number" step="0.01" min="0" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Method</label>
                      <select className="form-input" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as 'cash' | 'card')}>
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                      </select>
                    </div>
                    <button
                      className="btn-primary-custom"
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={handleCharge}
                      disabled={charging}
                    >
                      {charging ? 'Processing…' : `Charge $${parseFloat(paymentAmount || '0').toFixed(2)}`}
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <a href={`/pos/invoices/${invoice.id}`} target="_blank" className="btn-secondary-custom btn-sm-custom">
                    View Receipt
                  </a>
                  <button className="btn-secondary-custom btn-sm-custom" onClick={handleNewSale}>
                    New Sale
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
