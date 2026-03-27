type StatusType =
  | 'Scheduled' | 'Completed' | 'Cancelled' | 'No-Show'
  | 'active' | 'inactive'
  | 'paid' | 'pending' | 'draft' | 'partial' | 'void';

const CLASS_MAP: Record<string, string> = {
  scheduled: 'badge-scheduled',
  completed: 'badge-completed',
  cancelled: 'badge-cancelled',
  'no-show':  'badge-noshow',
  active:     'badge-active',
  inactive:   'badge-inactive',
  paid:       'badge-paid',
  pending:    'badge-pending',
  draft:      'badge-draft',
  partial:    'badge-partial',
  void:       'badge-void',
};

interface Props {
  status: string;
  label?: string;
}

export default function StatusBadge({ status, label }: Props) {
  const key = status.toLowerCase();
  const cls = CLASS_MAP[key] ?? 'badge-default';
  return (
    <span className={`badge-status ${cls}`}>
      {label ?? status}
    </span>
  );
}
