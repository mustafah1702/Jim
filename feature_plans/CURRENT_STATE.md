# Jim - Current State (as of 2026-04-26)

## Overview

Jim is a React Native/Expo gym workout tracker with a Supabase backend. The app uses Zustand for state management, TanStack React Query for data fetching, and TypeScript throughout.

**Tech Stack:** Expo 54, React Native 0.81, Supabase (Postgres + Auth + RLS), Zustand, React Query, TypeScript

---

## Completed Features

### 1. Authentication
- Email/password sign-up and sign-in via Supabase Auth
- Session persistence via AsyncStorage
- Auth gating (unauthenticated users redirected to sign-in)
- Auto-profile creation on signup (database trigger)

### 2. Workout Logging (Full-screen modal)
- Start empty workout or start from a template
- Add exercises from library (36 seeded) or create custom exercises inline
- Add/remove/edit sets per exercise (weight, reps)
- Warmup toggle per set
- Mark sets as completed (checkbox)
- Live workout timer (elapsed time since start)
- Rest timer with countdown banner (customizable duration, auto-starts on set completion)
- Save workout to Supabase (persists all sets with timestamps)
- Discard workout with confirmation
- Total volume and set count computed live

### 3. Exercise Library
- 36 pre-seeded exercises across all major muscle groups
- Categories: Compound, Dumbbell, Machine, Cable, Bodyweight, Accessory
- Muscle group filter chips (All, Chest, Back, Shoulders, Biceps, Triceps, Legs, Core, Glutes, Full Body)
- Search by exercise name
- Create custom exercises (name, primary muscle, equipment)
- Custom exercises are per-user (RLS enforced)

### 4. Templates (CRUD + Start Workout)
- Create template with name and exercises
- Add exercises from picker, configure target sets (reps, weight)
- Edit existing template (name, exercises, sets)
- Delete template with confirmation dialog
- Template list with cards showing exercise preview and muscle groups
- Start workout from template (pre-fills exercises and target sets)
- Full template form modal with validation

### 5. Workout History
- View all completed workouts (last 50)
- Per-workout display: date, exercises performed, sets, weight, reps, total volume, duration
- Aggregate metrics at top: total workouts, total sets, total volume
- Formatted durations and dates

### 6. Progress & Analytics
- Key metrics: total workouts, current streak, total volume
- Weekly Volume chart (bar chart, last 8 weeks)
- PR Trend chart (cumulative personal records over time)
- Muscle Group Breakdown (horizontal bar chart, volume by muscle)
- Weekly Frequency Grid (workouts per week, last 8 weeks)
- Custom chart components (no external charting library)

### 7. Personal Records (PRs)
- Auto-tracked via Postgres trigger on set insertion
- Two record types: weight PR and volume PR (weight x reps)
- Per-exercise tracking with previous record stored
- PR count displayed in weekly stats and progress

### 8. User Profile & Settings
- Display user email and member-since date
- Stats: total workouts, days active
- Preferences (persisted to Supabase `profiles` table):
  - Weight unit: lbs / kg
  - Default rest timer: 30-300 seconds (slider)
  - Appearance: System / Light / Dark
- Sign out

### 9. Theme System
- Light and dark mode with system preference detection
- Full color palette for both themes
- Consistent design tokens: spacing scale, typography scale, border radius
- Theme context/hook for all components

### 10. Navigation
- 5-tab bottom navigation: Today, History, Progress, Templates, Profile
- Full-screen modals: Active Workout, Template Form
- Standard modal: Exercise Picker
- Auth group for sign-in (separate from main tabs)

---

## Database Schema (6 core tables + 2 supporting)

| Table | Purpose | Row Count |
|-------|---------|-----------|
| `profiles` | User profile + preferences | 1 per user |
| `exercises` | Exercise library (seeded + custom) | 36 seeded + user custom |
| `templates` | Reusable workout blueprints | User-created |
| `template_exercises` | Exercises within templates | Per template |
| `template_sets` | Target sets within template exercises | Per template exercise |
| `workouts` | Completed workout sessions | Per user |
| `workout_sets` | Individual logged sets | Per workout |
| `personal_records` | PR history with triggers | Auto-populated |

All tables have Row-Level Security (RLS) enabled. Users can only access their own data.

---

## Architecture

```
app/                    # Expo Router screens & navigation
src/
  components/           # Reusable UI + domain-specific components
    workout/            # ExerciseCard, SetRow, RestTimerBanner, etc.
    template/           # TemplateCard, TemplateExerciseCard, etc.
    progress/           # VolumeChart, MuscleBreakdown, etc.
  hooks/                # Data fetching (React Query) + utility hooks
  stores/               # Zustand stores (auth, workout, templateForm, preferences)
  lib/                  # Supabase client, React Query config
  theme/                # Colors, spacing, typography
  types/                # TypeScript type definitions
supabase/
  migrations/           # 4 migration files (init, template_sets, PRs, preferences)
```

---

## What Exists But Is Not Implemented

| Feature | Current State |
|---------|--------------|
| Apple Sign-In | SDK configured in app.config.ts, not wired up |
| Google Sign-In | SDK configured in app.config.ts, not wired up |
| Delete Account | Button in profile, no backend logic (TODO comment) |
| Data Export | Menu item shows "Coming Soon" alert |
| Privacy Policy page | Menu item exists, no route/content |
| Terms of Service page | Menu item exists, no route/content |
| Help & Feedback | Menu item exists, no route/content |
| Workout Notes | DB column exists, not exposed in UI |
| Template Notes | Type field exists, not used in UI |
