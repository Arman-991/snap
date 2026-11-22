# Bazar Fresh — Store Owner & Admin Setup Guide

This guide walks you through connecting, securing, and running your **Bazar Fresh** Erbil supermarket PWA and its isolated **`/admin`** panel on Firebase’s **Free Spark Plan** (zero Cloud Functions, zero Cloud Storage billing, zero SMS OTP fees, Cash on Delivery only).

---

## Step 1: Enable Authentication Providers & Review Security Rules

Your Firebase project (`dotted-conduit-70w9t`) and Cloud Firestore database (`ai-studio-bazarfresh-456e6cee-f338-4906-b8d9-eefc63c7bcda`) are provisioned and updated `firestore.rules` (enforcing `owner` vs. `staff` RBAC) are deployed.

1. Open the [Firebase Console](https://console.firebase.google.com/) and select project **`dotted-conduit-70w9t`**.
2. Go to **Build → Authentication → Sign-in method**.
3. Enable **Anonymous**:
   - Click **Add new provider → Anonymous**, toggle **Enable** ON, and click **Save**.
   - *Why:* Customers automatically receive a secure `uid` on first load with zero passwords and zero SMS charges.
4. Enable **Email/Password**:
   - Click **Add new provider → Email/Password**, toggle **Enable** ON, and click **Save**.
   - *Why:* Used exclusively for store `owner` and `staff` sign-in on `/admin`.
5. Keep **Google** enabled if you also want one-click sign-in for your bootstrapped owner account (`arevan.dg@gmail.com`).
6. Go to **Build → Firestore Database**, select database **`ai-studio-bazarfresh-456e6cee-f338-4906-b8d9-eefc63c7bcda`**, and review the **Rules** tab to verify and harden `firestore.rules` before sharing your store widely.

---

## Step 2: Create Your Owner & Staff Accounts

The customer storefront contains **zero links or buttons** to `/admin`, and customer devices never download admin code (`React.lazy` route split). Admins open **`/admin`** directly in their browser.

### A. Create the Owner Account
1. In Firebase Console → **Authentication → Users**, click **Add user**.
2. Enter your owner email (e.g., `owner@bazarfresh.iq`) and a strong password, then click **Add user**.
3. Copy the new user’s **UID** from the Users table.
4. Go to **Firestore Database** → collection `admins` → **Add document**:
   - **Document ID**: paste the owner’s `UID`
   - `email` (string): `owner@bazarfresh.iq`
   - `role` (string): `owner`
   - `createdAt` (timestamp): current date/time
5. Visit **`https://<your-app-url>/admin`**, sign in with your Email & Password (or Google as the bootstrapped owner), and verify all 9 tabs appear: **Orders, Products, Categories, Customers, Home Editor, Settings, Reports, Audit Log, Admin Users**.

### B. Seed the 60 Erbil Sample Products (First Run)
1. Inside `/admin`, open the **Products** tab.
2. If your catalog is empty, click **Seed Sample Erbil Catalog (60 items)**.
3. Within 2–3 seconds, Firestore is populated with `settings/store`, 12 trilingual categories, 60 Erbil products, and 3 hero banners.

### C. Create & Test a Staff Account (Restricted Role)
1. In Firebase Console → **Authentication → Users**, click **Add user** and create a staff email/password (e.g., `staff@bazarfresh.iq`), then copy their **UID**.
2. Either add them in Firestore under `admins/{uid}` with `role: "staff"`, **OR** inside `/admin` as Owner, open the **Admin Users** tab, paste the Staff UID, email, choose **Staff**, and click **Add / Update Admin**.
3. Sign out of `/admin` and sign back in using the Staff credentials:
   - **Verify UI restriction:** Only **Orders** and **Products** appear in the sidebar.
   - **Verify Firestore rule enforcement:** Even via API, `staff` cannot edit `settings/store`, `categories`, `banners`, `cms/translations`, `blockedPhones`, `admins`, or read `auditLogs`.
4. **Verify Access Denied:** If a customer or non-admin email visits `/admin`, they are immediately signed out of `/admin` and shown the **Access Denied** screen.

---

## Step 3: Configure Your Store Visually in `/admin` (No Code Needed)

1. **Settings Tab (Owner):**
   - Set your real Erbil operations WhatsApp number (`9647XXXXXXXXX`), delivery fee (IQD), minimum order (IQD), max orders per hour, and trilingual delivery hours.
   - Use the top **Store Open / Closed** toggle anytime to pause/resume customer checkout immediately.
2. **Products Tab (Owner & Staff):**
   - Add/edit products with Kurdish/Arabic/English names, `ourPrice`, `marketPrice` (with live savings preview), `inStock` toggle, and home visibility flags (`Today's Deals`, `Popular`, `New`).
   - Upload photos directly from phone/laptop — images are automatically compressed client-side under ~45 KB so they work on Firebase’s Free Spark Plan with zero Cloud Storage fees.
   - Use **Bulk Price Editor** for rapid % or row-by-row IQD updates, or **Download CSV Template / Export CSV / Import CSV** (UTF-8 BOM compatible with Excel).
3. **Home Editor & CMS Tab (Owner):**
   - Manage hero banners, reorder/toggle home sections, edit trilingual storefront messages (`cms/translations`), manage Contact & Social buttons shown in customer Profile, and customize your store logo & brand primary color.

---

## Step 4: Test an End-to-End Order Flow

1. Open `/` on a mobile phone (or incognito window) as a customer, complete onboarding, add items above the minimum order, and tap **Buy & Place Order**.
2. Keep `/admin` → **Orders** open on a laptop or second phone:
   - Watch the new `SM-XXXX` order appear live with visual & audio notification.
   - Open the Order Detail drawer, tap **Call Customer** or **WhatsApp Customer** (pre-filled in the customer’s language), add an internal staff note (stored in `orders/{orderId}/adminNotes`, invisible to customers), and update status (`New` → `Called` → `Confirmed` → `Bought` → `Delivered`).
   - Watch the customer’s **My Orders** screen update in real time!
3. Check the **Reports** tab to verify Confirmed Sales Revenue, Total Savings Delivered, Fake Rate %, and Top 10 Products, and check **Audit Log** to inspect the immutable record of every admin change.
