'use client';

import { useEffect, useState } from 'react';
import { DataTable } from '@/components/data-table';
import { Sidebar } from '@/components/sidebar';
import { UserAvatar } from '@/components/user-avatar';
import { Button } from '@/components/ui/button';
import { UsersEmptyState } from '@/components/users-empty-state';
import type { User } from '@/types';

const roleColors: Record<string, string> = {
  admin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  editor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  viewer: 'bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-300',
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => {
        setUsers(data.data);
        setLoading(false);
      });
  }, []);

  const handleDelete = async (userId: string) => {
    await fetch(`/api/users/${userId}`, { method: 'DELETE' });
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Users</h1>
          <Button>Add User</Button>
        </div>
        {users.length === 0 ? (
          <UsersEmptyState />
        ) : (
          <>
            <div className="min-w-[800px]">
              <DataTable
                data={users.map((u) => ({
                  ...u,
                  avatar: u.avatarUrl,
                  actions: u.id,
                }))}
                fields={[
                  { key: 'name', label: 'Name', sortable: true },
                  { key: 'email', label: 'Email', sortable: true },
                  { key: 'role', label: 'Role', sortable: true },
                  { key: 'lastActive', label: 'Last Active', sortable: true },
                ]}
                pageSize={10}
                onRowClick={(row) => console.log('Selected user:', row)}
              />
            </div>
            <div className="mt-4 flex gap-2">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleDelete(user.id)}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Delete {user.name}
                </button>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
