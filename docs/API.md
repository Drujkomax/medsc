# msc-heal-hub — API Reference

> Auto-extracted backend/API documentation for **medsc.uz** (`msc-heal-hub`). Intended as context for Claude / developers. Generated from the codebase: edge functions (`supabase/functions/`), the auto-generated schema (`src/integrations/supabase/types.ts`), SQL migrations (`supabase/migrations/`), and the client data layer (`src/`).

The backend is **Supabase** (Postgres + Auth + Storage + Edge Functions). There is no separate REST API server — the "API" is three surfaces:

1. **PostgREST** auto-REST over the Postgres tables/views (RLS-enforced) — `/rest/v1/<table>`
2. **RPC** stored procedures — `/rest/v1/rpc/<name>` (called via `supabase.rpc(...)`)
3. **Edge Functions** (Deno) — `/functions/v1/<name>`

Plus **Auth** (`/auth/v1/...`) and **Storage** (`/storage/v1/...`) via `supabase-js`.

---

## Connection

| Item | Value |
|---|---|
| Project ID | `smvbhwaupvbxqxqxzzjx` |
| Base URL | `https://smvbhwaupvbxqxqxzzjx.supabase.co` |
| REST (tables) | `https://smvbhwaupvbxqxqxzzjx.supabase.co/rest/v1/<table>` |
| RPC | `https://smvbhwaupvbxqxqxzzjx.supabase.co/rest/v1/rpc/<name>` |
| Edge Functions | `https://smvbhwaupvbxqxqxzzjx.supabase.co/functions/v1/<name>` |
| Auth | `https://smvbhwaupvbxqxqxzzjx.supabase.co/auth/v1/` |
| Storage | `https://smvbhwaupvbxqxqxzzjx.supabase.co/storage/v1/` |
| Anon / publishable key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtdmJod2F1cHZieHF4cXh6emp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MDQ5MzEsImV4cCI6MjA2OTk4MDkzMX0.mf7cAl_f2oHc_vJ-pe0LHDHnrMMDS-P_bmUECVbElto` (public, embedded in `src/integrations/supabase/client.ts`) |

**Client setup** (`src/integrations/supabase/client.ts`): `createClient<Database>(URL, ANON_KEY, { auth: { storage: localStorage, persistSession: true, autoRefreshToken: true } })`. Import as `import { supabase } from "@/integrations/supabase/client"`.

**Stack:** Vite + React 18 + TypeScript, `@supabase/supabase-js` v2, shadcn/ui, i18next (locales `ru`/`en`/`uz`, default `ru`). Multilingual content columns store `{ ru, en, uz }` JSON objects.

**Secrets (server-side only, never in the client):** `SUPABASE_SERVICE_ROLE_KEY`, `BOT_BACKEND_JWT`, `TELEGRAM_BOT_TOKEN`.

---

## Auth model (at a glance)

| Caller | Mechanism | Used by |
|---|---|---|
| Browser (logged-in user) | Supabase JWT session (anon key + `Authorization: Bearer <access_token>`), RLS enforced | All `supabase.from/rpc` calls; edge fns `send-telegram-message`, `admin-user-management`, `delete-user` |
| External Telegram bot backend | `Authorization: Bearer <BOT_BACKEND_JWT>` shared-secret check inside the function | edge fns `lead-create`, `link-telegram`, `user-role`, `client-stock-update`, `enqueue-notification` |
| Cron / scheduler | none in-code (internal worker) | edge fn `process-notifications`; RPCs `cleanup_old_logs`, `cleanup_abandoned_visits` |
| Admin / manual | platform JWT only | edge fn `seed-warehouse` |

RBAC enum `app_role`: `director` > `admin` > `sales_manager` > `salesperson` > (`accountant`, `engineer`, `observer`, `user`). Role checks live in `SECURITY DEFINER` RPCs (`has_role`, `has_role_level`, `has_custom_permission`) and RLS policies.

## Contents

1. [Database Schema (Tables, Views, Enums)](#1-database-schema-tables-views-enums)
2. [RPC Functions (Stored Procedures)](#2-rpc-functions-stored-procedures)
3. [Edge Functions (HTTP API)](#3-edge-functions-http-api)
4. [Client Data-Access Layer](#4-client-data-access-layer)
5. [Site Routes and Pages](#5-site-routes-and-pages)
6. [Known inconsistencies](#6-known-inconsistencies)

---

# 1. Database Schema (Tables, Views, Enums)

Sourced verbatim from the auto-generated `src/integrations/supabase/types.ts`. The `public` schema contains **38 tables**, **0 views** (the `Views` block is empty), and **1 enum** (`app_role`). Every table is reachable over PostgREST at `https://smvbhwaupvbxqxqxzzjx.supabase.co/rest/v1/<table>` and is subject to Row-Level Security (RLS). Columns are taken from each table's `Row` type; a column is **nullable** when its type includes `| null`. Foreign keys are listed as `column → referencedRelation.referencedColumns`.

### Auth & Roles

Tables for application user identity, role assignment, custom per-section permissions, invitations, and time-limited employee access.

#### profiles
User profile records (mirrors auth users) including avatar, language, and Telegram linkage fields.

| Column | Type | Nullable |
|---|---|---|
| avatar_url | string | yes |
| created_at | string | yes |
| email | string | yes |
| full_name | string | yes |
| id | string | no |
| language | string | yes |
| telegram_id | number | yes |
| telegram_link_code | string | yes |
| telegram_link_code_expires_at | string | yes |
| telegram_username | string | yes |
| updated_at | string | yes |

Relationships: none.

#### user_roles
Assigns an `app_role` enum value to a user (RBAC mapping).

| Column | Type | Nullable |
|---|---|---|
| created_at | string | yes |
| id | string | no |
| role | app_role | no |
| user_id | string | no |

Relationships: none.

#### employee_custom_permissions
Per-section permission overrides (`permission_level` for a named `section`) granted to a user.

| Column | Type | Nullable |
|---|---|---|
| created_at | string | yes |
| created_by | string | yes |
| id | string | no |
| permission_level | string | no |
| section | string | no |
| updated_at | string | yes |
| user_id | string | no |

Relationships: none.

#### user_invites
Pending invitations to join, carrying the target email and the `app_role` to assign on acceptance.

| Column | Type | Nullable |
|---|---|---|
| created_at | string | yes |
| created_by | string | yes |
| email | string | no |
| expires_at | string | yes |
| id | string | no |
| role | app_role | no |
| used | boolean | yes |

Relationships: none.

#### temporary_employees
Records granting an employee time-boxed (expiring) active access.

| Column | Type | Nullable |
|---|---|---|
| created_at | string | yes |
| created_by | string | yes |
| expires_at | string | no |
| id | string | no |
| is_active | boolean | yes |
| user_id | string | no |

Relationships: none.

#### users
Lightweight end-user records (e.g. bot/site users) capturing name, phone, and stated goal.

| Column | Type | Nullable |
|---|---|---|
| created_at | string | yes |
| goal | string | yes |
| id | string | no |
| name | string | yes |
| phone | string | yes |

Relationships: none.

### CRM / Leads & Deals

Sales-pipeline tables: leads with their activities/notes, deals with line items (products/services), deal documents, and a deal audit trail.

#### leads
Inbound/managed sales leads with contact info, source, stage, qualification, and assignment fields.

| Column | Type | Nullable |
|---|---|---|
| archived | boolean | yes |
| archived_at | string | yes |
| archived_by | string | yes |
| assigned_by | string | yes |
| assigned_to | string | yes |
| budget_range | string | yes |
| city | string | yes |
| client_id | string | yes |
| closed_at | string | yes |
| company | string | yes |
| created_at | string | no |
| email | string | yes |
| equipment_interest | string | yes |
| id | string | no |
| lead_created_date | string | yes |
| lead_quality | string | yes |
| name | string | no |
| notes | string | yes |
| phone | string | yes |
| position | string | yes |
| qualification_date | string | yes |
| qualified_by | string | yes |
| source | string | yes |
| stage | string | no |
| telegram_id | number | yes |
| timeline | string | yes |
| updated_at | string | no |
| value | number | yes |
| visit_goal | string | yes |

Relationships:
- client_id → clients.id

#### lead_activities
Timeline of activity entries (type, content, optional old/new value) attached to a lead.

| Column | Type | Nullable |
|---|---|---|
| content | string | no |
| created_at | string | no |
| created_by | string | yes |
| id | string | no |
| lead_id | string | no |
| metadata | Json | yes |
| new_value | string | yes |
| old_value | string | yes |
| type | string | no |

Relationships:
- lead_id → leads.id

#### lead_notes
Free-text notes authored against a lead.

| Column | Type | Nullable |
|---|---|---|
| content | string | no |
| created_at | string | no |
| created_by | string | no |
| id | string | no |
| lead_id | string | no |

Relationships:
- lead_id → leads.id

#### deals
Sales deals/opportunities with amount, stage, payment status, probability, and role assignments (salesperson/engineer/accountant).

