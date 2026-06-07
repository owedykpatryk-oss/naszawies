# Payload CMS — plan integracji

Obecna wersja Next.js (**14.2**) używa plików `content/blog/*.json` jako źródła treści (zero ryzyka dla produkcji).

## Kiedy wdrożyć Payload

1. Upgrade Next.js do **15+** (wymagane przez Payload 3).
2. Osobna subdomena `cms.naszawies.pl` **lub** wbudowany admin po upgrade.
3. Postgres: tabele `platform_blog_*` (migracja `20260607120000_platform_blog_cms.sql`).

## Kolekcje (docelowo)

- `Articles` — zgodnie ze specyfikacją faz 3–4
- `Categories`, `Authors`, `Settings`

## Synchronizacja

Webhook Payload → `revalidatePath('/blog')` + zapis do `platform_blog_articles`.
