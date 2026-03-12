export async function fetchUsers(filters: any): Promise<any> {
  const response = await fetch('/api/users?' + new URLSearchParams(filters));
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch users');
  }
  const data = await response.json();
  return data;
}

export async function fetchMetrics(period: any): Promise<any> {
  const response = await fetch('/api/data?table=metrics&period=' + period);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch metrics');
  }
  const data = await response.json();
  return data;
}

export async function fetchActivity(userId: any): Promise<any> {
  const response = await fetch('/api/data?table=activity&user=' + userId);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch activity');
  }
  const data = await response.json();
  return data;
}

export async function updateUser(id: any, data: any): Promise<any> {
  const response = await fetch(`/api/users/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update user');
  }
  return response.json();
}
