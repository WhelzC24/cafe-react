# Cozy Corner Café — React + TypeScript + Vite + Supabase

A full-stack café management system rebuilt from PHP/MySQL into a modern React + Supabase stack.

## Features

| Feature | Details |
|---|---|
| **Customer Store** | Menu browsing, category filtering, cart, pickup order submission |
| **Auth** | Supabase Auth with role-based routing (admin / staff) |
| **Admin Dashboard** | User management, stats overview, reset passwords |
| **Store Dashboard** | Full product CRUD, real-time order management with status updates |
| **Staff Management** | Create staff accounts via Supabase Edge Function |
| **Change Password** | Forced password change on first login for new staff |
| **Realtime** | Orders update live via Supabase Realtime |

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS
- **Backend:** Supabase (Auth + PostgreSQL + Realtime + Edge Functions)
- **Routing:** React Router v6

---

## Quick Start

### 1. Create a Supabase Project

Go to [supabase.com](https://supabase.com) → New Project.

### 2. Run the Schema

In your Supabase dashboard → SQL Editor, paste and run the contents of:

```
supabase/schema.sql
```

This creates all tables, RLS policies, seeds the menu, and enables realtime.

### 3. Create the Admin User

In Supabase → Authentication → Users → "Invite user" (or use the SQL editor):

```sql
-- After creating the auth user via the dashboard, insert the profile:
INSERT INTO public.profiles (id, fullname, username, role)
VALUES (
  '<paste-the-uuid-from-auth-users>',
  'Admin User',
  'admin',
  'admin'
);
```

### 4. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Both values are in Supabase → Settings → API.

### 5. Install & Run

```bash
npm install
npm run dev
```

Open http://localhost:5173

---

## Routes

| Path | Access | Description |
|---|---|---|
| `/` | Public | Customer-facing store |
| `/login` | Public | Staff/Admin login |
| `/dashboard` | Staff + Admin | Product & order management |
| `/admin` | Admin only | User management |
| `/admin/staff` | Admin only | Create staff accounts |
| `/change-password` | Authenticated | Change account password |

---

## Deploying Staff Creation (Edge Function)

Creating Supabase Auth users requires the **service role key**, which must never be in the browser. The Edge Function in `supabase/functions/create-staff/` handles this securely.

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref <your-project-ref>

# Deploy the function
supabase functions deploy create-staff
```

The function:
1. Verifies the caller is an authenticated admin
2. Creates the Supabase Auth user using the service role key stored as `SERVICE_ROLE_KEY`
3. Inserts a profile row with `must_change_password: true`

---

## Database Schema

```
profiles       — extends auth.users (id, fullname, username, role, must_change_password)
products       — café menu items (name, category, description, price, image_url, is_available)
orders         — customer orders (customer_name, phone, email, notes, total, status)
order_items    — line items per order (product_name, quantity, unit_price, line_total)
```

All tables have Row Level Security (RLS) enabled.

---

## Building for Production

```bash
npm run build
```

Output goes to `dist/`. Deploy to Vercel, Netlify, or any static host.

> **Tip:** Set your Supabase environment variables in your host's dashboard, not just `.env`.
