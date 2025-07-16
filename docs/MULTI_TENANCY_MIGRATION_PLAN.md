# Full Migration Plan – Turning Your Current App into a Clean Multi-Tenant SaaS

_Repository snapshot analysed: backend (~1000-line controller files, Mongoose, Express); frontend (React)._

## Contents
1. Objectives
2. High-Level Strategy
3. Pre-Migration House-Keeping
4. Database Layer Changes
5. API Layer Changes
6. Auth & Security Hardening
7. Data Migration Script
8. CI/CD & Environment Setup
9. Testing Checklist
10. Post-Migration Refactor (splitting big files)
11. Risk Matrix & Roll-Back Plan
12. Custom Domains & Google OAuth

---

## 1 Objectives
* **Data isolation** – no cross-tenant leaks.
* **Low operational cost** – shared cluster at first, easy to split later.
* **Minimal code churn** – avoid a months-long freeze.
* **Incremental rollout** – feature flags + dark launches.

## 2 High-Level Strategy
```
Phase 0 ▶  Backup + branch freeze
Phase 1 ▶  Add Tenant model + field (no behaviour change)
Phase 2 ▶  Middleware to inject tenant context
Phase 3 ▶  Adapt reads & writes via plugin
Phase 4 ▶  Backfill existing documents with tenantId
Phase 5 ▶  Activate sub-domain routing per tenant
Phase 6 ▶  End-to-end tests, smoke in staging
Phase 7 ▶  Production enable, monitor
```
Splitting 1000-line controller files **comes after Phase 7** so we don't mix refactor bugs with tenancy bugs. You'll touch those files anyway to add the plugin calls; leave them monolithic until the multi-tenant release is stable.

## 3 Pre-Migration House-Keeping
1. **Create a Git branch** `feature/multi-tenant`.
2. **Enable lint + prettier** in CI so future refactors don't add noise.
3. **Add unit-test baseline** (at least one test per major controller) so regressions surface fast.
4. **Tag** current prod commit (`v1.0.0-singletenant`) for roll-back.

## 4 Database Layer Changes
| Task | Who | Effort |
| --- | --- | --- |
| 4.1 Create `Tenant` schema (id, name, subdomain) | BE dev | 10 min |
| 4.2 Add `tenantId` field to **every** other schema (5-line snippet) | BE dev | 2 h |
| 4.3 Write `withTenant` Mongoose plugin | BE dev | 20 min |
| 4.4 Add compound indexes `{ tenantId, <primaryField> }` | DBA | 30 min |

> Best practice: **single collection per model** + indexed `tenantId` performs better than 50 small collections.

### Example patch to a model
```diff
 const exerciseSchema = new mongoose.Schema({
+  tenantId: {
+    type: mongoose.Schema.Types.ObjectId,
+    required: true,
+    index: true,
+    ref: 'Tenant',
+  },
   name: String,
   videoUrl: String,
   …
 });
 exerciseSchema.plugin(withTenant);
```

## 5 API Layer Changes
| File | Action |
| --- | --- |
| `middleware/tenantMiddleware.js` | New file – resolves tenant from sub-domain or header |
| `server.js` | `app.use(tenantMiddleware)` _before_ auth |
| Controllers | Replace `Model.find()` ➜ `Model.find({}, null, { tenantId: req.tenant._id })` (the plugin will inject) |
| File uploads | Prefix S3/Cloudinary keys with `tenantId/` |

### Keep it compile-time safe
* Add `declare global { namespace Express { interface Request { tenant?: ITenant } } }` to a `types.d.ts` if you ever migrate to TS.

## 6 Auth & Security Hardening
1. **JWT payload**: `{ userId, tenantId, sessionId }` (so sockets can also pick it up).
2. **Rate-limit** per tenant not per IP (use `express-rate-limit` store keyed on `tenantId`).
3. **Audit logs**: add a tiny schema to record `{ tenantId, userId, action, at }`.

## 7 Data Migration Script
* Create `/backend/scripts/backfillTenant.js`.
* For each tenant in a CSV: `{subdomain,name,ObjectId}`
  * Query users with email like `@gyma.com`, derive tenantId, update.
  * Repeat for collections/exercises/etc.
* Wrap in `session.withTransaction()` so a failure rolls back.
* Run on staging first.

