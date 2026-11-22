# Bazar Fresh — Security Specification (Phase 0 TDD)

## 1. Core Data & Role Invariants
1. **Default Deny**: Every unmatched path is denied (`allow read, write: if false;`).
2. **Role Separation (`isOwner()` vs `isStaff()` vs `isAdmin()`)**:
   - Roles are verified strictly from `get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.role` (plus bootstrapped verified owner `arevan.dg@gmail.com`). Anonymous auth tokens can NEVER satisfy `isAdmin()`, `isOwner()`, or `isStaff()`.
   - `owner`: Full read/write across `orders`, `orders/{orderId}/adminNotes`, `products`, `categories`, `banners`, `settings/store`, `cms/translations`, `blockedPhones`, `admins`, `users`, and read/create on `auditLogs`.
   - `staff`: Read/write ONLY on `products`, `orders` (status/updatedAt updates only), `orders/{orderId}/adminNotes`, read-only `users`/`blockedPhones`, and `create`-only on `auditLogs`.
3. **Admin Notes Subcollection Isolation (`orders/{orderId}/adminNotes/{noteId}`)**:
   - Master Gate verifies `exists(/databases/$(database)/documents/orders/$(orderId))`.
   - Customers (including the order owner) are strictly denied `get`, `list`, `create`, `update`, and `delete`.
4. **Immutable Append-Only Audit Logs (`auditLogs/{logId}`)**:
   - `create` allowed for `owner` or `staff` with `actorUid == request.auth.uid` and `createdAt == request.time`.
   - `get`/`list` allowed ONLY for `owner` (staff cannot read audit history).
   - `update` and `delete` are ALWAYS `false`.
5. **Customer Order Integrity**:
   - Customers can only create orders for themselves (`userId == request.auth.uid`) with `status == 'New'`, server timestamps, open store, and non-blocked phone.
   - Customers cannot update or delete orders after creation.

## 2. The "Dirty Dozen" Adversarial Payloads
1. Customer tries to read `orders/{orderId}/adminNotes/{noteId}` -> **DENIED**.
2. Staff admin tries to edit `settings/store` -> **DENIED** (owner-only).
3. Staff admin tries to create/delete `categories/{id}` or `banners/{id}` -> **DENIED** (owner-only).
4. Staff admin tries to write `cms/translations` -> **DENIED** (owner-only).
5. Staff admin tries to block/unblock a phone in `blockedPhones/{phone}` -> **DENIED** (owner-only).
6. Staff admin tries to read `auditLogs` -> **DENIED** (owner-only).
7. Staff admin tries to promote themselves to `owner` in `admins/{uid}` -> **DENIED** (owner-only).
8. Owner or Staff tries to update or delete an existing `auditLogs/{logId}` -> **DENIED** (`update, delete: if false`).
9. Customer creates an order with `status: "Delivered"` or shadow field `isFree: true` -> **DENIED**.
10. Unverified email spoofing `arevan.dg@gmail.com` (`email_verified: false`) -> **DENIED**.
11. Staff tries to mutate `grandTotal` or `items` when updating an order -> **DENIED** (`affectedKeys().hasOnly(['status', 'updatedAt'])`).
12. Attacker attempts path poisoning with 1.5KB document ID or >90KB image string -> **DENIED**.
