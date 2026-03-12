import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DataTable } from '@/components/data-table';

const mockData = [
  { id: '1', name: 'Alice', email: 'alice@example.com', role: 'admin' },
  { id: '2', name: 'Bob', email: 'bob@example.com', role: 'editor' },
  { id: '3', name: 'Charlie', email: 'charlie@example.com', role: 'viewer' },
];

const mockColumns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'role', label: 'Role', sortable: false },
];

describe('DataTable', () => {
  it('should render table headers', () => {
    render(<DataTable data={mockData} columns={mockColumns} />);

    expect(screen.getByText('Name')).toBeDefined();
    expect(screen.getByText('Email')).toBeDefined();
    expect(screen.getByText('Role')).toBeDefined();
  });

  it('should render data rows', () => {
    render(<DataTable data={mockData} columns={mockColumns} />);

    expect(screen.getByText('Alice')).toBeDefined();
    expect(screen.getByText('bob@example.com')).toBeDefined();
  });

  it('should show empty state when no data', () => {
    render(<DataTable data={[]} columns={mockColumns} />);

    expect(screen.getByText('No results found')).toBeDefined();
  });
});
