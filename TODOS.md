# TODOS

## T1 — Add test infrastructure + filter/sort unit tests
**What:** Set up jest + @testing-library/react-native. Extract the HomeScreen filter/sort comparator to `src/utils/filterRecipes.js` and write unit tests.
**Why:** Filter has 5 edge cases (null user, intensity match ordering, recovery sort, trainingFrequency sort, empty catalog). Open-source contributors adding catalog entries need a safety net.
**Context:** Project has zero test infrastructure. Start with extracting the sort comparator to a testable pure function, then test it with jest. No full React Native render needed for the filter logic.
**Depends on:** Richer onboarding + catalog PR (T-next) must ship first.

## T2 — Expand catalog: more recipes per combo, sub-sport variants
**What:** After v1 (6 sports × 4 goals × 5-6 recipes), add more recipes per combo and eventually support sub-sport variants (road vs. mountain cycling, sprint vs. marathon running).
**Why:** 5-6 recipes per combo means a daily user sees repeats within a week.
**Context:** Generate additional batches offline using the existing catalog schema. Each batch is a standalone catalog PR.
**Depends on:** Initial catalog PR.

## T3 — Allow editing training profile fields in SettingsScreen
**What:** Add editing for trainingFrequency, sessionIntensity, and recoveryPriority to SettingsScreen (in addition to the existing sport change).
**Why:** A user who changes training load (injury recovery, new season, off-season) can't update their profile without full re-registration.
**Context:** SettingsScreen already has the modal pattern for sport changes — same approach works for the new fields. Design doc scoped this as registration-only for v1.
**Depends on:** Richer onboarding + catalog PR.
