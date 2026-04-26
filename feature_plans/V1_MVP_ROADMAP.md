# Jim V1 MVP - Release Roadmap

## V1 Definition

The goal is the **minimum shippable version** of Jim that a real user can download, sign up, and use daily as their workout tracker. The app should feel complete, not half-built. Every screen should work. No dead-end buttons or placeholder text.

---

## What's Already Done (Core MVP Features)

These are complete and functional:

- [x] Email/password authentication
- [x] Workout logging (start, add exercises, log sets, save)
- [x] Exercise library (36 exercises + custom creation)
- [x] Templates (create, edit, delete, start workout from template)
- [x] Workout history (view past workouts with details)
- [x] Progress analytics (volume charts, PR trends, muscle breakdown, frequency)
- [x] Personal records (auto-tracked)
- [x] User profile with preferences (units, rest timer, theme)
- [x] Light/dark mode
- [x] Rest timer

---

## What's Left for V1

### P0 - Must Have (Blockers for Release)

These are required before submitting to the App Store. Without them, the app either won't be accepted, will crash, or will feel broken.

#### 1. Delete Account
**Why:** Apple requires apps with account creation to support account deletion. This is an App Store rejection if missing.
**Scope:**
- Add confirmation dialog ("Are you sure? This cannot be undone.")
- Call Supabase Auth admin delete or edge function to delete user
- Cascade delete all user data (workouts, templates, sets, PRs, profile)
- Sign out and redirect to sign-in screen
**Effort:** Small

#### 2. Remove Dead-End Menu Items or Make Them Work
**Why:** Buttons that do nothing feel broken. Either implement or remove.
**Options (pick one per item):**
- **Privacy Policy:** Add a simple WebView or link to a hosted privacy policy page (required for App Store)
- **Terms of Service:** Same as above - link to hosted page (required for App Store)
- **Help & Feedback:** Either link to email (mailto:) or remove the item
- **Data Export:** Either implement basic JSON export or remove the menu item entirely
**Effort:** Small (if linking to hosted pages), Medium (if building in-app)

