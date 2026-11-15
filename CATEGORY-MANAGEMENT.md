# Category management

## Where to use it

- Admin dashboard → **Categories** (`/dashboard/admin/categories`): create, rename, activate/deactivate, delete unused categories, and approve/reject provider suggestions with an optional response.
- Provider dashboard → **Categories** (`/dashboard/provider/categories`): view active categories and track their own suggestions.
- Provider **List new gear / Edit gear**: category selection, refresh button and an inline suggestion form. Approval does not discard an in-progress gear form; use Refresh categories to retrieve the approved option.
- Homepage links use category IDs; editorial links fall back to exact category slugs, never title search. Catalog URLs accept `categoryId` or `category` (slug).

## Rules

Public category lists contain active categories only. Admin management includes inactive categories and gear counts. Providers cannot create, modify, delete, or approve categories directly. The server checks current database roles, not just claims in an old token.

Deactivation prevents assigning the category to new gear or moving other gear into it. Existing listings keep their category and can still be edited or moved to an active one. Existing rental records are preserved. Renaming preserves the slug so existing links continue to work.

Deletion is allowed only for unused categories. A database RESTRICT foreign key also protects against a concurrent gear creation. No category deletion can cascade into gear or rental records.

Names are trimmed and normalised. Case-insensitive unique names and unique slugs prevent duplicates. Only one pending suggestion per normalised slug is allowed. Approval runs in one transaction, reuses an already-created active category if appropriate, and cannot process the same request twice. Rejected suggestions remain visible to the submitting provider with the admin response.

## API

| Method | Path | Access |
| --- | --- | --- |
| GET | `/api/categories` | Public, active only |
| GET | `/api/categories/manage` | Admin, all categories |
| POST | `/api/categories` | Admin, `{name, description?, image?, slug?}` |
| PATCH | `/api/categories/:id` | Admin, `{name?, description?, image?, slug?, isActive?}` |
| DELETE | `/api/categories/:id` | Admin, unused only |
| GET | `/api/categories/suggestions` | Admin sees all; provider sees their own |
| POST | `/api/categories/suggestions` | Provider, `{name, description?}` |
| PATCH | `/api/categories/suggestions/:id` | Admin, `{status: "APPROVED" | "REJECTED", reviewNote?}` |

## Deployment and checks

Run `npx prisma migrate deploy` and `npx prisma generate`, then restart the backend. Migration `20261115000100_category_management` adds active status, persistent suggestions, duplicate protection and the safe foreign key in one transaction. It does not remove application data. Existing case-insensitive duplicate names must be resolved before migration; it deliberately fails rather than deleting them.

On the configured development database, the existing schema was compared with the Prisma schema before its original migration was baselined, then the category migration was applied successfully.

Run `npm run test:categories` for category validation, service safety, duplicate handling, transactional approval and HTTP role/ownership tests. Tests stub the database and do not change persisted data.