| Column | Type | Nullable |
|---|---|---|
| amount | number | yes |
| assigned_accountant | string | yes |
| assigned_engineer | string | yes |
| assigned_salesperson | string | yes |
| close_date | string | yes |
| created_at | string | no |
| created_by | string | yes |
| deal_type | string | yes |
| debt_amount | number | yes |
| id | string | no |
| lead_id | string | yes |
| notes | string | yes |
| payment_status | string | yes |
| probability | number | yes |
| product_id | string | yes |
| service_id | string | yes |
| stage | string | no |
| title | string | no |
| updated_at | string | no |

Relationships:
- lead_id → leads.id
- product_id → products.id
- service_id → services.id

#### deal_products
Join table of products attached to a deal, with quantity and pricing.

| Column | Type | Nullable |
|---|---|---|
| created_at | string | no |
| deal_id | string | no |
| id | string | no |
| product_id | string | no |
| quantity | number | yes |
| total_price | number | yes |
| unit_price | number | yes |
| updated_at | string | no |

Relationships:
- deal_id → deals.id
- product_id → products.id

#### deal_services
Join table of services attached to a deal, with quantity and pricing.

| Column | Type | Nullable |
|---|---|---|
| created_at | string | no |
| deal_id | string | no |
| id | string | no |
| quantity | number | yes |
| service_id | string | no |
| total_price | number | yes |
| unit_price | number | yes |
| updated_at | string | no |

Relationships:
- deal_id → deals.id
- service_id → services.id

#### deal_documents
File attachments (path, name, size, type) linked to a deal.

| Column | Type | Nullable |
|---|---|---|
| created_at | string | yes |
| deal_id | string | yes |
| file_name | string | no |
| file_path | string | no |
| file_size | number | yes |
| file_type | string | yes |
| id | string | no |
| updated_at | string | yes |
| uploaded_by | string | yes |

Relationships:
- deal_id → deals.id

#### deal_audit_log
Audit trail of changes to deals (action type, changed fields, before/after JSON, actor, IP/user-agent).

| Column | Type | Nullable |
|---|---|---|
| action_type | string | no |
| changed_fields | string[] | yes |
| created_at | string | no |
| deal_id | string | no |
| id | string | no |
| ip_address | unknown | no |
| new_values | Json | yes |
| old_values | Json | yes |
| user_agent | string | yes |
| user_email | string | yes |
| user_id | string | yes |
| user_role | string | yes |

Relationships:
- deal_id → deals.id

### Clients (Clinics)

Customer/clinic master data plus per-client interaction logs, documents, invoices, shipments, and an activity audit log.

#### clients
Master client/clinic record: contact details, legal info (INN, legal name), contract dates/status, cooperation type, assignment, and archival.

| Column | Type | Nullable |
|---|---|---|
| address | string | yes |
| archived | boolean | yes |
| archived_at | string | yes |
| archived_by | string | yes |
| assigned_manager | string | yes |
| city | string | yes |
| company | string | yes |
| contact_person | string | yes |
| contract_end_date | string | yes |
| contract_start_date | string | yes |
| contract_status | string | yes |
| cooperation_type | string[] | yes |
| country | string | yes |
| created_at | string | no |
| created_by | string | yes |
| email | string | yes |
| id | string | no |
| inn | string | yes |
| last_contact | string | yes |
| legal_name | string | yes |
| name | string | no |
| notes | string | yes |
| phone | string | yes |
| priority | string | yes |
| telegram_chat_id | string | yes |
| updated_at | string | no |
| updated_by | string | yes |

Relationships: none.

#### client_interaction_logs
Logged interactions (call/email/etc.) with a client, including subject and message.

| Column | Type | Nullable |
|---|---|---|
| client_id | string | no |
| created_at | string | no |
| created_by | string | yes |
| id | string | no |
| interaction_type | string | no |
| message | string | no |
| subject | string | yes |

Relationships:
- client_id → clients.id

#### clinic_activity_logs
Audit log of actions taken on a client/clinic (action type/description, changed fields, actor identity).

| Column | Type | Nullable |
|---|---|---|
| action_description | string | no |
| action_type | string | no |
| changed_fields | Json | yes |
| client_id | string | no |
| created_at | string | no |
| id | string | no |
| user_email | string | yes |
| user_id | string | yes |
| user_name | string | yes |

Relationships:
- client_id → clients.id

#### clinic_documents
Uploaded documents associated with a client/clinic (categorized files).

| Column | Type | Nullable |
|---|---|---|
| category | string | yes |
| client_id | string | no |
| created_at | string | yes |
| description | string | yes |
| file_name | string | no |
| file_path | string | no |
| file_size | number | yes |
| file_type | string | yes |
| id | string | no |
| uploaded_by | string | yes |

Relationships:
- client_id → clients.id

#### clinic_invoices
Invoices issued to a client (number, amount, currency, issue/due/paid dates, status).

| Column | Type | Nullable |
|---|---|---|
| amount | number | no |
| client_id | string | no |
| created_at | string | yes |
| created_by | string | yes |
| currency | string | yes |
| description | string | yes |
| due_date | string | yes |
| id | string | no |
| invoice_number | string | no |
| issue_date | string | no |
| paid_date | string | yes |
| status | string | yes |
| updated_at | string | yes |

Relationships:
- client_id → clients.id

#### clinic_shipments
Shipments to a client (carrier, tracking, shipped/delivered dates, item list, status).

| Column | Type | Nullable |
|---|---|---|
| carrier | string | yes |
| client_id | string | no |
| created_at | string | yes |
| created_by | string | yes |
| delivered_date | string | yes |
| id | string | no |
| items | Json | yes |
| notes | string | yes |
| shipment_number | string | yes |
| shipped_date | string | yes |
| status | string | yes |
| tracking_number | string | yes |
| updated_at | string | yes |

Relationships:
- client_id → clients.id

### Products, Services & Categories

Catalog tables for products and services, their manufacturers, and the category lookup tables.

#### products
Product catalog with multilingual JSON fields (name/description/features), pricing, stock flag, manufacturer link, images, and analytics counters (views, quote requests, conversion).

| Column | Type | Nullable |
|---|---|---|
| archived | boolean | yes |
| archived_at | string | yes |
| archived_by | string | yes |
| category | string | no |
| competitor_price | number | yes |
| conversion_rate | number | yes |
| country | string | yes |
| created_at | string | no |
| created_by | string | yes |
| currency | string | yes |
| description | Json | no |
| features | Json | yes |
| icon_url | string | yes |
| id | string | no |
| images | Json | yes |
| in_stock | boolean | no |
| manufacturer_id | string | yes |
| manufacturer_name | string | yes |
| name | Json | no |
| performance_score | number | yes |
| price | string | yes |
| price_history | Json | yes |
| quote_requests_count | number | yes |
| revenue_attributed | number | yes |
| slug | string | yes |
| status | string | no |
| updated_at | string | no |
| updated_by | string | yes |
| views_count | number | yes |

Relationships:
- manufacturer_id → manufacturers.id

#### services
Service catalog with multilingual JSON fields (title/description/features), pricing, and status.

| Column | Type | Nullable |
|---|---|---|
| category | string | no |
| created_at | string | no |
| created_by | string | yes |
| currency | string | yes |
| description | Json | no |
| features | Json | yes |
| id | string | no |
| images | Json | yes |
| price | string | yes |
| status | string | no |
| title | Json | no |
| updated_at | string | no |
| updated_by | string | yes |

Relationships: none.

#### manufacturers
Equipment manufacturers (name, slug, country code, legal name, logo).

| Column | Type | Nullable |
|---|---|---|
| country_code | string | no |
| created_at | string | no |
| created_by | string | yes |
| id | string | no |
| legal_name | string | yes |
| logo_url | string | yes |
| name | string | no |
| slug | string | no |
| updated_at | string | no |

Relationships: none.

#### categories
Generic category lookup with a multilingual JSON `name` and a `value` key.

| Column | Type | Nullable |
|---|---|---|
| created_at | string | no |
| id | string | no |
| name | Json | no |
| updated_at | string | no |
| value | string | no |

Relationships: none.

#### product_categories
Product-specific category lookup (multilingual `name`, `value` key).

| Column | Type | Nullable |
|---|---|---|
| created_at | string | no |
| created_by | string | yes |
| id | string | no |
| name | Json | no |
| updated_at | string | no |
| value | string | no |

Relationships: none.

#### service_categories
Service-specific category lookup (multilingual `name`, `value` key).

| Column | Type | Nullable |
|---|---|---|
| created_at | string | no |
| created_by | string | yes |
| id | string | no |
| name | Json | no |
| updated_at | string | no |
| value | string | no |

Relationships: none.

### Warehouse / Stock

Internal warehouse inventory and its activity log, plus per-client stock tracking with alerts and transactions.

#### warehouse_items
Internal warehouse inventory items: multilingual name/description, condition, quantity/unit, purchase & selling price, location, low-stock threshold, and optional product link.

