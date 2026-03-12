'use client';

import { useState, type ReactNode } from 'react';

interface DataTableField {
  key: string;
  label: string;
  sortable?: boolean;
  renderCell?: (value: unknown, row: Record<string, unknown>) => ReactNode;
}

interface DataTableProps {
  data: Array<Record<string, unknown>>;
  fields: Array<DataTableField>;
  pageSize?: number;
  onRowClick?: (row: Record<string, unknown>) => void;
}

export function DataTable({ data, fields, pageSize = 10, onRowClick }: DataTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = data.filter((row) =>
    fields.some((field) => {
      const value = row[field.key];
      return String(value).toLowerCase().includes(searchQuery.toLowerCase());
    })
  );

  const sortedData = sortField
    ? [...filteredData].sort((a, b) => {
        const aVal = String(a[sortField] ?? '');
        const bVal = String(b[sortField] ?? '');
        const comparison = aVal.localeCompare(bVal);
        return sortDirection === 'asc' ? comparison : -comparison;
      })
    : filteredData;

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = sortedData.slice(startIndex, startIndex + pageSize);

  const handleSort = (fieldKey: string) => {
    if (sortField === fieldKey) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(fieldKey);
      setSortDirection('asc');
    }
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-sm px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-primary/5 border-b dark:bg-primary/10">
              {fields.map((field) => (
                <th
                  key={field.key}
                  className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer select-none hover:text-foreground transition-colors"
                  onClick={() => field.sortable !== false && handleSort(field.key)}
                >
                  <div className="flex items-center gap-1">
                    {field.label}
                    {sortField === field.key && (
                      <span className="text-primary font-semibold">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={fields.length} className="px-4 py-8 text-center text-muted-foreground">
                  No results found
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="border-b last:border-b-0 hover:bg-primary/5 cursor-pointer transition-colors"
                  onClick={() => onRowClick?.(row)}
                >
                  {fields.map((field) => (
                    <td key={field.key} className="px-4 py-3 text-sm text-foreground">
                      {field.renderCell
                        ? field.renderCell(row[field.key], row)
                        : String(row[field.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(startIndex + pageSize, sortedData.length)} of{' '}
            {sortedData.length} results
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 hover:bg-primary/5 transition-colors"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 text-sm border rounded-md transition-colors ${
                  currentPage === page
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'hover:bg-primary/5 hover:border-primary/30'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 hover:bg-primary/5 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
