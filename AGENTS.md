# AGENTS.md

## Cursor Cloud specific instructions

### Service overview

This is a **Next.js 14 App Router** application (`naszawies.pl`) using **Supabase** (local via Docker) as the database/auth layer. The single service is the Next.js dev server on port 3000.

### Prerequisites already installed in the VM

- Node.js 22, npm (via `/exec-daemon/node`)
- Docker (daemon must be started manually, see below)
- Supabase CLI (`supabase` installed globally)
- PostgreSQL client (`psql`)

### Starting the dev environment

1. **Start Docker daemon** (required before Supabase):
   ```
   sudo dockerd &>/tmp/dockerd.log &
   sleep 3
   sudo chmod 666 /var/run/docker.sock
   ```

2. **Start local Supabase** — migration `20260504170000_role_organizacyjne_kgw_osp.sql` fails in local dev because PostgreSQL does not allow new enum values to be used in the same transaction they are added. Workaround:
   ```
   cd /workspace
   # Move problematic migrations temporarily
   mkdir -p /tmp/pending_migrations
   mv supabase/migrations/20260504170000_role_organizacyjne_kgw_osp.sql /tmp/
   for f in supabase/migrations/2026050[5-9]*.sql supabase/migrations/202605[1-3]*.sql; do
     [ -f "$f" ] && mv "$f" /tmp/pending_migrations/
   done
   mv supabase/migrations/20260504200000_rozszerzenie_typow_profili_organizacji.sql /tmp/pending_migrations/ 2>/dev/null

   supabase start

   # Apply enum values outside a transaction
   PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres \
     -c "ALTER TYPE public.user_role_type ADD VALUE IF NOT EXISTS 'kgw_przewodniczaca';" \
     -c "ALTER TYPE public.user_role_type ADD VALUE IF NOT EXISTS 'osp_naczelnik';" \
     -c "ALTER TYPE public.user_role_type ADD VALUE IF NOT EXISTS 'rada_solecka';"

   # Apply original migration (functions)
   PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres \
     -f /tmp/20260504170000_role_organizacyjne_kgw_osp.sql

   # Apply remaining migrations
   for f in $(ls /tmp/pending_migrations/*.sql | sort); do
     PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f "$f"
   done

   # Restore files
   cp /tmp/20260504170000_role_organizacyjne_kgw_osp.sql supabase/migrations/
   cp /tmp/pending_migrations/*.sql supabase/migrations/
   ```

3. **Create `.env.local`** (if it doesn't exist) with local Supabase keys from `supabase status -o env`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY from supabase status>
   SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY from supabase status>
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   CRON_SECRET=local-dev-cron-secret
   ```

4. **Start dev server**: `npm run dev` (port 3000)

### Commands

| Task | Command |
|------|---------|
| Dev server | `npm run dev` |
| Lint | `npm run lint` |
| Type check | `npm run typecheck` |
| Build | `npm run build` |
| Health check | `curl http://localhost:3000/api/health` |
| Supabase status | `supabase status` |

### Non-obvious gotchas

- **Turnstile/Captcha**: skipped automatically when `TURNSTILE_SECRET_KEY` is not set — forms work without it in local dev.
- **Rate limiting**: skipped when `UPSTASH_REDIS_REST_URL` is not set — API endpoints work without it.
- **Resend (email)**: fails silently when `RESEND_API_KEY` is not set — the app still functions, emails just won't send.
- **Docker storage driver**: must use `fuse-overlayfs` in the Cloud Agent VM (configured in `/etc/docker/daemon.json`). Also requires `iptables-legacy`.
- **Node binary path**: lives at `/exec-daemon/node`; if `sudo` can't find it, symlink to `/usr/local/bin/node`.