| Column | Type | Nullable |
|---|---|---|
| archived | boolean | yes |
| archived_at | string | yes |
| archived_by | string | yes |
| condition | string | no |
| created_at | string | no |
| created_by | string | yes |
| description | Json | yes |
| id | string | no |
| images | Json | yes |
| location | string | yes |
| minimum_stock | number | yes |
| name | Json | no |
| notes | string | yes |
| notify_low_stock | boolean | yes |
| product_id | string | yes |
| purchase_price | number | yes |
| quantity | number | no |
| selling_price | number | yes |
| status | string | no |
| unit | string | no |
| updated_at | string | no |
| updated_by | string | yes |

Relationships:
- product_id → products.id

#### warehouse_activity_logs
Audit log of warehouse item changes (action type, change JSON, item name snapshot, actor).

| Column | Type | Nullable |
|---|---|---|
| action_type | string | no |
| changes | Json | yes |
| created_at | string | no |
| id | string | no |
| item_name | Json | no |
| user_email | string | yes |
| user_id | string | no |
| user_name | string | yes |
| warehouse_item_id | string | yes |

Relationships:
- warehouse_item_id → warehouse_items.id

#### client_stock
Per-client on-site stock holdings: quantity/unit, location, serial numbers, consumption estimates, depletion dates, low-stock notification settings; may reference a product, a warehouse item, or a custom item.

| Column | Type | Nullable |
|---|---|---|
| average_monthly_consumption | number | yes |
| client_id | string | no |
| created_at | string | no |
| created_by | string | yes |
| custom_item_description | string | yes |
| custom_item_name | Json | yes |
| estimated_depletion_date | string | yes |
| id | string | no |
| last_refill_date | string | yes |
| location | string | yes |
| minimum_stock | number | yes |
| notes | string | yes |
| notification_threshold_days | number | yes |
| notify_low_stock | boolean | yes |
| product_id | string | yes |
| quantity | number | no |
| serial_numbers | string[] | yes |
| unit | string | no |
| updated_at | string | no |
| updated_by | string | yes |
| warehouse_item_id | string | yes |

Relationships:
- client_id → clients.id
- product_id → products.id
- warehouse_item_id → warehouse_items.id

#### client_stock_alerts
Low-stock / depletion alerts raised for a client's stock item, with acknowledgement, resolution, severity, and Telegram-sent tracking.

| Column | Type | Nullable |
|---|---|---|
| acknowledged | boolean | yes |
| acknowledged_at | string | yes |
| acknowledged_by | string | yes |
| alert_type | string | no |
| client_id | string | no |
| client_stock_id | string | no |
| created_at | string | no |
| id | string | no |
| message | string | no |
| resolved | boolean | yes |
| resolved_at | string | yes |
| severity | string | no |
| telegram_sent | boolean | yes |
| telegram_sent_at | string | yes |

Relationships:
- client_id → clients.id
- client_stock_id → client_stock.id

#### client_stock_transactions
Ledger of quantity changes to a client stock item (type, before/after quantities, reason, optional deal link and document).

| Column | Type | Nullable |
|---|---|---|
| client_id | string | no |
| client_stock_id | string | no |
| created_at | string | no |
| deal_id | string | yes |
| document_url | string | yes |
| id | string | no |
| notes | string | yes |
| performed_by | string | yes |
| quantity | number | no |
| quantity_after | number | no |
| quantity_before | number | no |
| reason | string | yes |
| transaction_type | string | no |

Relationships:
- client_id → clients.id
- client_stock_id → client_stock.id
- deal_id → deals.id

### Notifications & Telegram

Notification templates and their delivery queue, plus Telegram account-linking and bot conversation-state tables.

#### notification_templates
Reusable notification templates (code, title, markdown body, target audience, throttle interval).

| Column | Type | Nullable |
|---|---|---|
| audience | string | no |
| body_md | string | no |
| code | string | no |
| created_at | string | yes |
| id | string | no |
| throttle_seconds | number | no |
| title | string | no |

Relationships: none.

