---
name: nextjs-perf
description: Next.js and React performance patterns forked from Vercel React Best Practices. Referenced by /build subagents and /refactor reviews when working on Next.js projects.
user-invokable: false
---

# Next.js Performance Rules

Forked from [Vercel React Best Practices](https://github.com/vercel-labs/agent-skills) (v1.0.0, 64bee5b7).
Trimmed to rules most relevant to Next.js application development. Generic JavaScript
micro-optimizations removed (covered by general code quality skills).

Upstream reference: `upstream/vercel-react-best-practices-64bee5b7/`

---

## 1. Eliminating Waterfalls — CRITICAL

Sequential async calls are the #1 performance killer in Next.js apps.

### 1.1 Defer Await Until Needed (`async-defer-await`)
Move `await` into the branch where the result is actually used. Starting work early
and awaiting late lets the runtime overlap I/O.

```tsx
// BAD — blocks immediately
async function Page({ params }) {
  const data = await fetchData(params.id);
  if (params.preview) return <Preview />;
  return <Main data={data} />;
}

// GOOD — defer await
async function Page({ params }) {
  const dataPromise = fetchData(params.id);
  if (params.preview) return <Preview />;
  const data = await dataPromise;
  return <Main data={data} />;
}
```

### 1.2 Parallelize Independent Operations (`async-parallel`)
Use `Promise.all()` for operations that don't depend on each other.

```tsx
// BAD — sequential
const user = await getUser(id);
const posts = await getPosts(id);

// GOOD — parallel
const [user, posts] = await Promise.all([getUser(id), getPosts(id)]);
```

### 1.3 Dependency-Based Parallelization (`async-dependencies`)
When operations have partial dependencies, start independent work immediately.

```tsx
// GOOD — start independent work, await only when needed
const userPromise = getUser(id);
const postsPromise = getPosts(id);
const user = await userPromise;
const settings = await getSettings(user.settingsId); // depends on user
const posts = await postsPromise; // was running in parallel
```

### 1.4 API Route Waterfall Prevention (`async-api-routes`)
In API routes / server actions, start all promises at the top, await at the bottom.

### 1.5 Strategic Suspense Boundaries (`async-suspense-boundaries`)
Wrap slow async server components in `<Suspense>` with fallbacks to stream content
progressively instead of blocking the entire page.

```tsx
// GOOD — fast shell renders immediately, slow part streams in
export default function Page() {
  return (
    <main>
      <Header />
      <Suspense fallback={<Skeleton />}>
        <SlowDataSection />
      </Suspense>
    </main>
  );
}
```

---

## 2. Bundle Size Optimization — CRITICAL

Every kilobyte of JS shipped to the client delays interaction.

### 2.1 Avoid Barrel File Imports (`bundle-barrel-imports`)
Import from the specific module, not from `index.ts` barrels. Barrel files pull in
the entire directory even if tree-shaking is available.

```tsx
// BAD
import { Button } from '@/components';

// GOOD
import { Button } from '@/components/ui/button';
```

### 2.2 Dynamic Imports for Heavy Components (`bundle-dynamic-imports`)
Use `next/dynamic` for components not needed on initial render (modals, charts, editors).

```tsx
const Chart = dynamic(() => import('@/components/Chart'), {
  loading: () => <Skeleton />,
  ssr: false,
});
```

### 2.3 Defer Non-Critical Third-Party Libraries (`bundle-defer-third-party`)
Load analytics, logging, and monitoring after hydration using `useEffect` or
`next/script` with `strategy="afterInteractive"`.

### 2.4 Conditional Module Loading (`bundle-conditional`)
Load modules only when a feature flag or condition activates them.

### 2.5 Preload on Hover/Focus (`bundle-preload`)
Preload heavy routes or components on pointer hover to mask latency.

---

## 3. Server-Side Performance — HIGH

### 3.1 Authenticate Server Actions (`server-auth-actions`)
Always verify authentication inside server actions — they are public HTTP endpoints.

### 3.2 React.cache() for Request Deduplication (`server-cache-react`)
Wrap data-fetching functions with `React.cache()` so multiple components requesting
the same data within one render share a single fetch.

```tsx
import { cache } from 'react';
export const getUser = cache(async (id: string) => {
  return db.user.findUnique({ where: { id } });
});
```

### 3.3 LRU Cache for Cross-Request Caching (`server-cache-lru`)
Use an LRU cache at module scope for data that is expensive but changes infrequently.

### 3.4 Avoid Duplicate Serialization (`server-dedup-props`)
Don't pass the same large object to multiple client components — fetch once, pass minimal props.

### 3.5 Hoist Static I/O (`server-hoist-static-io`)
Move static reads (fonts, logos, config files) to module-level so they execute once at
import time, not on every request.

### 3.6 Minimize Client Serialization (`server-serialization`)
Only pass the fields client components actually need. Large server objects serialized
into RSC payloads bloat page size.

### 3.7 Parallelize Server Fetches (`server-parallel-fetching`)
Structure server components so independent data fetches run in parallel, not sequentially
through component hierarchy.

### 3.8 Non-Blocking Operations with after() (`server-after-nonblocking`)
Use Next.js `after()` for work that doesn't affect the response (analytics, logging,
cache warming).