#### 3. Privacy Policy & Terms of Service (Hosted)
**Why:** Apple and Google both require a privacy policy URL during app submission. You need actual hosted pages.
**Scope:**
- Write a basic privacy policy (what data you collect, how it's stored, Supabase as processor)
- Write basic terms of service
- Host on a simple static site (GitHub Pages, Vercel, or Supabase hosting)
- Link from app's profile screen and app store listing
**Effort:** Small

#### 4. App Icon & Splash Screen
**Why:** The default Expo icon/splash will get the app rejected or look unprofessional.
**Scope:**
- Design or commission a simple app icon (1024x1024)
- Create splash screen matching the icon/brand
- Configure in app.config.ts
**Effort:** Small (if using a simple design)

#### 5. Error Handling & Edge Cases
**Why:** Crashes on first use = 1-star reviews and uninstalls.
**Scope:**
- Handle network offline gracefully (show message, don't crash)
- Handle Supabase auth token expiry (auto-refresh or prompt re-login)
- Handle empty states consistently (first-time user sees helpful guidance, not blank screens)
- Ensure workout save doesn't silently fail (show retry on error)
- Test: sign up flow, first workout, first template, all tabs with zero data
**Effort:** Medium

#### 6. Loading States
**Why:** Screens that show nothing while data loads feel broken.
**Scope:**
- Add loading indicators to all data-fetching screens (History, Progress, Templates, Profile stats)
- Skeleton screens or spinners while React Query fetches
- Already partially handled but needs consistency check
**Effort:** Small

---

### P1 - Should Have (Strong V1 Quality)

Not blockers, but the app will feel noticeably incomplete without these.

#### 7. Workout Notes
**Why:** Users want to jot down how they felt, what to change next time. The DB column already exists.
**Scope:**
- Add notes text input to workout screen (collapsible or at bottom)
- Save notes with workout
- Display notes in workout history cards
**Effort:** Small

#### 8. Edit/Delete Workout History
**Why:** Users make mistakes. Logging wrong weight or accidentally saving an empty workout with no way to fix it is frustrating.
**Scope:**
- Swipe-to-delete or long-press menu on workout history cards
- Confirmation dialog before delete
- Optional: tap to view workout detail, edit sets retroactively
**Effort:** Medium (delete only: Small)

#### 9. Reorder Exercises in Workout
**Why:** Users often want to change exercise order mid-workout (e.g., equipment taken).
**Scope:**
- Drag handle on exercise cards
- Reorder with react-native-reanimated or similar
**Effort:** Medium

#### 10. Onboarding / First Launch
**Why:** First-time users need guidance. An empty Today screen with no workouts is confusing.
**Scope:**
- Brief 2-3 screen onboarding (what Jim does, set up preferences)
- Or: contextual tips on first use (e.g., "Tap + to start your first workout")
- Empty states already exist but could be more helpful
**Effort:** Medium

#### 11. Haptic Feedback
**Why:** Makes the app feel native and polished. Important for a fitness app where users interact with sweaty hands.
**Scope:**
- Light haptic on set completion checkbox
- Medium haptic on rest timer start
- Success haptic on workout save
- Use expo-haptics
**Effort:** Small

---

### P2 - Nice to Have (Polish)

These improve the experience but aren't critical for V1 launch.

#### 12. Social Auth (Apple Sign-In / Google Sign-In)
**Why:** Reduces friction for sign-up. SDKs already configured.
**Scope:**
- Wire up Apple Sign-In button (iOS only)
- Wire up Google Sign-In button
- Map social auth to Supabase sessions
**Effort:** Medium

#### 13. Keyboard Handling
**Why:** Weight/reps inputs need number keyboard. Scrolling should handle keyboard appearance.
**Scope:**
- Ensure numeric keyboard for weight/reps fields
- KeyboardAvoidingView or similar for workout/template forms
- Auto-focus and tab-through behavior for set inputs
**Effort:** Small-Medium

#### 14. Pull-to-Refresh
**Why:** Users expect it. Data can get stale.
**Scope:**
- Add RefreshControl to History, Templates, Progress, Today screens
- Trigger React Query refetch on pull
**Effort:** Small

#### 15. Workout Timer Persistence
**Why:** If the app is killed mid-workout, the workout is lost. Users will be angry.
**Scope:**
- Persist active workout state to AsyncStorage
- Restore workout on app relaunch
- Handle stale workouts (started 24+ hours ago - prompt to discard or resume)
**Effort:** Medium

#### 16. Unit Conversion in Inputs
**Why:** Users who switch between lbs/kg need their existing data to display correctly.
**Scope:**
- Display weights in preferred unit across all screens
- Convert on display, store in canonical unit (lbs or kg)
- Show unit label next to weight inputs
**Effort:** Medium

---

## Not in V1 (Post-Launch / V2)

These are valuable features but should NOT delay the V1 release:

- **Workout programs / multi-week plans** - complex feature, post-launch
- **Social features** (share workouts, follow friends) - different product direction
- **Body measurements tracking** (weight, body fat, photos) - separate feature area
- **Notifications / reminders** - nice but not core
- **Apple Watch / wearable integration** - significant engineering effort
- **Offline-first with sync** - requires architecture changes
- **Exercise videos / form guides** - content creation effort
- **Advanced analytics** (1RM calculator, volume landmarks, periodization suggestions) - post-launch
- **Plate calculator** - convenience feature, not core
- **Superset / circuit support** - workout model changes needed
- **Rest timer per exercise** - nice but current global timer works
- **Cloud backup / restore** - Supabase already handles this
- **Localization / i18n** - post-launch based on user base
- **iPad layout optimization** - post-launch
- **Android-specific polish** - post-launch based on platform split

---

## Suggested Release Order

### Sprint 1: App Store Blockers (1-2 days)
1. Delete Account implementation
2. Privacy Policy & Terms of Service (write + host)
3. Remove or fix dead-end menu items
4. App icon & splash screen

### Sprint 2: Stability & Polish (2-3 days)
5. Error handling & edge cases audit
6. Loading states consistency
7. Workout notes (DB column already exists)
8. Haptic feedback
9. Pull-to-refresh

### Sprint 3: Quality of Life (2-3 days)
10. Delete workout history
11. Keyboard handling improvements
12. Workout timer persistence (AsyncStorage)
13. First-launch experience / better empty states

### Sprint 4: Submission (1 day)
14. Final testing on physical iOS device
15. TestFlight build and internal testing
16. App Store submission (screenshots, description, metadata)

**Total estimated effort: ~1-2 weeks to V1 submission**

---

## App Store Submission Checklist

- [ ] App icon (1024x1024) configured
- [ ] Splash screen configured
- [ ] Privacy policy URL (hosted)
- [ ] Terms of service URL (hosted)
- [ ] Delete account functionality works
- [ ] No dead-end buttons or placeholder screens
- [ ] Tested on physical iPhone (not just simulator)
- [ ] TestFlight beta tested (even if just yourself)
- [ ] App Store screenshots (6.7" and 6.1" required)
- [ ] App description and keywords written
- [ ] Age rating questionnaire completed (likely 4+)
- [ ] Apple Developer Program membership active ($99/year)
- [ ] Bundle identifier matches app.config.ts
- [ ] No API keys or secrets in client bundle (Supabase anon key is fine)
