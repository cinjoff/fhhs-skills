'use client';

import { useState, FormEvent } from 'react';

interface FormData {
  name: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
}

// VIOLATION: `as any` assertions instead of proper type guards
export function UserForm({ onSubmit }: { onSubmit: (data: FormData) => void }) {
  const [formState, setFormState] = useState<FormData>({
    name: '',
    email: '',
    role: 'user',
  });

  const handleChange = (e: FormEvent) => {
    const target = e.target as any;
    const value = target.value as any;
    const name = target.name as any;

    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // VIOLATION: Using `as any` to bypass type checking
    const data = formState as any;
    if (data.name && data.email) {
      onSubmit(data as FormData);
    }
  };

  const validateField = (field: string, value: unknown) => {
    // VIOLATION: `as any` instead of type narrowing
    const rules = {
      name: (v: unknown) => (v as any).length > 0,
      email: (v: unknown) => (v as any).includes('@'),
      role: (v: unknown) => ['admin', 'user', 'viewer'].includes(v as any),
    };

    return (rules as any)[field]?.(value) ?? true;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          value={formState.name}
          onChange={handleChange as any}
          className="mt-1 block w-full rounded-md border px-3 py-2"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={formState.email}
          onChange={handleChange as any}
          className="mt-1 block w-full rounded-md border px-3 py-2"
        />
      </div>
      <button
        type="submit"
        className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Submit
      </button>
    </form>
  );
}