---

## 4. Client-Side Data Fetching — MEDIUM-HIGH

### 4.1 SWR for Request Deduplication (`client-swr-dedup`)
Use SWR or React Query — they deduplicate concurrent requests and provide stale-while-revalidate caching.

### 4.2 Passive Event Listeners (`client-passive-event-listeners`)
Use `{ passive: true }` for scroll and touch listeners to avoid blocking the main thread.

---

## 5. Re-render Optimization — MEDIUM

### 5.1 Don't Subscribe to Write-Only State (`rerender-defer-reads`)
If a component only writes to state (never reads it for rendering), move the subscription
out to avoid re-renders.

### 5.2 Memoize Expensive Components (`rerender-memo`)
Wrap expensive subtrees in `React.memo()` and ensure props are stable references.

### 5.3 Hoist Default Non-Primitive Props (`rerender-memo-with-default-value`)
Default values like `[]` or `{}` in props create new references every render, defeating memo.

```tsx
// BAD — new array reference each render
function List({ items = [] }) { ... }

// GOOD — stable reference
const EMPTY: Item[] = [];
function List({ items = EMPTY }) { ... }
```

### 5.4 Derive State During Render (`rerender-derived-state-no-effect`)
Compute derived values directly during render, not in useEffect.

```tsx
// BAD — extra render cycle
const [filtered, setFiltered] = useState([]);
useEffect(() => { setFiltered(items.filter(predicate)); }, [items]);

// GOOD — computed inline
const filtered = useMemo(() => items.filter(predicate), [items, predicate]);
```

### 5.5 Functional setState for Stable Callbacks (`rerender-functional-setstate`)
Use `setCount(c => c + 1)` instead of `setCount(count + 1)` to avoid stale closures
and keep callbacks referentially stable.

### 5.6 Use startTransition for Non-Urgent Updates (`rerender-transitions`)
Wrap expensive state updates in `startTransition` to keep the UI responsive.

---

## 6. Rendering Performance — MEDIUM

### 6.1 content-visibility for Long Lists (`rendering-content-visibility`)
Apply `content-visibility: auto` to off-screen sections for rendering cost savings.

### 6.2 Hoist Static JSX (`rendering-hoist-jsx`)
Extract static JSX that doesn't depend on props/state outside the component.

### 6.3 Hydration Without Flicker (`rendering-hydration-no-flicker`)
Use an inline `<script>` to set client-only data (theme, locale) before React hydrates,
preventing flash of wrong content.

### 6.4 Use Ternary for Conditional Rendering (`rendering-conditional-render`)
Prefer `condition ? <A /> : null` over `condition && <A />` to avoid rendering `0` or `""`.
