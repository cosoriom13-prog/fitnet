import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_KEY = '@fitnet_user';
const THEME_KEY = '@fitnet_theme';
const LANGUAGE_KEY = '@fitnet_language';
const RECENT_KEY = '@fitnet_recent_recipes';
const CHECKINS_KEY = '@fitnet_checkins';

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
