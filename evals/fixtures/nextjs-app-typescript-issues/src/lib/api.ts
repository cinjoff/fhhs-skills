// VIOLATION: `any` in function parameters and return types

export async function fetchData(endpoint: any, options: any): Promise<any> {
  const response = await fetch(endpoint, options);
  const data = await response.json();
  return data;
}

export function transformResponse(data: any): any {
  if (!data) return null;
  return {
    items: data.results?.map((item: any) => ({
      id: item.id,
      name: item.name,
      metadata: item.meta,
    })),
    total: data.total_count,
    page: data.page,
  };
}

export function buildQueryString(params: any): string {
  return Object.entries(params)
    .filter(([_, value]: any) => value !== undefined && value !== null)
    .map(([key, value]: any) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
}

export async function apiClient(method: any, path: any, body: any = null): Promise<any> {
  const headers: any = {
    'Content-Type': 'application/json',
  };

  const config: any = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  return fetchData(`/api${path}`, config);
}
