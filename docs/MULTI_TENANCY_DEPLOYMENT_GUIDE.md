# Deployment Strategy for Selling Your App to 5 Customers

_Stack: Vercel (serverless) + MongoDB Atlas + React/Node.js_

---

## Quick Answer (TL;DR)

1. **Put all 5 customers in ONE multi-tenant deployment** to start.
2. The **free tiers** of Vercel & MongoDB can handle the first **5 000 users** if traffic is average CRUD-style.
3. When you outgrow free limits, upgrade **one shared project** (≈ **$35 / month** total) instead of paying for 5 separate upgrades.
4. Only split a customer into its **own deployment** when _one tenant becomes much larger_ than the others.

---

## 1. Your Traffic in Plain English

| Metric | Rough Value | What That Means |
| --- | --- | --- |
| Monthly active users | **5 000** | Number of different logins per month |
| Daily active users | **1 000** | About 20 % of MAU log in each day |
| Peak simultaneous users | **25** | Only a classroom-size group online at once |
| Typical reads | **1–25 per second** | When everyone is clicking at the same time |
| Typical writes | **< 10 per second** | Saving workouts, messages, etc. |
| DB size after a year | **≈ 3 GB** | Fits in a USB stick |

These numbers are **well below** the limits of a small paid MongoDB cluster and only brush the edges of the free tier.

---

## 2. Two Ways to Host

### Option A – One Multi-Tenant App  
_One Vercel project, one MongoDB cluster, each document tagged with `tenantId`._

**Pros**
* One code-base & CI pipeline to maintain.
* Pooling resources is cheaper; spikes from different customers smooth out.
* When you pay, you pay **once**.

**Cons**
* You _must not_ leak data across tenants – extra attention to access control.
* A noisy customer can slow everyone down (mitigated with app-level throttling).

---

### Option B – Five Separate Apps  
_Five Vercel projects, five MongoDB clusters – basically five copies of your stack._

**Pros**
* Bullet-proof data isolation.
* Each project gets its own free-tier quota (5 × free bandwidth, storage, etc.).
* One customer's spike never hurts the others.

**Cons**
* **5×** the deployments, environment files, webhooks, DNS records…
* Rolling out a hot-fix = deploy 5 times.
* Once _any_ customer needs to upgrade, you pay for that project separately – costs fragment.

---

## 3. Cost Cheat-Sheet (2024 pricing)

| Service | Free Tier | Next Paid Step | Price |
| --- | --- | --- | --- |
| **Vercel** | 100 GB-hours, 100 GB bandwidth, 12 req/s cap | Pro Plan | **$20 / mo** |
| **MongoDB Atlas** | M0  — 5 GB, ~20 ops/s |  M2 (shared 2 GB RAM, 10 GB SSD) | **$15 / mo** |

*If you host everything in one place:* **$35 / month covers all 5 customers** once you pass the free tier.

---

## 4. Which One Should I Pick?

👉 **Start with Option A (multi-tenant)** unless any of these are true:

* A customer demands physical separation of data.
* A customer's usage is 10× larger than the rest.
* You need different custom code or branding per tenant that changes frequently.

Otherwise, multi-tenant keeps life simple and cheap.

---

## 5. Step-by-Step Guide to Multi-Tenant Setup

### 5.1  Add `tenantId` to every document

```js
// models/userModel.js (example)
const userSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  name: String,
  email: String,
  // ...other fields
});
```

### 5.2  Scope every query

Create a tiny plugin once and reuse it everywhere:

```js
// utils/withTenant.js
module.exports = function withTenant(schema) {
  // Auto-append tenantId on finds
  schema.pre(/^find/, function (next) {
    if (!this.getFilter().tenantId && this.options.tenantId) {
      this.where({ tenantId: this.options.tenantId });
    }
    next();
  });
  // Auto-set tenantId on create
  schema.pre("save", function (next) {
    if (!this.tenantId && this.$__.scopeTenantId) {
      this.tenantId = this.$__.scopeTenantId;
    }
    next();
  });
};
```

Usage in a controller:

```js
// controllers/collectionController.js
exports.listCollections = async (req, res) => {
  const tenantId = req.user.tenantId; // set by JWT middleware
  const collections = await Collection.find({}, null, { tenantId });
  res.json(collections);
};
```

### 5.3  Index for speed

Add compound indexes such as `{ tenantId, updatedAt }` or `{ tenantId, userId }` on high-traffic collections.

### 5.4  Separate data in backups & analytics

Even in one cluster you can:
* Use one **database per tenant** if you prefer (`tenantA_db`, `tenantB_db`) while still sharing the same cluster.
* Or stick to one DB and filter by `tenantId` in your BI tool.

---

## 6. Usage Examples

### Example 1 – Create a workout for tenant **Gym-X**

```http
POST /api/workouts  
Authorization: Bearer <JWT with tenantId = "gymx">  
{
  "name": "Leg Day",
  "exercises": ["squat", "lunge"]
}
```

Server automatically writes:

```json
{
  "tenantId": "gymx",
  "name": "Leg Day",
  "exercises": ["squat", "lunge"],
  "createdAt": "2024-03-19T16:32:11Z"
}
```

### Example 2 – Burst traffic scenario

*Tenant Gym-Y starts a WhatsApp bulk message campaign.*

| Time window | Write ops/sec | Result |
| --- | --- | --- |
| 08:00-08:05 | 18 | Still below M2 limit (≈100); OK |
| 08:05-08:07 | 45 | May throttle on free (M0) – upgrade triggers |

If you are still on the free tier and see 429/"too many requests", upgrade **one** shared cluster to M2; cost increase is $15.

---

## 7. When to Move to Paid Plans

| Symptom | Probable Fix |
| --- | --- |
| Atlas metrics show >60 % CPU or storage >4 GB | Upgrade cluster to **M2** |
| Vercel analytics show >80 GB bandwidth or >90 GB-hours execution | Upgrade to **Vercel Pro** |
| You regularly hit 429 errors (rate-limit) during peaks | Upgrade Vercel _or_ split the noisy tenant out |

---

## 8. Future: Splitting a Heavy Tenant

If one customer (say, **Gym-Mega**) grows way faster:

1. Clone the repo (`git clone …`) and create a new Vercel project `app-gym-mega`.
2. Export Gym-Mega's data to a new Atlas cluster.
3. Switch Gym-Mega's DNS / app URLs.
4. Keep all other customers on the multi-tenant "shared" project.

This **pods** strategy keeps costs low for small customers while granting big ones their own resources.

---

### Still Confused?

Ping the maintainer team or open an issue in the repo — include:
* Current MAU/DAU numbers
* Current Atlas & Vercel usage graphs (PNG/SVG)
* Which option you're leaning toward

We can run the numbers with you. Happy scaling! :rocket: 