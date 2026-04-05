// broken-api.ts — intentional errors for eval testing

interface User {
  id: number;
  name: string;
  age: number;
}

// ERROR 1: Type error — string assigned to number field // intentional_error
export async function getUser(id: string): Promise<User> {
  const age: number = "twenty-five"; // intentional_error — Type 'string' is not assignable to type 'number'
  return { id: parseInt(id, 10), name: "Alice", age };
}

// ERROR 2: SQL injection — user input concatenated directly into query // intentional_error
export async function getUserItems(userId: string): Promise<unknown[]> {
  // Simulated query builder (no real DB, but pattern is exploitable)
  const query = "SELECT * FROM items WHERE user_id = " + userId; // intentional_error — SQL injection via string concat
  console.log("Executing query:", query);
  // Pretend we ran the query
  return [];
}

// ERROR 3: Unhandled async / missing error handling on fetch // intentional_error
export async function fetchExternalData(): Promise<unknown> {
  const response = await fetch("https://api.example.com/data"); // intentional_error — no try/catch, no response.ok check
  const json = await response.json(); // intentional_error — will throw uncaught if network fails
  return json;
}

// ERROR 4: Uncaught async fire-and-forget (no await, no .catch) // intentional_error
export function triggerBackgroundJob(payload: string): void {
  fetch("https://api.example.com/jobs", { // intentional_error — unawaited Promise, errors silently swallowed
    method: "POST",
    body: JSON.stringify({ payload }),
  });
}
