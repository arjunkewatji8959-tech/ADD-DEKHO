ADD DEKHO K — ROLE / APPROVAL / AD SERVER DEMO

Run locally:
  npm start
Then open:
  http://localhost:10000/
  http://localhost:10000/admin.html

Demo admin:
  ID: ADMIN-001
  Password: Admin@123

ROLES
- Viewer: VW-... — watches approved ads and earns demo credits.
- Client: CL-... — submits advertisements for admin approval.
- Admin: ADMIN-001 — separate admin control center.

FLOW
1. Register as Viewer or Client.
2. Server creates a unique ID and parent ID (default ADMIN-001).
3. Admin approves the registration.
4. Client submits an ad; it remains pending.
5. Admin approves the ad; only then is it visible to approved viewers.
6. Viewer sets payout account before withdrawal.
7. Viewer can request withdrawal after reaching ₹100; request is recorded for admin processing.
8. Admin sees all users, roles, parent IDs, direct child counts, ads, approvals, client payments and withdrawals.

IMPORTANT
This is a functional demo/server foundation, not a real-money financial system. Do not use the demo password, plaintext passwords, file-backed storage, or demo withdrawal flow for production. Production should use hashed passwords, sessions/JWT, HTTPS, a database, RBAC, audit logs, fraud controls and a legitimate payment provider/ad network.
