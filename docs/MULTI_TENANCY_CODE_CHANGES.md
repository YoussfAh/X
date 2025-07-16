# Multi-Tenant Upgrade – Code Change Cheat-Sheet

_Use this as a playbook while you edit the repo. Follow the order, commit often._

---

## 1 New Files to Add
| Path | Purpose |
| ---- | ------- |
| `backend/models/tenantModel.js` | Stores tenant info (name, subdomain) |
| `backend/middleware/tenantMiddleware.js` | Detects tenant from sub-domain or header and attaches `req.tenant` |
| `backend/utils/withTenant.js` | Mongoose plugin that auto-adds `tenantId` filter & field |
| `backend/scripts/backfillTenant.js` | One-off script to tag existing data |

---

## 2 Patch Every Mongoose Schema
Add **exactly** the same snippet at the top of the field list:
```js
tenantId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Tenant',
  required: true,
  index: true,
},
```
Then register the plugin once per schema (bottom of file):
```js
schema.plugin(withTenant);
```
Affected files (at the moment):
```
backend/models/userModel.js
backend/models/collectionModel.js
backend/models/exerciseModel.js
backend/models/productModel.js
… (total ≈ 15 files)
```

Tip: VSCode multi-cursor makes this a 10-minute job.

---

## 3 Wire Middleware in `server.js`
```diff
 import tenantMiddleware from './middleware/tenantMiddleware.js';
 …
-app.use(protect);          // old – auth first
+app.use(tenantMiddleware); // new – detect tenant
+app.use(protect);          // then auth
```

If you use Express Router files, also insert `router.use(tenantMiddleware)` where needed (global is easier).

---

## 4 Controller Updates (Minimal)
No need to change every query manually—just pass the option object once:
```diff
 // BEFORE
 const workouts = await Workout.find({ user: req.user._id });

 // AFTER (plugin will add tenant filter)
 const workouts = await Workout.find({ user: req.user._id }, null, {
   tenantId: req.tenant._id,
 });
```
Even simpler: create a helper:
```js
const findForTenant = (model, filter, { req }) =>
  model.find(filter, null, { tenantId: req.tenant._id });
```
Then call `findForTenant(Workout, { … }, { req })`.

---

## 5 JWT Payload (Optional but Recommended)
```diff
 const token = jwt.sign({
   userId: user._id,
+  tenantId: req.tenant._id, // add this
   sessionId,
 }, process.env.JWT_SECRET, …);
```
Frontend stays the same; it already reads the cookie/header.

---

## 6 Indexes
Run once in Mongo shell or via migration:
```js
db.workouts.createIndex({ tenantId: 1, user: 1 });
db.collections.createIndex({ tenantId: 1, updatedAt: -1 });
```

---

## 7 File Uploads / Static Assets
If you upload to Cloudinary/S3, prefix keys:
```js
const key = `${req.tenant._id}/${uuid()}.jpg`;
```
This keeps tenant data separate on the bucket as well.

---

## 8 Tests to Update/Create
1. Add helper to spoof sub-domain (`Host: gyma.localhost`).
2. Duplicate one CRUD test so it runs under **two tenants** and asserts isolation.
3. Adjust Jest setup if necessary: `process.env.BASE_URL = 'http://gyma.localhost'`.

---

## 9 Deployment Notes
* Add wildcard domain `*.yourapp.com` in Vercel.
* Set **Environment Variable** `FALLBACK_TENANT_HEADER=true` for local dev.
* Create DNS CNAME for each customer (e.g., `gyma → cname.vercel-dns.com`).

---

### Timeline Reference (copy-paste into Jira)
```
MT-01  Create Tenant model                     0.25 d
MT-02  Add tenantId to schemas                0.75 d
MT-03  Add plugin & middleware                0.25 d
MT-04  Modify server.js & controllers         0.50 d
MT-05  Backfill old data                      0.50 d
MT-06  Indexes & smoke test                   0.25 d
MT-07  Deploy to staging                      0.25 d
MT-08  QA + prod roll-out                     0.50 d
```

Keep commits small (`feat(mt): add tenantId to userModel`, etc.).  
After everything is live and stable, proceed with splitting those 1000-line files.

### 1.1  Optional Custom-Domain Support
Add `domain` (string) next to `subdomain` in `tenantModel.js` and update `tenantMiddleware.js`:
```js
const host = req.headers.host.toLowerCase();
let tenant = await Tenant.findOne({ domain: host });
if (!tenant) {
  const sub = host.split('.')[0];
  tenant = await Tenant.findOne({ subdomain: sub });
}
```
If you're keeping only custom domains, you can drop the fallback.

### 4.1  Google OAuth dynamic redirect
When generating the Google auth URL, replace the static redirect URI with:
```js
const host = req.headers.host; // gym-alpha.com or gyma.yourapp.com
const redirectUri = `https://${host}/api/auth/google/callback`;
```
Remember to list each domain in **OAuth → Authorized domains** if you go with full white-label logins. 