---
name: Admin bootstrap
description: Durable requirement for enabling the database-backed Asian Screen admin account.
---

The admin interface intentionally has no built-in default account. A deployment must provide `ADMIN_EMAIL` and `ADMIN_PASSWORD` through the environment/secrets flow before the first admin login; startup creates the account only when both are present.

**Why:** Shipping a default password would make the content-management surface unsafe.

**How to apply:** Configure both values in the deployment environment, then restart the API workflow so the bootstrap step can create the account.