#### notification_queue
Queued/scheduled notifications targeting a user from a template, with payload, planned/sent timestamps, and status. ⚠️ See [Known inconsistencies](#6-known-inconsistencies) — the edge functions write a different column set than this generated type.

| Column | Type | Nullable |
|---|---|---|
| id | string | no |
| payload | Json | yes |
| planned_at | string | no |
| sent_at | string | yes |
| status | string | no |
| template_id | string | no |
| user_id | string | no |

Relationships:
- template_id → notification_templates.id

#### telegram_links
Maps a Telegram account (id/username) to an app user, with verification and login-token fields.

| Column | Type | Nullable |
|---|---|---|
| created_at | string | yes |
| id | string | no |
| linked_at | string | yes |
| login_token | string | yes |
| telegram_id | number | no |
| telegram_username | string | yes |
| user_id | string | yes |
| verified | boolean | yes |

Relationships: none.

#### bot_sessions
Telegram bot session state keyed by `telegram_id`, holding a conversational `state` and arbitrary `context` JSON.

| Column | Type | Nullable |
|---|---|---|
| context | Json | no |
| state | string | no |
| telegram_id | number | no |
| updated_at | string | no |

Relationships: none.

#### bot_state
Telegram bot per-user wizard state keyed by `user_id`, holding the current `step` and in-progress `lead` JSON.

| Column | Type | Nullable |
|---|---|---|
| lead | Json | no |
| step | string | no |
| user_id | number | no |

Relationships: none.

### Logging & Audit / System

Application-wide system logs and alerts, plus employee/user activity audit logs.

#### system_logs
Centralized application log entries (level, category, message, stack trace, URL, IP, user-agent, actor).

| Column | Type | Nullable |
|---|---|---|
| category | string | no |
| created_at | string | no |
| details | Json | yes |
| id | string | no |
| ip_address | unknown | no |
| level | string | no |
| message | string | no |
| stack_trace | string | yes |
| url | string | yes |
| user_agent | string | yes |
| user_id | string | yes |

Relationships: none.

#### system_alerts
System-level alerts (type, severity, status, title/description) optionally triggered by a system log entry, with acknowledge/resolve tracking.

| Column | Type | Nullable |
|---|---|---|
| acknowledged_at | string | yes |
| acknowledged_by | string | yes |
| alert_type | string | no |
| created_at | string | no |
| description | string | yes |
| details | Json | yes |
| id | string | no |
| resolved_at | string | yes |
| severity | string | no |
| status | string | no |
| title | string | no |
| triggered_by_log_id | string | yes |

Relationships:
- triggered_by_log_id → system_logs.id

#### employee_activity
Fine-grained employee activity tracking (action type, target entity, session duration, IP/user-agent).

| Column | Type | Nullable |
|---|---|---|
| action_type | string | no |
| created_at | string | yes |
| date | string | yes |
| details | Json | yes |
| entity_id | string | yes |
| entity_type | string | yes |
| id | string | no |
| ip_address | unknown | no |
| session_duration | number | yes |
| user_agent | string | yes |
| user_id | string | no |

Relationships: none.

#### user_activity_logs
General user action audit log (action, target type/id, IP/user-agent, details JSON).

| Column | Type | Nullable |
|---|---|---|
| action | string | no |
| created_at | string | no |
| details | Json | yes |
| id | string | no |
| ip_address | unknown | no |
| target_id | string | yes |
| target_type | string | yes |
| user_agent | string | yes |
| user_id | string | no |

Relationships: none.

### Analytics

Aggregated conversion/funnel metrics.

#### conversion_analytics
Daily per-product funnel metrics (views, quote requests, conversions, conversion rate, revenue).

| Column | Type | Nullable |
|---|---|---|
| conversion_rate | number | yes |
| conversions_count | number | yes |
| created_at | string | yes |
| date | string | no |
| id | string | no |
| product_id | string | yes |
| quote_requests_count | number | yes |
| revenue | number | yes |
| updated_at | string | yes |
| views_count | number | yes |

Relationships:
- product_id → products.id

### Field Visits

Sales-rep on-site visits to clients and the per-stage data (photos, notes, structured payload) captured during each visit.

#### visits
A sales rep's visit to a client: status, start/complete timestamps, outcome, and a `pending_clinic` JSON draft for not-yet-created clinics.

| Column | Type | Nullable |
|---|---|---|
| client_id | string | yes |
| completed_at | string | yes |
| created_at | string | no |
| id | string | no |
| outcome | string | yes |
| outcome_comment | string | yes |
| pending_clinic | Json | yes |
| rep_id | string | no |
| started_at | string | no |
| status | string | no |
| updated_at | string | no |

Relationships:
- client_id → clients.id

#### visit_stages
Individual completed stages within a visit (stage type, photo URLs, text note, structured payload).

| Column | Type | Nullable |
|---|---|---|
| completed_at | string | no |
| id | string | no |
| payload | Json | no |
| photo_urls | string[] | no |
| stage_type | string | no |
| text_note | string | yes |
| visit_id | string | no |

Relationships:
- visit_id → visits.id

### Tasks

Internal task / to-do management with recurrence and links to clients and deals.

#### tasks
Assignable tasks (single or multiple assignees) with priority, status, due/completion dates, recurrence settings, and optional client/deal/parent-task links.

| Column | Type | Nullable |
|---|---|---|
| assignee_id | string | yes |
| assignee_ids | string[] | yes |
| client_id | string | yes |
| comments | string | yes |
| completed_at | string | yes |
| created_at | string | no |
| created_by | string | yes |
| deal_id | string | yes |
| description | string | yes |
| due_date | string | yes |
| id | string | no |
| parent_task_id | string | yes |
| priority | string | no |
| recurrence_end_date | string | yes |
| recurrence_interval | number | yes |
| recurrence_type | string | yes |
| status | string | no |
| title | string | no |
| updated_at | string | no |

Relationships:
- client_id → clients.id
- deal_id → deals.id
- parent_task_id → tasks.id

### Content / CMS & Public Site

Public-facing website content and inbound inquiry capture.

#### site_contacts
Singleton-style site contact / social-media configuration (phone, email, address, working hours, social links).

| Column | Type | Nullable |
|---|---|---|
| address | string | yes |
| created_at | string | no |
| email | string | yes |
| facebook | string | yes |
| id | string | no |
| instagram | string | yes |
| phone | string | yes |
| telegram | string | yes |
| updated_at | string | no |
| whatsapp | string | yes |
| working_hours | string | yes |
| youtube | string | yes |

Relationships: none.

#### contact_inquiries
Inbound contact-form submissions from the public site (name, phone, email, message, status).

| Column | Type | Nullable |
|---|---|---|
| created_at | string | no |
| email | string | yes |
| id | string | no |
| message | string | yes |
| name | string | no |
| phone | string | yes |
| status | string | no |
| updated_at | string | no |

Relationships: none.

### Views

There are **no views** in the `public` schema. The `Views` block in `types.ts` is `{ [_ in never]: never }` (empty).

### Enums

#### app_role
Application RBAC role enumeration. Allowed values: `admin`, `user`, `director`, `sales_manager`, `salesperson`, `accountant`, `engineer`, `observer`.

---

# 2. RPC Functions (Stored Procedures)

Callable from the client via `supabase.rpc('name', { args })` → `POST https://smvbhwaupvbxqxqxzzjx.supabase.co/rest/v1/rpc/name`. These correspond exactly to the entries in the `public.Functions` block of `src/integrations/supabase/types.ts`; bodies live in `supabase/migrations/*.sql`. Nearly all are `SECURITY DEFINER` with `SET search_path = public` — they run with the definer's privileges and bypass RLS where needed, and most enforce their own role checks via `has_role` / `has_role_level`. `Args: never` means no parameters; `Returns: undefined` means `void`. Trigger-only and internal (non-callable) functions are listed in the final table.

### Roles & Permissions

#### get_user_role
- **Args:** `{ _user_id: string }`
- **Returns:** `app_role`
- **Purpose:** Returns the single `app_role` assigned to a user from `user_roles` (LIMIT 1). SECURITY DEFINER (sql, STABLE).

#### has_role
- **Args:** `{ _role: app_role; _user_id: string }`
- **Returns:** `boolean`
- **Purpose:** True if the user has exactly the given role. Core RLS/authorization predicate. SECURITY DEFINER (sql, STABLE).

#### has_role_level
- **Args:** `{ _min_role: app_role; _user_id: string }`
- **Returns:** `boolean`
- **Purpose:** True if the user's role meets or exceeds a minimum level in the hierarchy. SECURITY DEFINER (sql, STABLE).

#### has_custom_permission
- **Args:** `{ _required_level?: string; _section: string; _user_id: string }`
- **Returns:** `boolean`
- **Purpose:** True if the user has a custom per-section permission (`view_only`/`full_access`) in `employee_custom_permissions` at the required level, and (if temporary) is still active. `_required_level` defaults to `'view_only'`. SECURITY DEFINER (sql, STABLE).

#### is_temporary_employee_active
- **Args:** `{ _user_id: string }`
- **Returns:** `boolean`
- **Purpose:** True if the user has a non-expired, active row in `temporary_employees`. SECURITY DEFINER (sql, STABLE).

### Invites & Director Setup

#### create_user_invite
- **Args:** `{ invite_email: string; invite_role: app_role }`
- **Returns:** `Json`
- **Purpose:** Creates a `user_invites` row (`created_by = auth.uid()`) and returns id/email/role + an `/admin/register/<id>` link. Requires caller `director`/`admin`. SECURITY DEFINER (plpgsql).

#### validate_invite
- **Args:** `{ p_invite_id: string }`
- **Returns:** `{ email: string; id: string; role: app_role }[]`
- **Purpose:** Returns the minimal fields of an unused, non-expired invite so an unauthenticated registrant can validate it without exposing `user_invites`. SECURITY DEFINER (plpgsql).

#### accept_invite
- **Args:** `{ invite_id: string; user_password: string }`
- **Returns:** `Json`
- **Purpose:** Validates an unused/non-expired invite, marks it `used`, returns email/role. (Does not itself create the auth user; `user_password` is accepted but unused in the body.) SECURITY DEFINER (plpgsql).

#### assign_role_from_invite
- **Args:** `{ p_invite_id: string; p_user_id: string }`
- **Returns:** `Json`
- **Purpose:** Validates the invite, upserts the invited role into `user_roles`, marks invite used, calls `confirm_user_registration`. SECURITY DEFINER (plpgsql).

#### apply_invite_permissions
- **Args:** `{ p_expires_at: string; p_full_access: string[]; p_invite_id: string; p_is_temporary: boolean; p_user_id: string; p_view_only: string[] }`
- **Returns:** `undefined` (void)
- **Purpose:** Verifies invite email matches the user's profile email, then resets/inserts `employee_custom_permissions` and upserts/clears a `temporary_employees` row. SECURITY DEFINER (plpgsql).

#### confirm_user_registration
- **Args:** `{ user_id: string }`
- **Returns:** `Json`
- **Purpose:** No-op kept for backward compatibility/observability — email confirmation is handled by Supabase core. SECURITY DEFINER (plpgsql).

#### create_first_director
- **Args:** `{ director_email: string }`
- **Returns:** `Json`
- **Purpose:** Bootstraps the system: if no `director` exists yet, creates a `director` invite and returns its id/link; otherwise raises. SECURITY DEFINER (plpgsql).

#### register_specific_director
- **Args:** `{ director_email: string; user_id: string }`
- **Returns:** `Json`
- **Purpose:** Upserts the `director` role for a specific user (insert or update on conflict). SECURITY DEFINER (plpgsql).

#### get_pending_invites
- **Args:** `never`
- **Returns:** `{ created_at: string; email: string; expires_at: string; id: string; role: app_role }[]`
- **Purpose:** Lists all unused, non-expired invites, newest first. SECURITY DEFINER (sql).

### Clients & Access

#### get_user_accessible_clients
- **Args:** `{ user_id: string }`
- **Returns:** `{ company, created_at, created_by, email, id, last_contact, name, notes, phone, updated_at }[]` (all string)
- **Purpose:** All clients if user is `sales_manager`+, else only clients they created; ordered by `updated_at` desc. SECURITY DEFINER (sql).

#### archive_client
- **Args:** `{ p_client_id: string; p_user_id: string }`
- **Returns:** `undefined` (void)
- **Purpose:** Soft-archives a client (`archived`, `archived_at`, `archived_by`). Requires `director`/`admin`. SECURITY DEFINER (plpgsql).

#### archive_lead
- **Args:** `{ lead_id: string; user_id: string }`
- **Returns:** `undefined` (void)
- **Purpose:** Soft-archives a lead. SECURITY DEFINER (plpgsql).

#### log_clinic_activity
- **Args:** `{ p_action_description: string; p_action_type: string; p_changed_fields?: Json; p_client_id: string }`
- **Returns:** `string` (uuid of new log row)
- **Purpose:** Inserts an audit row into `clinic_activity_logs`, capturing caller id/email/name (from `profiles`). SECURITY DEFINER (plpgsql).

### Products

#### increment_product_views
- **Args:** `{ product_id: string }`
- **Returns:** `undefined` (void)
- **Purpose:** Increments `views_count` on a non-archived product, bumps `updated_at`. SECURITY DEFINER (plpgsql).

#### increment_product_quote_requests
- **Args:** `{ product_id: string }`
- **Returns:** `undefined` (void)
- **Purpose:** Increments `quote_requests_count` on a non-archived product, bumps `updated_at`. SECURITY DEFINER (plpgsql).

#### update_conversion_analytics
- **Args:** `{ p_date?: string; p_product_id: string }`
- **Returns:** `undefined` (void)
- **Purpose:** Computes views→quote conversion rate, upserts the daily `conversion_analytics` row, writes `conversion_rate` back onto the product. `p_date` defaults to `CURRENT_DATE`. SECURITY DEFINER (plpgsql).

#### archive_product
- **Args:** `{ product_id: string; user_id: string }`
- **Returns:** `undefined` (void)
- **Purpose:** Soft-archives a product. SECURITY DEFINER (plpgsql).

#### unarchive_product
- **Args:** `{ product_id: string }`
- **Returns:** `undefined` (void)
- **Purpose:** Restores a product by clearing archive fields. SECURITY DEFINER (plpgsql).

#### validate_product_category
- **Args:** `{ category_value: string }`
- **Returns:** `boolean`
- **Purpose:** True if `category_value` exists in `product_categories`. SECURITY DEFINER (plpgsql).

### Warehouse / Stock

#### get_low_stock_items
- **Args:** `never`
- **Returns:** `{ id: string; location: string; minimum_stock: number; name: Json; product_id: string; quantity: number }[]`
- **Purpose:** Non-archived `warehouse_items` with `notify_low_stock = true` and `quantity <= minimum_stock`, ordered by quantity asc. SECURITY DEFINER (sql).

#### get_clients_with_low_stock
- **Args:** `never`
- **Returns:** `{ client_id: string; client_name: string; critical_count: number; low_stock_count: number }[]`
- **Purpose:** Aggregates per-client `client_stock` to count low-stock and zero-stock (critical) items for non-archived clients flagged `notify_low_stock`. SECURITY DEFINER (sql).

#### archive_warehouse_item
- **Args:** `{ item_id: string; user_id: string }`
- **Returns:** `undefined` (void)
- **Purpose:** Soft-archives a warehouse item. Requires `director`/`admin`/`sales_manager`. SECURITY DEFINER (plpgsql).

#### unarchive_warehouse_item
- **Args:** `{ item_id: string }`
- **Returns:** `undefined` (void)
- **Purpose:** Restores a warehouse item by clearing its archive fields, bumps `updated_at`. SECURITY DEFINER (plpgsql).

### Employees & Metrics

#### get_employee_profiles
- **Args:** `never`
- **Returns:** `{ avatar_url: string; email: string; full_name: string; id: string }[]`
- **Purpose:** Basic profile fields for all employees, only if caller is `salesperson`+. SECURITY DEFINER (sql).

#### get_employees_with_roles
- **Args:** `never`
- **Returns:** `{ email: string; full_name: string; id: string; role: app_role }[]`
- **Purpose:** Joins `user_roles` to `profiles`; accessible to `salesperson`+ or `accountant`. SECURITY DEFINER (sql, STABLE).

#### get_employee_performance_metrics
- **Args:** `{ p_end_date?: string; p_start_date?: string; p_user_id: string }`
- **Returns:** `{ activity_breakdown: Json; daily_average: number; most_active_day: string; total_actions: number }[]`
- **Purpose:** Aggregates `employee_activity` for a user over a date window (defaults to last 30 days). SECURITY DEFINER (plpgsql).

#### log_employee_activity
- **Args:** `{ p_action_type: string; p_details?: Json; p_entity_id?: string; p_entity_type?: string; p_session_duration?: number }`
- **Returns:** `string` (uuid of new row)
- **Purpose:** Inserts a row into `employee_activity` for the current user (`auth.uid()`). SECURITY DEFINER (plpgsql).

### Logging / Stats

#### log_system_event
- **Args:** `{ p_category: string; p_details?: Json; p_ip_address?: unknown; p_level: string; p_message: string; p_stack_trace?: string; p_url?: string; p_user_agent?: string; p_user_id?: string }`
- **Returns:** `string` (uuid of the log row)
- **Purpose:** Inserts into `system_logs` and, for `error`/`security`/slow-`performance` events, auto-creates a matching `system_alerts` row. ⚠️ A frontend `resource_error` → this RPC loop once caused a logging storm — see project memory.
- SECURITY DEFINER (plpgsql).

#### get_log_statistics
- **Args:** `{ p_end_date?: string; p_start_date?: string }`
- **Returns:** `{ categories: Json; date: string; error_count: number; info_count: number; total_logs: number; warn_count: number }[]`
- **Purpose:** Per-day counts of `system_logs` plus per-category breakdown (defaults to last 7 days). SECURITY DEFINER (plpgsql).

#### cleanup_old_logs
- **Args:** `{ days_to_keep?: number }`
- **Returns:** `{ deleted_count: number }[]`
- **Purpose:** Deletes `system_logs` older than `days_to_keep` (default 90). Intended for scheduled cleanup. SECURITY DEFINER (plpgsql; note: no explicit `SET search_path`).

### Telegram

#### generate_telegram_link_code
- **Args:** `{ target_user_id: string }`
- **Returns:** `string` (6-char code)
- **Purpose:** Generates a 6-char alphanumeric code, stores it on `profiles` with a 15-min TTL, returns it. A user may generate their own; only `director`/`admin` may generate for another. `EXECUTE` granted to `authenticated`. SECURITY DEFINER (plpgsql).

### Misc

#### cleanup_abandoned_visits
- **Args:** `never`
- **Returns:** `number` (rows updated)
- **Purpose:** Marks `visits` stuck `in_progress` > 12h as `abandoned`. Typically run from cron. SECURITY DEFINER (plpgsql).

#### _audit_ip / _audit_ua
- **Args:** `never` → **Returns:** `unknown` / `string`
- **Purpose:** Internal audit helpers that resolve the current request IP / User-Agent for audit logging. Present in the Functions block but **not meant to be called directly**.

### Trigger & Internal (Non-Callable) Functions

These are **not** ordinary callables (either `RETURNS trigger` bound via `CREATE TRIGGER`, or `SECURITY DEFINER` helpers used inside RLS / other functions). Do **not** invoke via `supabase.rpc(...)`.

| Function | Kind / Fires on (table · event) | What it does |
|---|---|---|
| `handle_new_user` | Trigger — `auth.users` · AFTER INSERT | Inserts a default `user` role into `user_roles` for each new auth user. |
| `handle_new_user_profile` | Trigger — `auth.users` · AFTER INSERT | Upserts a `profiles` row (id, email, full_name); ON CONFLICT keeps existing name. |
| `update_updated_at_column` | Trigger — many tables · BEFORE UPDATE | Sets `NEW.updated_at = now()`. Shared generic timestamp trigger. |
| `update_clients_updated_at` | Trigger — `clients` · BEFORE UPDATE | Clients-specific `updated_at = now()`. |
| `update_contact_inquiries_updated_at` | Trigger — `contact_inquiries` · BEFORE UPDATE | Sets `updated_at = now()`. |
| `calculate_stock_depletion_date` | Trigger — `client_stock` · BEFORE INSERT/UPDATE OF quantity, average_monthly_consumption | Computes `estimated_depletion_date` from quantity ÷ monthly consumption. |
| `log_stock_change` | Trigger — `client_stock` · AFTER INSERT/UPDATE OF quantity | Writes initial/incoming/outgoing rows into `client_stock_transactions`. |
| `check_low_stock_alerts` | Trigger — `client_stock` · AFTER INSERT/UPDATE OF quantity | Creates a `client_stock_alerts` row when quantity falls to/below minimum and no open alert exists. |
| `log_user_activity` | Trigger — `leads`, `user_roles`, `deals`, `products`, `services`, `clients`, `tasks`, categories, `user_invites`, `employee_custom_permissions`, `temporary_employees` · AFTER INSERT/UPDATE/DELETE | Inserts into `user_activity_logs` (TG_OP, table, row id, old/new JSON) when `auth.uid()` is set. |
| `log_lead_changes` | Trigger — `leads` · AFTER UPDATE | Records lead field changes into the lead change/audit log. |
| `log_deal_changes` | Trigger — `deals` · AFTER INSERT/UPDATE/DELETE | Records deal changes into `deal_audit_log`. |
| `validate_product_category_change` | Trigger — `products` | Validates a product's category against allowed categories. |
| `validate_client_contract_status` | Trigger — `clients` · BEFORE INSERT/UPDATE | Raises if `contract_status` or `priority` is not an allowed value. |
| `can_access_lead(_user_id, _lead_id)` | Internal helper — `RETURNS boolean`, SECURITY DEFINER (leads RLS) | True if the user may access a given lead (role/assignment based). |
| `has_full_leads_access(_user_id)` | Internal helper — `RETURNS boolean`, SECURITY DEFINER (leads RLS) | True if the user has full (not just assigned) leads access. |
| `create_secure_director_setup()` | Internal helper — `RETURNS json`, SECURITY DEFINER | One-time secure director-setup token flow; not in `types.ts` Functions. |
| `use_director_setup_token(token, email, password)` | Internal helper — `RETURNS json`, SECURITY DEFINER | Consumes a director-setup token to provision the first director; not in `types.ts` Functions. |
| `create_user_account` | Internal/legacy | Older user-account creation helper, superseded by the invite flow; not in current `types.ts` Functions. |

---

# 3. Edge Functions (HTTP API)

**10 Supabase Edge Functions** (Deno). Base URL: `https://smvbhwaupvbxqxqxzzjx.supabase.co/functions/v1/<function-name>`. All set permissive CORS (`Access-Control-Allow-Origin: *`) and handle `OPTIONS` preflight.

**Auth models** (combine the platform `verify_jwt` gate from `supabase/config.toml` with in-code checks):

- **Platform JWT gate (`verify_jwt`)** — `config.toml` sets `verify_jwt = false` for 6 functions: `link-telegram`, `user-role`, `lead-create`, `client-stock-update`, `enqueue-notification`, `process-notifications`. The other 4 (`admin-user-management`, `delete-user`, `send-telegram-message`, `seed-warehouse`) use the default `verify_jwt = true` (gateway requires a valid Supabase JWT before the handler runs).
- **In-code bot-secret** — `lead-create`, `link-telegram`, `user-role`, `client-stock-update`, `enqueue-notification` compare `Authorization: Bearer <token>` against `BOT_BACKEND_JWT`. Meant for an **external Telegram bot backend**, not browsers.
- **In-code Supabase-user/role** — `admin-user-management` and `delete-user` verify the caller via `auth.getUser()` and check `user_roles.role`.
- **No app auth** — `send-telegram-message` (platform JWT only), `process-notifications` (cron worker), `seed-warehouse` (one-shot seeder).

Every DB-touching function uses the **service role** (`SUPABASE_SERVICE_ROLE_KEY`), bypassing RLS. Common env/secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `BOT_BACKEND_JWT`, `TELEGRAM_BOT_TOKEN`. Only 3 functions are called from `src/`: `admin-user-management`, `delete-user`, `send-telegram-message`.

### admin-user-management
- **URL/Method:** `POST /functions/v1/admin-user-management` (+ `OPTIONS`).
- **Auth:** `verify_jwt = true`. Requires `Authorization: Bearer <session-token>`; `auth.getUser()` must succeed, then `user_roles.role` must be **`director`**.
- **Body:** `action` (string, required — only `"updateUser"` implemented), `userId` (string, required), `email?`, `password?`, `role?`.
- **Response:** `200 { success: true, message: "Пользователь обновлен" }`; `400 { error }` for everything else (auth, role, unknown action, thrown errors).
- **Side effects:** RPC `log_system_event`; `auth.admin.updateUserById(userId, { email?, password? })`; updates `user_roles.role`.
- **Called from:** `src/features/admin/components/EditEmployeeModal.tsx:75` (via `fetch` with session token).

### delete-user
- **URL/Method:** `POST /functions/v1/delete-user` (+ `OPTIONS`).
- **Auth:** `verify_jwt = true`. `auth.getUser()` must succeed; `user_roles.role` must be in `['director','admin']` (else `403`).
- **Body:** `userId` (string, required) — else `400 { error: "User ID is required" }`.
- **Response:** `200 { success: true, message: "User deleted successfully" }`; `401`/`403`/`400`/`500 { error }`.
- **Side effects:** RPC `log_system_event`; deletes from `employee_custom_permissions`, `temporary_employees`, `user_roles`, `profiles`, then `auth.admin.deleteUser(userId)`.
- **Called from:** `src/features/admin/pages/EmployeeManagement.tsx:308` (via `fetch` with session token).

### send-telegram-message
- **URL/Method:** `POST /functions/v1/send-telegram-message` (+ `OPTIONS`).
- **Auth:** `verify_jwt = true` (session JWT sent automatically by `supabase.functions.invoke`). No in-code role check. Requires `TELEGRAM_BOT_TOKEN`.
- **Body:** `chat_id` (string|number, required), `message` (string, required → sent as HTML), `client_id?` (accepted but unused).
- **Response:** `200 { success: true, message, telegram_response }`; `500 { success: false, error }`.
- **Side effects:** External `POST https://api.telegram.org/bot<token>/sendMessage`. No DB writes (caller logs the interaction separately).
- **Called from:** `src/features/admin/components/Clients/ClientAlertsTab.tsx:79` (`supabase.functions.invoke('send-telegram-message', { body: { chat_id, message, client_id } })`); caller then inserts into `client_interaction_logs`.

### lead-create
- **URL/Method:** `POST /functions/v1/lead-create` (+ `OPTIONS`).
- **Auth:** `verify_jwt = false`. In-code: `Authorization: Bearer <BOT_BACKEND_JWT>` (`401` missing, `403` mismatch).
- **Body:** `name` (from `name`‖`full_name`‖`fio`, required, ≤100); `phone` (from `phone`‖`phone_number`, required, `^\+?[1-9]\d{6,14}$`); `email?` (≤255, format-checked); `company?` (≤200); `source?` (default `'tg_bot'`); `notes?` (≤1000).
- **Response:** `200 { ok: true, id }`; `400 { error }`; `401`/`403`; `500 { error }`.
- **Side effects:** Inserts into `leads` (`{ name, phone, email, company, source, stage:'new', notes }`).
- **Called from:** external Telegram bot backend (not in `src/`).
- **curl:**
  ```bash
  curl -X POST 'https://smvbhwaupvbxqxqxzzjx.supabase.co/functions/v1/lead-create' \
    -H 'apikey: <ANON_KEY>' -H 'Authorization: Bearer <BOT_BACKEND_JWT>' \
    -H 'Content-Type: application/json' \
    -d '{"name":"Иван","phone":"+998901234567","source":"tg_bot","notes":"interested"}'
  ```

### link-telegram
- **URL/Method:** `POST /functions/v1/link-telegram` (+ `OPTIONS`).
- **Auth:** `verify_jwt = false`. In-code `BOT_BACKEND_JWT` (`401`/`403`).
- **Body:** `userId` (string, required), `telegramId` (number/string, required), `username?` (→ `profiles.telegram_username`). Missing required → `400 { error: "Missing required fields" }`.
- **Response:** `200 { success: true, profile }`; `401`/`403`/`400`/`500`.
- **Side effects:** Updates `profiles` (`telegram_id`, `telegram_username`) where `id = userId`.
- **Called from:** external Telegram bot backend.

### user-role
- **URL/Method:** `GET` and `POST /functions/v1/user-role` (+ `OPTIONS`).
- **Auth:** `verify_jwt = false`. In-code `BOT_BACKEND_JWT` on both verbs.
- **Input:** GET `?tg_id=<int>` (lookup by `telegram_id`); POST `{ userId?, telegramId|tg_id? }`. At least one identifier required (`400` otherwise); `userId` takes precedence.
- **Response:** found+role → `200 { user_id, role }`; found w/o role → `200 { userId, email, fullName, role:"user", telegramLinked }`; not found → `404`; `401`/`403`/`400`/`500`.
- **Side effects:** Read-only (`profiles`, `user_roles`).
- **Called from:** external Telegram bot backend.
- **curl:**
  ```bash
  curl 'https://smvbhwaupvbxqxqxzzjx.supabase.co/functions/v1/user-role?tg_id=123456789' \
    -H 'apikey: <ANON_KEY>' -H 'Authorization: Bearer <BOT_BACKEND_JWT>'
  ```

### client-stock-update
- **URL/Method:** `POST /functions/v1/client-stock-update` (+ `OPTIONS`).
- **Auth:** `verify_jwt = false`. In-code `BOT_BACKEND_JWT` (`401`/`403`).
- **Body:** `clientId` (string, required), `stockData` (JSON, required), `updatedBy?`. Missing required → `400`.
- **Response:** `200 { success: true, client }`; `401`/`403`/`400`/`500`.
- **Side effects:** Updates `clients` (`stock_info`, `last_stock_update = now`, `updated_by`). ⚠️ `stock_info`/`last_stock_update` are not in the generated `clients` type — see [Known inconsistencies](#6-known-inconsistencies); code comments mark the mapping as a placeholder.
- **Called from:** external Telegram bot backend.

### enqueue-notification
- **URL/Method:** `POST /functions/v1/enqueue-notification` (+ `OPTIONS`).
- **Auth:** `verify_jwt = false`. In-code `BOT_BACKEND_JWT` (`401`/`403`).
- **Body:** `userId` (string, required), `message` (string, required), `priority?` (default `'normal'`), `scheduledFor?` (ISO, default now). Missing required → `400`.
- **Response:** `200 { success: true, notification }`; `401`/`403`/`400`/`500`.
- **Side effects:** Inserts into `notification_queue` (`{ user_id, message, priority, status:'pending', scheduled_for }`). ⚠️ Column set differs from the generated `notification_queue` type — see [Known inconsistencies](#6-known-inconsistencies). Delivery is performed later by `process-notifications`.
- **Called from:** external Telegram bot backend.

### process-notifications
- **URL/Method:** any verb (+ `OPTIONS`); designed for cron/scheduler.
- **Auth:** `verify_jwt = false`, **no in-code auth check** (only needs `TELEGRAM_BOT_TOKEN`). Internal worker — should be scheduler-triggered, not public.
- **Body:** none.
- **Response:** `200 { processed: 0, message }` (empty queue) / `200 { processed, failed }` / `500 { error }`.
- **Side effects:** Reads ≤10 `notification_queue` rows joined `profiles!inner(telegram_id)` where `status='pending'` and `scheduled_for <= now`, ordered by priority desc then created_at asc; sends each via Telegram; updates rows to `sent`/`failed` with `sent_at`/`error`.
- **Called from:** internal cron/scheduled worker (companion to `enqueue-notification`).

### seed-warehouse
- **URL/Method:** any verb (+ `OPTIONS`). Has its own `deno.json` import map.
- **Auth:** `verify_jwt = true`, no in-code auth check. Uses service-role client.
- **Body:** none (inserts a hard-coded list of 2 sample items).
- **Response:** `200 { success: true, items }`; `400 { error }`.
- **Side effects:** Inserts 2 fixed sample rows into `warehouse_items`.
- **Called from:** internal one-shot seeder (manual); not a recurring/public endpoint.

---

# 4. Client Data-Access Layer

The frontend talks to Supabase through the single shared client at `src/integrations/supabase/client.ts`. **Note:** although `@tanstack/react-query` is installed and a `QueryClientProvider` wraps the app (`src/App.tsx`), **react-query is effectively unused** — there are zero `useQuery`/`useMutation` calls. All data access is hand-rolled: domain hooks under `src/hooks/` wrap `supabase.from(...)` / `supabase.rpc(...)` inside `useState` + `useEffect` + `useCallback`, exposing `{ data, loading, error, ...mutators, refetch }`. Mutators call the relevant method then re-invoke the hook's `fetch*()` to refresh local state (no cache invalidation layer). Errors surface via shadcn `useToast` or `sonner`.

### Auth
- **State hook (no Context/Provider):** `src/hooks/useAuth.ts` is the single source of session state — registers `supabase.auth.onAuthStateChange(...)`, seeds with `getSession()`, exposes `{ user, session, loading, signOut }`. `src/hooks/useUserRole.ts` resolves the role via the `get_user_role` RPC.
- **signInWithPassword:** `src/pages/Auth.tsx:32`, `src/features/admin/components/AdminAuth.tsx:28`, `src/pages/DirectorRegistration.tsx:78`.
- **signUp:** `src/pages/RegisterWithInvite.tsx:111`, `src/pages/DirectorRegistration.tsx:43`, `src/features/admin/pages/UserManagement.tsx:118`.
- **signOut:** `src/hooks/useAuth.ts:31`, `src/components/auth/LogoutButton.tsx:18` (`{ scope: 'global' }`), `src/pages/RegisterWithInvite.tsx:107`.
- **getSession** (to grab `access_token` for edge-function fetches): `EmployeeManagement.tsx:300`, `EditEmployeeModal.tsx:69`, `RegisterWithInvite.tsx:103`.
- **getUser** (stamps `created_by`/`archived_by`/`updated_by`, gates writes): most data hooks + several pages/components.
- **Admin auth APIs:** `auth.admin.listUsers()` (`UserManagement.tsx:64`), `auth.admin.getUserById(...)` (`DirectorDashboardMetrics.tsx:108`) — require the service role; ⚠️ will fail under the anon key (see [Known inconsistencies](#6-known-inconsistencies)).
- **Route gating:** `src/features/admin/components/AdminWrapper.tsx` (`useAuth` + `useUserRole`).
- Not used: `resetPasswordForEmail`, `updateUser`, `verifyOtp`, `setSession`, `refreshSession`.

### Data Fetching / Hooks
Uniform pattern: `useState` for data/loading/error, async `fetch*` awaiting `supabase.from('table').select(...)`, throws on error, runs from `useEffect`. Some list queries override PostgREST's 1000-row cap with `.range(0, 4999)` (e.g. `useProducts`, `useLeads`).

| Hook (file) | Table(s) | Kind |
|---|---|---|
| `useProducts.ts` (`useProducts`, `useAdminProducts`, `useProduct`, `useAdminProduct`) | `products` | query + insert/update/delete/archive |
| `useLeads.ts` | `leads`, `user_roles` | query + add/update + `archive_lead` RPC; auto-assigns lead to salesperson |
| `useClients.ts` | `clients` | query + mutators + `archive_client` / `get_clients_with_low_stock` RPCs |
| `useDeals.ts` | `deals` | query + create (stamps `created_by`) |
| `useDealItems.ts` | `deal_products`, `deal_services` | query + mutators |
| `useServices.ts` | `services`, `service_categories` | query + create/update |
| `useCategories.ts` | `product_categories`, `products` | query + mutators |
| `useManufacturers.ts` | `manufacturers`, `products` | query + mutators |
| `useWarehouse.ts` | `warehouse_items`, `warehouse_activity_logs`, `profiles` | query + mutators + `archive_warehouse_item` / `get_low_stock_items` RPCs |
| `useClientStock.ts` | `client_stock`, `client_stock_alerts`, `client_stock_transactions` | query + mutators |
| `useTasks.ts` | `tasks` | query + create |
| `useLeadActivities.ts` | `lead_activities` | query + insert; **realtime subscription** |
| `useLeadMerge.ts` | `leads`, `user_activity_logs` | merge mutators |
| `useCustomPermissions.ts` / `useUserPermissions.ts` | `employee_custom_permissions`, `temporary_employees` | permission lookups for UI gating |
| `useAnalytics.ts` | `products`, `employee_activity`, `conversion_analytics` | reads + `get_employee_performance_metrics` / `log_employee_activity` / `update_conversion_analytics` RPCs |
| `useArchivedData.ts` | `leads`, `products` | query + `unarchive_product` RPC |
| `useEmployeesByRole.ts` | RPC `get_employees_with_roles` | query |
| `useUserRole.ts` | RPC `get_user_role` | query |
| `features/admin/components/Visits/useVisits.ts` | `visits`, `visit_stages`, `profiles`, `clients` | query + storage signed URLs |

Direct `supabase.from(...)` also appears outside hooks (e.g. `features/crm/pages/Leads.tsx`, `features/crm/components/{KanbanBoard,LeadModal,ViewLeadModal,UnifiedLeadModal,DealAuditLog}.tsx`, `features/admin/pages/{UserManagement,Employees,EmployeeManagement,AdminContacts,ActivityLogs}.tsx`, `pages/Contacts.tsx`).

### RPC usage (file:line)
- **Invites/onboarding:** `validate_invite`, `assign_role_from_invite`, `apply_invite_permissions` (`RegisterWithInvite.tsx:45,132,153`); `assign_role_from_invite` (`useResolveInviteRole.ts:48`); `register_specific_director` (`DirectorRegistration.tsx:55`); `create_first_director` (`CreateFirstDirector.tsx:43`); `create_user_invite` (`EmployeeManagement.tsx:223`).
- **Roles/employees:** `get_user_role` (`useUserRole.ts:20`); `get_employees_with_roles` (`useEmployeesByRole.ts:19`); `get_employee_profiles` (`EmployeeManagement.tsx:108`, `Employees.tsx:77`).
- **Archiving:** `archive_client` + `get_clients_with_low_stock` (`useClients.ts:149,166`); `archive_lead` (`useLeads.ts:157`, `Leads.tsx:446`); `archive_warehouse_item` + `get_low_stock_items` (`useWarehouse.ts:205,227`); `unarchive_product` (`useArchivedData.ts:51`).
- **Analytics:** `get_employee_performance_metrics`, `log_employee_activity`, `update_conversion_analytics` (`useAnalytics.ts:136,167,189`); `log_employee_activity` (`useActivityLogger.ts:17`).
- **Logging:** `log_system_event` (`lib/logger.ts:48,81,103`, `utils/globalErrorHandler.ts:95,126`, `components/providers/ErrorBoundary.tsx:43`, `useSystemLogger.ts:24`); `log_clinic_activity` (`useClinicActivityLogs.ts:69`); `get_log_statistics` + `cleanup_old_logs` (`components/admin/MonitoringDashboard.tsx:85,102`).

### Edge Function usage
- **`send-telegram-message`** via `supabase.functions.invoke(...)` — `ClientAlertsTab.tsx:79`, body `{ chat_id, message, client_id }`.
- **`delete-user`** via direct `fetch` to `/functions/v1/` with `Authorization: Bearer <session.access_token>` — `EmployeeManagement.tsx:308`, POST `{ userId }`.
- **`admin-user-management`** via direct `fetch` — `EditEmployeeModal.tsx:75`, POST `{ action:'updateUser', userId, email?, password?, role? }`.

### Storage
- **`product-images`** — uploads + `getPublicUrl` (+ delete): `ProductImageUpload.tsx:46,55`, `ImageUpload.tsx:61,71,102`.
- **`deal-documents`** — deal file uploads: `CreateDeal.tsx:334` (`.upload`); metadata then inserted into the `deal_documents` table at `:341`.
- **`clinic-documents`** — clinic upload/download/remove: `ClinicDocumentsTab.tsx:67,101,120`; metadata in the `clinic_documents` table.
- **`visits`** — visit photos via **signed URLs** (`createSignedUrl(path, 3600)`): `useVisits.ts:122`.

### Realtime
Used in exactly two places (both `postgres_changes` on `public`, re-running a fetch on change, cleaned up with `removeChannel`):
- `useLeadActivities.ts:134-153` — channel `lead-activities-changes`, table `lead_activities`, `event:'*'`, filter `lead_id=eq.<id>`.
- `features/admin/components/Warehouse/WarehouseActivityLog.tsx:25-42` — channel `warehouse-activity-logs`, table `warehouse_activity_logs`, `event:'INSERT'`.

No realtime broadcast or presence usage elsewhere.

### Conventions
- **Cache:** none (react-query dormant). Freshness via hooks re-calling `fetch*()` after mutations. The `QueryClient` in `App.tsx:33` (`staleTime:5m`, `gcTime:10m`, `retry:2`, `refetchOnWindowFocus:false`) is configured but unused.
- **Errors/toasts:** per-call try/catch → shadcn `useToast` (`toast({ title, description, variant:'destructive' })`) or `sonner` `toast.error(...)`; hooks also store an `error` string. A global handler (`utils/globalErrorHandler.ts`, wired in `App.tsx` via `setupGlobalErrorHandling()`) + React `ErrorBoundary` forward to the `log_system_event` RPC. `secureLog` (`lib/logger.ts`) routes `error`/`auth`/`security` events to `log_system_event` and redacts sensitive fields. (Per project memory, this client→`log_system_event` path previously caused a logging storm.)
- **i18n:** `src/i18n/config.ts` initializes `i18next` (`en`/`ru`/`uz`, default/fallback `ru`, detection `querystring(lang)→localStorage→navigator→htmlTag`). Localized content rows store `{ ru, en, uz }` objects.

---

# 5. Site Routes and Pages

Single-page app using **React Router v6** (`BrowserRouter`, `src/App.tsx`). Production host: `https://medsc.uz`. There are two route trees:

- **Public site** (`/*`) — wrapped in `Header` + `Footer`, no auth required (except the auth/registration helper pages).
- **Admin / CRM panel** (`/admin/*`) — rendered by `AdminWrapper` (`src/features/admin/components/AdminWrapper.tsx`), which gates on a logged-in user whose `app_role` is in `['director','admin','sales_manager','salesperson','accountant','engineer','observer']`. Individual routes are further gated by `<ProtectedRoute permission=...>`; failing the per-route permission shows an inline "Доступ запрещен" instead of the page. Routes live under `AdminLayout` (shared sidebar/shell).

`ScrollToTop` resets scroll on navigation. Unknown public paths render `NotFound` (404).

### Public routes

| Path | Component (file) | Purpose / notes |
|---|---|---|
| `/` | `pages/Home.tsx` | Landing page. |
| `/catalog` | `pages/Catalog.tsx` | Product catalog. Query params: `?search=<text>`, `?category=<value>`, `?manufacturer=<slug>`. |
| `/catalog/:manufacturerSlug/:productSlug` | `pages/ProductDetail.tsx` | **Canonical product URL.** |
| `/catalog/:productSlug` | `pages/ProductDetail.tsx` | Product without a manufacturer segment. |
| `/catalog/products/:slug` | `ProductRedirect` (App.tsx) | Legacy → redirects to `/catalog/unknown-manufacturer/:slug`. |
| `/product/:id` | `ProductRedirect` | Legacy → `/catalog/unknown-manufacturer/:id`. |
| `/products/:id` | `ProductRedirect` | Legacy → `/catalog/unknown-manufacturer/:id`. |
| `/services` | `pages/Services.tsx` | Services listing. |
| `/cases` | `pages/Cases.tsx` | Case studies / portfolio. |
| `/about` | `pages/About.tsx` | About page. |
| `/privacy-policy` | `pages/PrivacyPolicy.tsx` | Privacy policy. |
| `/contacts` | `pages/Contacts.tsx` | Contacts + inbound inquiry form (`contact_inquiries`, `site_contacts`). |
| `/auth` | `pages/Auth.tsx` | Login (`signInWithPassword`). |
| `/setup-director` | `pages/CreateFirstDirector.tsx` | One-time bootstrap → `create_first_director` RPC. |
| `/director-registration` | `pages/DirectorRegistration.tsx` | Director registration → `register_specific_director` RPC. |
| `*` | `pages/NotFound.tsx` | 404. |

### Admin / CRM routes (`/admin/*`)

All require auth + allowed role (above). The **Required permission** column is the `ProtectedRoute permission` prop (array = any-of); "—" means no extra per-route gate beyond the wrapper.

| Path | Component (file) | Required permission |
|---|---|---|
| `/admin` (index) | `features/admin/pages/Dashboard.tsx` | — |
| `/admin/dashboard` | `Dashboard.tsx` | — |
| `/admin/leads` | `features/crm/pages/Leads.tsx` | `view_all_leads` |
| `/admin/deals` | `features/crm/pages/DealsPage.tsx` | `view_deals` ‖ `manage_deals` |
| `/admin/deals/create` | `features/crm/pages/CreateDeal.tsx` | `manage_deals` |
| `/admin/tasks` | `features/crm/pages/TasksPage.tsx` | `view_tasks` ‖ `manage_tasks` |
| `/admin/kanban` | `features/admin/pages/AdminKanban.tsx` | `view_kanban` |
| `/admin/products` | `features/products/pages/AdminProducts.tsx` | `view_products` ‖ `manage_products` |
| `/admin/products/add` | `features/products/pages/AddProduct.tsx` | `manage_products` |
| `/admin/products/edit/:id` | `features/products/pages/EditProduct.tsx` | `manage_products` |
| `/admin/products/preview/:id` | `features/products/pages/AdminProductPreview.tsx` | `view_products` ‖ `manage_products` |
| `/admin/categories` | `features/admin/pages/Categories.tsx` | `view_categories` ‖ `manage_categories` |
| `/admin/services` | `features/admin/pages/AdminServices.tsx` | `view_services` ‖ `manage_services` |
| `/admin/contacts` | `features/admin/pages/AdminContacts.tsx` | `view_contacts` ‖ `manage_contacts` |
| `/admin/warehouse` | `features/admin/pages/Warehouse.tsx` | `view_products` ‖ `manage_products` |
| `/admin/clinics` | `features/admin/pages/Clinics.tsx` | `view_products` ‖ `manage_products` |
| `/admin/visits` | `features/admin/pages/VisitsPage.tsx` | — (only the wrapper role gate; Telegram-bot field visits) |
| `/admin/archived` | `features/admin/pages/ArchivedData.tsx` | `view_archive` |
| `/admin/employees` | `features/admin/pages/EmployeeManagement.tsx` | `manage_users` |
| `/admin/users` | `features/admin/pages/UserManagement.tsx` | `manage_users` |
| `/admin/activity` | `features/admin/pages/ActivityLogs.tsx` | `view_activity_logs` |
| `/admin/login` | `AdminAuth.tsx` | — (login form) |
| `/admin/register/:inviteId` | `pages/RegisterWithInvite.tsx` | **No auth** — invite registration (`validate_invite` → `assign_role_from_invite` → `apply_invite_permissions`). |
| `/admin/director-registration` | `pages/DirectorRegistration.tsx` | **No auth** — director registration. |

> Note: `/admin/warehouse` and `/admin/clinics` reuse the `view_products`/`manage_products` permission keys rather than dedicated warehouse/clinic permissions; `/admin/visits` has no `ProtectedRoute` at all (any allowed role can open it).

### SEO build artifacts (paths shipped at build time)

- **Prerendered static shells** (`scripts/generate-route-shells.mjs`, run in `npm run build`) for: `/`, `/catalog`, `/services`, `/cases`, `/about`, `/contacts` — each gets a canonical-tagged HTML shell.
- **`sitemap.xml`** (`scripts/generate-sitemap.mjs`, host `SITE_URL` default `https://medsc.uz`) lists the static pages plus dynamic, DB-derived URLs:
  - `/catalog?category=<value>` — one per `product_categories.value`.
  - `/catalog?manufacturer=<slug>` — one per `manufacturers.slug`.
  - Product canonicals `/catalog/<manufacturerSlug>/<productSlug>` (or `/catalog/<productSlug>` when no manufacturer), for every `products` row with `status = 'active'` and not archived (`slug` falls back to `id`).

---

# 6. Known inconsistencies

Cross-checking the edge functions against the generated schema (`types.ts`) surfaced mismatches worth knowing before relying on them:

1. **`notification_queue` column mismatch.** `enqueue-notification` inserts `{ user_id, message, priority, status, scheduled_for }` and `process-notifications` reads/writes `scheduled_for`, `sent_at`, `error`. But the generated `notification_queue` type has `{ id, payload, planned_at, sent_at, status, template_id, user_id }` — no `message`, `priority`, `scheduled_for`, or `error`. Either the notification edge functions target a differently-shaped table than the committed migration/types, or `types.ts` is stale for this table. Verify against the live DB before depending on either path.

2. **`clients.stock_info` / `last_stock_update` don't exist in the type.** `client-stock-update` writes `stock_info` and `last_stock_update` on `clients`, but the generated `clients` type has neither (it does have `updated_by`). The function's own code comments flag the mapping as a placeholder. Treat this endpoint as unverified against the current schema.

3. **`auth.admin.*` called from the browser.** `UserManagement.tsx` (`listUsers`) and `DirectorDashboardMetrics.tsx` (`getUserById`) call admin Auth APIs from the client, which require the service-role key. Under the embedded anon key these calls will fail/return empty — admin user listing should go through an edge function (as `delete-user` / `admin-user-management` already do).

4. **react-query is installed but dormant.** A `QueryClientProvider` is configured yet no `useQuery`/`useMutation` exists; all fetching is manual `useState`/`useEffect`. Not a bug, but relevant when reasoning about caching/invalidation.

> Regenerate `src/integrations/supabase/types.ts` from the live project (`supabase gen types typescript --project-id smvbhwaupvbxqxqxzzjx`) to confirm items 1–2 before building on the notification or client-stock flows.
