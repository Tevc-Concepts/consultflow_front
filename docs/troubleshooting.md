# Troubleshooting

## Known build warnings

- React hooks exhaustive deps in reports/client pages: consider including `approvals` in dependency arrays or refactor effect usage
- import/no-anonymous-default-export in integration stubs: assign the object to a constant before default export

## Common errors

- Next.js page invalid export
  - Symptom: `"OutboxSection" is not a valid Page export field.`
  - Fix: Pages in App Router must only export default (and allowed metadata). Remove stray named exports.

- Type widening in Zustand store map
  - Symptom: `Type 'string' is not assignable to type '"queued" | "sent"'`
  - Fix: Use const assertions and explicit array typing when mapping items to preserve literal unions.

## Clean build

If a stale error persists, do a clean build to clear the cache:

```bash
rm -rf .next
npm run build
```
