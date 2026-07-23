import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_KEY = '@fitnet_user';
const THEME_KEY = '@fitnet_theme';
const LANGUAGE_KEY = '@fitnet_language';
const RECENT_KEY = '@fitnet_recent_recipes';
const CHECKINS_KEY = '@fitnet_checkins';
const PROGRESS_PROFILE_KEY = '@fitnet_progress_profile';
const PRS_KEY = '@fitnet_prs';
const MEAL_PLANS_KEY = '@fitnet_meal_plans';
const MEAL_REMINDERS_KEY = '@fitnet_meal_reminders';

export async function saveUser(user) {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function loadUser() {
  const raw = await AsyncStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function clearUser() {
  await AsyncStorage.removeItem(USER_KEY);
}

export async function saveTheme(theme) {
  await AsyncStorage.setItem(THEME_KEY, theme);
}

export async function loadTheme() {
  return AsyncStorage.getItem(THEME_KEY);
}

export async function saveLanguage(lang) {
  await AsyncStorage.setItem(LANGUAGE_KEY, lang);
}

export async function loadLanguage() {
  return AsyncStorage.getItem(LANGUAGE_KEY);
}

export async function addRecentRecipe(recipe) {
  const raw = await AsyncStorage.getItem(RECENT_KEY);
  const list = raw ? JSON.parse(raw) : [];
  const filtered = list.filter(r => r.id !== recipe.id);
  const updated = [
    { id: recipe.id, name: recipe.name, sport: recipe.sport },
    ...filtered,
  ].slice(0, 10);
  await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(updated));
}

export async function loadRecentRecipes() {
  const raw = await AsyncStorage.getItem(RECENT_KEY);
  return raw ? JSON.parse(raw) : [];
}

// Check-ins are keyed by date string ('YYYY-MM-DD') so there's at most one per day.
export async function saveCheckIn(dateKey, entry) {
  const all = await loadCheckIns();
  const updated = { ...all, [dateKey]: { ...entry, date: dateKey } };
  await AsyncStorage.setItem(CHECKINS_KEY, JSON.stringify(updated));
  return updated;
}

export async function loadCheckIns() {
  const raw = await AsyncStorage.getItem(CHECKINS_KEY);
  return raw ? JSON.parse(raw) : {};
}

export async function saveProgressProfile(profile) {
  await AsyncStorage.setItem(PROGRESS_PROFILE_KEY, JSON.stringify(profile));
}

export async function loadProgressProfile() {
  const raw = await AsyncStorage.getItem(PROGRESS_PROFILE_KEY);
  return raw ? JSON.parse(raw) : null;
}

// Personal records are keyed by exercise id, each value a plain number.
export async function savePR(exerciseKey, value) {
  const all = await loadPRs();
  const updated = { ...all, [exerciseKey]: value };
  await AsyncStorage.setItem(PRS_KEY, JSON.stringify(updated));
  return updated;
}

export async function loadPRs() {
  const raw = await AsyncStorage.getItem(PRS_KEY);
  return raw ? JSON.parse(raw) : {};
}

// Meal plans are keyed by date string ('YYYY-MM-DD'), each value shaped
// { breakfast: [recipeId], lunch: [recipeId], dinner: [recipeId], snack: [recipeId] }.
export async function saveMealPlanDay(dateKey, dayPlan) {
  const all = await loadMealPlans();
  const updated = { ...all, [dateKey]: dayPlan };
  await AsyncStorage.setItem(MEAL_PLANS_KEY, JSON.stringify(updated));
  return updated;
}

export async function loadMealPlans() {
  const raw = await AsyncStorage.getItem(MEAL_PLANS_KEY);
  return raw ? JSON.parse(raw) : {};
}

// Meal reminders are keyed by date string ('YYYY-MM-DD'), each value shaped
// { breakfast: { hour, minute, notificationId } | null, lunch: ..., dinner: ..., snack: ... }.
export async function saveMealReminderDay(dateKey, dayReminders) {
  const all = await loadMealReminders();
  const updated = { ...all, [dateKey]: dayReminders };
  await AsyncStorage.setItem(MEAL_REMINDERS_KEY, JSON.stringify(updated));
  return updated;
}

export async function loadMealReminders() {
  const raw = await AsyncStorage.getItem(MEAL_REMINDERS_KEY);
  return raw ? JSON.parse(raw) : {};
}
