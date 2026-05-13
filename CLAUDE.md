# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Start Expo dev server (then press a/i/w for Android/iOS/web)
npm run android    # Run on Android emulator/device
npm run ios        # Run on iOS simulator/device
npm run web        # Run in web browser
```

No test runner is configured.

## Path Aliases

Imports use aliases defined in `babel.config.js`:

| Alias | Resolves to |
|---|---|
| `@` | `./src` |
| `@components` | `./src/components` |
| `@screens` | `./src/screens` |
| `@hooks` | `./src/hooks` |
| `@stores` | `./src/stores` |
| `@lib` | `./src/lib` |
| `@constants` | `./src/constants` |
| `@utils` | `./src/utils` |

## Architecture

**Tradenet** is a Nigerian marketplace mobile app (React Native + Expo) connecting service providers with clients. It also supports property listings, job postings, and car listings.

### Stack

- **React Native / Expo** (managed workflow) — cross-platform mobile
- **React Navigation** — bottom tabs + stack navigators per tab
- **Supabase** — PostgreSQL database, auth, and serverless functions (via `src/lib/supabase.js`)
- **Zustand** — global state; currently one store: `src/stores/authStore.js`

### Navigation Structure

```
AppNavigator (Auth check)
├── AuthNavigator (unauthenticated)
│   ├── LoginScreen
│   ├── SignupScreen
│   ├── OtpScreen
│   └── CameraScreen (KYC photo)
└── App.js — Bottom Tab Navigator (authenticated)
    ├── Home tab → HomeStack (HomeScreen → ServiceDetail)
    ├── Explore tab → ServicesStack (ServicesScreen → ServiceDetail)
    ├── Post tab → FAB (center, not yet implemented)
    ├── Alerts tab → JobsStack (JobsScreen → JobDetail)
    └── Profile tab → ProfileStack (ProfileScreen)
```

`App.js` (root) hosts the main bottom tab navigator with a custom floating action button (FAB) in the center tab position.

### State Management

`src/stores/authStore.js` (Zustand) manages:
- Auth session and user profile
- OTP-based phone login flow (via Supabase Edge Functions: `send-otp`, `verify-otp`)
- KYC verification: NIN (`verify-nin`) and photo upload (`upload-verification-photo`)
- Profile CRUD (avatar, city, state, etc.)

### Database (Supabase)

Key tables inferred from query patterns:
- **profiles** — user info, `nin_verified`, `photo_verified`, `rating`
- **services** — marketplace listings with `provider_id`, `category_id`, `price_type`, `is_available`
- **properties** — rentals/sales with `type` (rent/buy/land/commercial/shortlet)
- **jobs** — job postings with types (full_time/part_time/freelance/contract/internship)
- **cars** — vehicle listings
- **bookings** — links clients to service providers
- **saved_items** — favorites across all listing types (`item_type`: service/property/job/car)

Queries follow the pattern: `select(*, provider:profiles(...))` for joined data.

### Environment

Required in `.env`:
```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

### Domain Context

- **Nigerian market**: phone validation uses `08xxx` format, currency is Naira (₦), states are Nigerian states, identity uses NIN (National Identification Number)
- **User roles**: users can be both service providers (post services, get rated) and clients (browse, book, save items)
- **Verification**: new users go through OTP phone auth + optional NIN and photo KYC verification

### Constants

`src/constants/index.js` defines global `COLORS`, `FONTS`, `SPACING`, and `SERVICE_CATEGORIES` — use these instead of hardcoding values.
