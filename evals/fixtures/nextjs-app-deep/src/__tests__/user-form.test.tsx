import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserForm } from '@/components/user-form';

describe('UserForm', () => {
  it('should render all form fields', () => {
    render(<UserForm onSubmit={() => {}} />);

    expect(screen.getByPlaceholderText('Enter name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
    expect(screen.getByText('Submit')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should render with initial data', () => {
    const initialData = { name: 'Alice', email: 'alice@acme.com', role: 'admin' };
    render(<UserForm onSubmit={() => {}} initialData={initialData} />);

    expect(screen.getByDisplayValue('Alice')).toBeInTheDocument();
    expect(screen.getByDisplayValue('alice@acme.com')).toBeInTheDocument();
  });

  it('should call onSubmit with form data when fields are valid', async () => {
    const handleSubmit = vi.fn();
    const user = userEvent.setup();

    render(<UserForm onSubmit={handleSubmit} />);

    await user.type(screen.getByPlaceholderText('Enter name'), 'Bob');
    await user.type(screen.getByPlaceholderText('Enter email'), 'bob@acme.com');
    await user.click(screen.getByText('Submit'));

    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Bob',
        email: 'bob@acme.com',
        role: 'viewer',
      })
    );
  });

  it('should not submit when name is too short', async () => {
    const handleSubmit = vi.fn();
    const user = userEvent.setup();

    render(<UserForm onSubmit={handleSubmit} />);

    await user.type(screen.getByPlaceholderText('Enter name'), 'A');
    await user.type(screen.getByPlaceholderText('Enter email'), 'a@b.com');
    await user.click(screen.getByText('Submit'));

    expect(handleSubmit).not.toHaveBeenCalled();
  });
});
