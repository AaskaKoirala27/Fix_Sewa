'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import type { Product } from '@/lib/types';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', price: '', category: 'service', stock_qty: '0', is_active: true });
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  async function loadData() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (category) params.category = category;
      const { data } = await api.get('/products/', { params });
      setProducts(Array.isArray(data) ? data : data.results ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, [search, category]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.price) { setApiError('Name and price are required'); return; }
    setSubmitting(true);
    setApiError('');
    try {
      const { data } = await api.post<Product>('/products/', { ...form, price: form.price, stock_qty: Number(form.stock_qty) });
      setProducts(prev => [data, ...prev]);
      setShowForm(false);
      setForm({ name: '', description: '', price: '', category: 'service', stock_qty: '0', is_active: true });
    } catch (err: unknown) {
      const d = (err as { response?: { data?: Record<string, string[]> } })?.response?.data;
      setApiError(d ? Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ') : 'Failed to create product.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this product?')) return;
    await api.delete(`/products/${id}/`);
    setProducts(prev => prev.filter(p => p.id !== id));
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Products & Services</h1>
          <p className="page-subtitle">Manage your product and service catalog</p>
        </div>
        <div className="btn-group-custom">
          <button className="btn-primary-custom" onClick={() => setShowForm(s => !s)}>
            {showForm ? 'Cancel' : '+ New Product'}
          </button>
          <Link href="/pos" className="btn-secondary-custom">POS Terminal</Link>
        </div>
      </div>

      {showForm && (
        <div className="card-custom">
          <div className="card-header-custom"><h2>Add Product / Service</h2></div>
          <div className="card-body-custom">
            {apiError && <div className="login-error" style={{ marginBottom: '1rem' }}>{apiError}</div>}
            <form className="form-custom" onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0 1.5rem' }}>
                <div className="form-group">
                  <label>Name *</label>
                  <input className="form-input" type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Product/service name" required />
                </div>
                <div className="form-group">
                  <label>Price *</label>
                  <input className="form-input" type="number" step="0.01" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" required />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select className="form-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    <option value="service">Service</option>
                    <option value="product">Physical Product</option>
                  </select>
                </div>
                {form.category === 'product' && (
                  <div className="form-group">
                    <label>Stock Quantity</label>
                    <input className="form-input" type="number" min="0" value={form.stock_qty} onChange={e => setForm(f => ({ ...f, stock_qty: e.target.value }))} />
                  </div>
                )}
                <div className="form-group">
                  <label>Status</label>
                  <select className="form-input" value={form.is_active ? 'true' : 'false'} onChange={e => setForm(f => ({ ...f, is_active: e.target.value === 'true' }))}>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea className="form-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" rows={2} />
              </div>
              <button type="submit" className="btn-primary-custom btn-sm-custom" disabled={submitting}>
                {submitting ? 'Creating…' : 'Add Product'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input className="form-input" style={{ maxWidth: 280 }} placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="form-input" style={{ maxWidth: 180 }} value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">All categories</option>
          <option value="service">Services</option>
          <option value="product">Physical Products</option>
        </select>
      </div>

      <div className="card-custom">
        <div className="card-body-custom" style={{ padding: 0 }}>
          {loading ? (
            <p style={{ padding: '1.5rem', color: 'var(--color-text-muted)' }}>Loading…</p>
          ) : products.length === 0 ? (
            <EmptyState icon="🛍" title="No products found" description="Add your first product or service." />
          ) : (
            <div className="table-scroll-wrapper">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id}>
                      <td>
                        <strong>{p.name}</strong>
                        {p.description && <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-xs)' }}>{p.description.slice(0, 60)}</div>}
                      </td>
                      <td>{p.category}</td>
                      <td>${parseFloat(p.price).toFixed(2)}</td>
                      <td>{p.category === 'product' ? p.stock_qty : '—'}</td>
                      <td><StatusBadge status={p.is_active ? 'active' : 'inactive'} label={p.is_active ? 'Active' : 'Inactive'} /></td>
                      <td>
                        <div className="action-links">
                          <a className="action-danger" href="#" onClick={e => { e.preventDefault(); handleDelete(p.id); }}>Delete</a>
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
