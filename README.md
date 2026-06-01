# LocalMart

> Making every informal business in South Africa discoverable online.

LocalMart is a **cross-platform marketplace app** (iOS · Android · Web) built with Expo and Supabase that connects customers with nearby informal businesses — spaza shops, hair salons, car washes, food vendors, phone repair shops, tailors, mechanics and more — across South African townships and suburbs.

**Live demo →** [localmart.vercel.app](https://localmart.vercel.app)
**Demo login →** Use the "Try the Demo" button on the sign-in screen (no setup required).

---

## The Problem

South Africa has an estimated **3 million informal businesses** generating over R900 billion annually. These traders are completely invisible online — no Google listing, no website, no digital footprint. Customers discover them only by physically walking past. LocalMart gives every informal trader a free digital storefront, findable in seconds by anyone nearby.

---

## Features

### Customer

| Feature           | Detail                                                          |
| ----------------- | --------------------------------------------------------------- |
| Nearby search     | PostGIS radius query (1–10 km) using real GPS coordinates      |
| Category filter   | 12 business types with horizontal scroll + fade-edge hints      |
| Business detail   | Hours, inventory chips, photo gallery, star rating, reviews     |
| In-app directions | OSRM routing, live GPS tracking, step auto-advance within 40 m  |
| Save businesses   | Bookmarks synced to Supabase, visible in Saved tab              |
| Reviews           | No account needed; DB trigger auto-recalculates business rating |
| Theme             | Light / dark with one-tap toggle, persisted to AsyncStorage     |

### Business Owner

| Feature             | Detail                                                                             |
| ------------------- | ---------------------------------------------------------------------------------- |
| Register a business | Map-pin location picker (Nominatim geocoding), up to 4 photos via Supabase Storage |
| My Businesses       | Dashboard showing all registered listings with live verification status            |
| Deletion request    | Owner submits request with reason; admin reviews before removing                   |

### Admin

| Feature           | Detail                                                        |
| ----------------- | ------------------------------------------------------------- |
| Pending queue     | Verify or reject new businesses with one tap                  |
| Deletion requests | Review and approve/reject owner deletion requests             |
| Admin management  | Add new admins by email; root admin is protected from removal |
| Live badge        | Pending count updates in real-time via Supabase Realtime      |

---

## Tech Stack

| Layer          | Technology                                               |
| -------------- | -------------------------------------------------------- |
| Framework      | Expo SDK 56 (React Native + Web)                         |
| Navigation     | Expo Router v3 — file-based routing, Stack + Tabs       |
| Language       | TypeScript                                               |
| Styling        | React Native StyleSheet,`expo-linear-gradient`         |
| Font           | Poppins via `@expo-google-fonts`                       |
| Database       | Supabase (PostgreSQL + PostGIS)                          |
| Auth           | Supabase Auth (email/password)                           |
| Storage        | Supabase Storage (business images)                       |
| Realtime       | Supabase Realtime (live pending count badge)             |
| Maps — native | `react-native-maps`                                    |
| Maps — web    | `react-leaflet` + Carto tile layers (free, no API key) |
| Routing        | OSRM open-source routing engine                          |
| Geocoding      | Nominatim (OpenStreetMap) — zero API cost               |
| Icons          | Ionicons via `@expo/vector-icons`                      |
| Deployment     | Vercel (static Expo export)                              |

---

## Architecture

```
src/
├── app/                      # Screens — each file is a URL route
│   ├── (tabs)/               # Tab group: Home, Register, Saved
│   │   ├── _layout.tsx       # Native tab bar (Ionicons)
│   │   ├── _layout.web.tsx   # Web nav bar (responsive desktop/mobile)
│   │   ├── index.tsx         # Home — nearby search + map
│   │   ├── register.tsx      # Business registration + My Businesses
│   │   └── saved.tsx         # Saved businesses
│   ├── admin/index.tsx       # Admin panel
│   ├── auth/login.tsx        # Sign in / sign up
│   ├── business/[id].tsx     # Business detail (dynamic route)
│   └── settings/index.tsx    # Account, change password
│
├── components/
│   ├── BusinessCard.tsx      # Card for list and saved views
│   ├── BusinessMap.tsx/.web  # Map with pins — platform-specific
│   ├── DirectionsMap.tsx     # Turn-by-turn navigation view
│   ├── LocationPicker.tsx    # Map + address search for registration
│   ├── GradientHeader.tsx    # Shared page header (safe-area aware)
│   ├── CategoryFilter.tsx    # Scrollable chip row with fade edges
│   └── MiniMap.tsx/.web      # Static mini-map on business detail
│
├── context/
│   └── app-theme.tsx         # Light/dark theme (AsyncStorage persisted)
│
├── hooks/
│   ├── use-auth.ts           # Supabase auth state subscription
│   ├── use-admin.ts          # Admin role check
│   ├── use-pending-count.ts  # Realtime pending badge count
│   └── use-responsive.ts     # Mobile/desktop breakpoints
│
└── services/
    ├── supabase.ts           # Client + auth helpers
    ├── businesses.ts         # Business CRUD, saves, reviews, image upload
    └── admin.ts              # Admin-only operations
```

---

## Database Design

```sql
businesses        -- Core listing with PostGIS GEOGRAPHY point
reviews           -- Customer reviews (trigger auto-updates rating)
saved_businesses  -- User bookmarks
admins            -- Role table (root admin protected)
```

**Key SQL decisions:**

```sql
-- Generated columns extract lat/lng from PostGIS automatically
latitude  DOUBLE PRECISION GENERATED ALWAYS AS (ST_Y(location::geometry)) STORED,
longitude DOUBLE PRECISION GENERATED ALWAYS AS (ST_X(location::geometry)) STORED

-- Trigger recalculates rating on every review insert/delete
CREATE TRIGGER trg_sync_business_rating
  AFTER INSERT OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION sync_business_rating();

-- is_admin() uses SECURITY DEFINER + explicit search_path
-- to bypass RLS without circular permission issues
CREATE FUNCTION is_admin() RETURNS BOOLEAN
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (SELECT 1 FROM admins WHERE email = auth.email());
  $$;
```

---

## Row Level Security

| Table                | Rules                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------ |
| `businesses`       | Public: read verified only. Owners: read own (incl. unverified), update own. Admins: read/update/delete all. |
| `reviews`          | Public: read all, insert without account.                                                                    |
| `saved_businesses` | Users see and manage only their own rows.                                                                    |
| `admins`           | Admins read all; admins can add admins; only non-root rows deletable.                                        |

---

## Notable Engineering Decisions

**Cross-platform maps without API keys**
`react-native-maps` on native + `react-leaflet` on web with Carto Voyager/Dark Matter tiles (free). Platform-specific files (`BusinessMap.tsx` / `BusinessMap.web.tsx`) share an identical props interface so calling code is platform-agnostic.

**OSRM directions (zero cost)**
Full turn-by-turn navigation using the OSRM public API — same routing engine behind OpenStreetMap. Live GPS via `expo-location`, step auto-advance triggers within 40 m of the next waypoint, map camera follows the user.

**Realtime admin badge**
Pending business count updates live across all mounted components. Each `usePendingCount()` instance gets a unique channel name via a module-level counter, preventing Supabase's "can't add callbacks after subscribe()" error when multiple components mount the same hook.

**PostgREST schema cache fix**
Changing `RETURNS SETOF businesses` → `RETURNS TABLE(...)` with every column explicit prevented "Database error querying schema" errors after adding new columns. Combined with `NOTIFY pgrst, 'reload schema'` in the migration.

**Metro/Hermes whitespace text nodes**
React Native Web throws on string children of Views. Metro's Hermes transformer preserves newlines between JSX siblings as string nodes (unlike Babel). Fixed by using `React.createElement` for root-level ThemedView components and removing all blank lines between JSX siblings.

**SSR-safe Supabase client**
Expo's static export renders pages in Node.js where `localStorage` is undefined. Guarded with `typeof localStorage !== 'undefined'` so the build succeeds without breaking browser auth.

---

## Local Setup

```bash
# Install
git clone https://github.com/shaggybelco/localmart.git
cd localmart && npm install

# Environment variables
cp .env.example .env
# Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY

# Run migrations
supabase db push

# Seed test data (optional — paste into Supabase SQL Editor)
# supabase/seed.sql

# Start
npx expo start --web      # web
npx expo start            # native
```

---

## Deployment

Deployed to **Vercel** as a static Expo export:

```json
// vercel.json
{
  "buildCommand": "npx expo export --platform web",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in Vercel's environment variables. Every push to `main` triggers an automatic redeploy.

---

## Demo Accounts

| Account             | How to use                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------- |
| Demo (admin + user) | Click**"Sign in to demo account"** on the login screen — one tap, no password needed |
| Your own            | Sign up with any email — instant access                                                    |

Once signed in as demo, explore the **Admin Panel** (shield icon in the nav bar) to verify businesses, manage admins, and process deletion requests.

---

## Roadmap

- [ ] Push notifications for business verification status
- [ ] Business owner analytics dashboard
- [ ] WhatsApp Business API integration
- [ ] Digital payments (Ozow / SnapScan)
- [ ] Native iOS / Android builds via EAS
- [ ] Admin review moderation

---

## Author

Built by **Shaggy Sambo** — full-stack developer, South Africa.
shaggybelco1@gmail.co.za
