interface Props {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
}

export default function StatCard({ label, value, sub, icon, iconBg = '#f0f8f4', iconColor = 'var(--color-accent)' }: Props) {
  return (
    <div className="stat-card">
      {icon && (
        <div
          className="stat-icon"
          style={{ background: iconBg, color: iconColor }}
        >
          {icon}
        </div>
      )}
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}
