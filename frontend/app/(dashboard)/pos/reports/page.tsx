'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import api from '@/lib/api';
import type { SalesReport } from '@/lib/types';
import StatCard from '@/components/ui/StatCard';

// SSR-safe recharts import
const AreaChart = dynamic(() => import('recharts').then(m => m.AreaChart), { ssr: false });
const Area = dynamic(() => import('recharts').then(m => m.Area), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(m => m.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false });

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ReportsPage() {
  const [report, setReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));

  async function loadReport() {
    setLoading(true);
    try {
      const { data } = await api.get<SalesReport>('/pos/reports/', { params: { from: dateFrom, to: dateTo } });
      setReport(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadReport(); }, [dateFrom, dateTo]);

  function handleExportCSV() {
    const url = `http://localhost:8000/api/pos/reports/?format=csv&from=${dateFrom}&to=${dateTo}`;
    window.open(url, '_blank');
  }

  if (loading) return <p style={{ color: 'var(--color-text-muted)' }}>Loading reports…</p>;
  if (!report) return null;

  const chartData = report.daily_revenue.map(d => ({
    date: fmtDate(d.date),
    revenue: parseFloat(d.revenue),
  }));

  const totalCash = parseFloat(report.payment_breakdown.cash);
  const totalCard = parseFloat(report.payment_breakdown.card);
  const totalPayments = totalCash + totalCard;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales Reports</h1>
          <p className="page-subtitle">Revenue analytics and export</p>
        </div>
        <div className="btn-group-custom">
          <button className="btn-secondary-custom" onClick={handleExportCSV}>
            ↓ Export CSV
          </button>
        </div>
      </div>

      {/* Date range filter */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>From</label>
          <input className="form-input" style={{ maxWidth: 160 }} type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>To</label>
          <input className="form-input" style={{ maxWidth: 160 }} type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
      </div>

      {/* Revenue stat cards */}
      <div className="stats-grid">
        <StatCard label="Today's Revenue" value={`$${parseFloat(report.revenue_today).toFixed(2)}`} icon="💰" />
        <StatCard label="This Week" value={`$${parseFloat(report.revenue_this_week).toFixed(2)}`} icon="📈" iconBg="#e8f4fd" iconColor="#1a6fa3" />
        <StatCard label="This Month" value={`$${parseFloat(report.revenue_this_month).toFixed(2)}`} icon="📆" iconBg="#e9f7ef" iconColor="#1e8449" />
        <StatCard
          label="Cash vs Card"
          value={totalPayments > 0 ? `${Math.round(totalCash / totalPayments * 100)}% Cash` : '—'}
          sub={`Cash $${totalCash.toFixed(2)} · Card $${totalCard.toFixed(2)}`}
          icon="💳"
          iconBg="#fef5e7"
          iconColor="#9a7d0a"
        />
      </div>

      {/* Revenue chart */}
      <div className="card-custom">
        <div className="card-header-custom">
          <h2>Daily Revenue (Last 30 Days)</h2>
        </div>
        <div className="card-body-custom">
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2d6a4f" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2d6a4f" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} tickLine={false} interval={4} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip formatter={(v) => [`$${Number(v).toFixed(2)}`, 'Revenue']} contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 13 }} />
                <Area type="monotone" dataKey="revenue" stroke="#2d6a4f" strokeWidth={2} fill="url(#revenueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top services */}
      {report.top_services.length > 0 && (
        <div className="card-custom">
          <div className="card-header-custom"><h2>Top Services / Products</h2></div>
          <div className="card-body-custom" style={{ padding: 0 }}>
            <div className="table-scroll-wrapper">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Count</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {report.top_services.map((s, i) => (
                    <tr key={s.name}>
                      <td style={{ color: 'var(--color-text-muted)' }}>{i + 1}</td>
                      <td><strong>{s.name}</strong></td>
                      <td>{s.count}</td>
                      <td>${parseFloat(s.revenue).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
