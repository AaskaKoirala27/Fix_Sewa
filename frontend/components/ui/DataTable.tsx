import React from 'react';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
}

interface Props<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  emptyMessage?: string;
}

export default function DataTable<T>({ columns, data, keyField, emptyMessage = 'No records found.' }: Props<T>) {
  if (data.length === 0) {
    return <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-sm)', padding: '1.5rem' }}>{emptyMessage}</p>;
  }

  return (
    <div className="table-scroll-wrapper">
      <table className="table-custom">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={String(col.key)}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr key={String(row[keyField])}>
              {columns.map(col => (
                <td key={String(col.key)}>
                  {col.render
                    ? col.render(row)
                    : String((row as Record<string, unknown>)[String(col.key)] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
