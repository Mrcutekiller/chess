---
name: ADWA API client queryKey pattern
description: The orval-generated hooks in @workspace/api-client-react require an explicit queryKey in query options — how to use them correctly.
---

# Required queryKey pattern for generated hooks

TanStack Query v5 (used via orval codegen) requires `queryKey` to be present in the `query` options object. The generated client exports helpers for this.

**Rule:** Always import and pass the matching `get*QueryKey` helper when using a generated query hook with custom options.

```ts
// WRONG — TypeScript error: Property 'queryKey' is missing
useGetPlayer(addr, { query: { enabled: !!addr } });

// CORRECT
import { useGetPlayer, getGetPlayerQueryKey } from '@workspace/api-client-react';
useGetPlayer(addr, { query: { enabled: !!addr, queryKey: getGetPlayerQueryKey(addr) } });
```

**Why:** TanStack Query v5 made queryKey non-optional in certain overloads. Orval's generated types reflect this.

**How to apply:** Any time a generated hook accepts `{ query: ... }` options, import the corresponding `get<HookName>QueryKey` function and include it.