## 8 CI/CD & Environment Setup
| Environment | URL | DB | Notes |
| --- | --- | --- | --- |
| Local | `*.localhost` | Local Mongo | Dev uses header fallback |
| Staging | `*.stage.yourapp.com` | Atlas M0 | Seed two test tenants |
| Prod | `*.yourapp.com` | Atlas M2 | Point customer CNAME records here |

*Add Vercel wildcard domain; set `VITE_TENANT_SUBDOMAIN` in frontend so React fetches right API origin.*

## 9 Testing Checklist
- [ ] Unit tests pass on branch
- [ ] Cypress e2e under two sub-domains (no data leak)
- [ ] 429 rate-limits separate per tenant
- [ ] Data migration dry-run produces zero diff on random docs

## 10 Post-Migration Refactor (Splitting Big Files)
1. **Controller split**: move each route group into its own file (`collection/`, `exercise/` folders).
2. **Service layer**: extract DB logic into `/services/*.js` – now tenancy is just another param.
3. **Feature toggles**: add per-tenant config (branding, enabled modules) via a `tenantSettings` collection.

_Do this after release so git diffs stay clean._

## 11 Risk Matrix & Roll-Back Plan
| Risk | Mitigation | Roll-back |
| --- | --- | --- |
| Data leakage | Automated test that signs in as Tenant-A then tries to fetch Tenant-B doc | Re-deploy tag `v1.0.0-singletenant` |
| Bad migration | Run migration inside txn + backup dump | Restore dump + switch DNS back |
| Performance regression | Enable APM, alert at P95>300 ms | Scale Atlas or revert plugin |

---

### Estimated Timeline (1 dev)
| Phase | Days |
| ---- | ---- |
| House-keeping | 1 |
| Schema + plugin | 1 |
| Middleware + controller patch | 2 |
| Migration script + dry-run | 1 |
| Staging tests | 1 |
| Production rollout | 0.5 |
| Post-migration refactor | 2-3 |

_Total ≈ 1 week of focused work._

---

**Key take-away:** build the multi-tenant layer first while _keeping_ the big files; once stable, gradually break those files into cleaner service/controller modules. This avoids mixing two large refactors and makes debugging straightforward.

## 12 Custom Domains & Google OAuth
If a tenant wants a **unique domain** (`gym-alpha.com`) instead of a sub-domain, only two small changes are required.

1. **Tenant schema** – add an optional `domain` field:
```diff
 const tenantSchema = new mongoose.Schema({
   name: String,
   subdomain: String,
+  domain: String, // new – e.g. "gym-alpha.com"
   createdAt: { type: Date, default: Date.now },
 });
```

2. **tenantMiddleware.js** – look up by full host name first, fall back to sub-domain:
```js
const host = req.headers.host.toLowerCase();
let tenant = await Tenant.findOne({ domain: host });
if (!tenant) {
  const sub = host.split('.')[0];
  tenant = await Tenant.findOne({ subdomain: sub });
}
```

### 12.1  Google OAuth Redirects
Choose one of three patterns:

| Pattern | Redirect URI example | Setup work |
| --- | --- | --- |
| Central auth (fast) | `https://auth.yourapp.com/api/auth/google/callback` | No per-tenant Google changes |
| Per-domain (white-label) | `https://gym-alpha.com/api/auth/google/callback` | Add each domain to Google → OAuth screen & redirect list |
| Separate credentials | one Google Cloud project per tenant | Only if a tenant insists |

Dynamic redirect URI code:
```js
const host = req.headers.host;
const redirectUri = `https://${host}/api/auth/google/callback`;
```

Google Cloud limits to **100 authorised domains per project**, so after that you would either consolidate under central auth or create a second Google Cloud project.

### 12.2  Deployment Checklist for a Custom Domain
1. Add the domain inside **Vercel → Settings → Domains** (Pro plan gives unlimited domains).
2. Ask the tenant to create the CNAME record Vercel shows.
3. Insert tenant row with `{ domain: 'gym-alpha.com' }`.
4. (Optional) Add domain to Google OAuth authorised domains.
5. Smoke-test `https://gym-alpha.com` — it should load its isolated data.

_No further DB or controller changes are needed; the `tenantId` logic stays the same._ 