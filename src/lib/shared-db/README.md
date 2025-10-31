# Shared Database Library

This folder contains database query functions that are shared between:
- **Creative Spec App** (this app)
- **Approval Dashboard App** (separate app)

## Usage

Both applications import from this shared library to avoid duplicating database logic.

### In Creative Spec App:
```typescript
import { query } from '@/lib/shared-db/db'
import { getCampaignsByAdvertiser } from '@/lib/shared-db/db-campaigns'
```

### In Approval Dashboard App:
```typescript
// Copy this entire folder to approval-dashboard/src/lib/shared-db/
import { query } from '@/lib/shared-db/db'
import { getCampaignsByAdvertiser } from '@/lib/shared-db/db-campaigns'
```

## Environment Variables

Both apps need `DATABASE_URL` in `.env`:
```bash
DATABASE_URL=postgresql://user:password@host:5432/database
```

## Files

- `db.ts` - Core database connection and query function
- `db-approval.ts` - Approval-related queries (existing)
- `db-campaigns.ts` - Campaign-related queries (new)
- `db-advertisers.ts` - Advertiser-related queries
- `types.ts` - Shared TypeScript types
- `index.ts` - Barrel export
