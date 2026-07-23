import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_KEY = process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY;
const CACHE_PREFIX = '@fitnet_recipe_image_';

// Dish-type keywords checked in priority order (specific presentation/format
// words before generic protein/ingredient words) against the recipe name.
// Each maps to a short, photo-friendly search phrase.
const DISH_KEYWORDS = [
  [/\bpasta\b|\bpenne\b|\bnoodles\b|\bbolognese\b/, 'pasta dish'],
  [/\bsoup\b|\bstew\b|\bchili\b/, 'soup bowl'],
  [/\bpancakes?\b/, 'pancakes breakfast'],
  [/\bporridge\b|\boat(meal)?s?\b/, 'oatmeal breakfast'],
  [/\bgranola\b|\bparfait\b/, 'parfait breakfast'],
  [/\bscramble\b|\bomelette\b/, 'scrambled eggs breakfast'],
  [/\btoast\b/, 'toast breakfast'],
  [/\bbagel\b/, 'bagel sandwich'],
  [/\bsandwich\b|\bburrito\b|\btaco\b/, 'sandwich meal'],
  [/\bwrap\b/, 'wrap sandwich'],
  [/\bsalad\b/, 'salad bowl'],
  [/\bstir[-\s]?fry\b/, 'stir fry dish'],
  [/\bhash\b/, 'hash skillet'],
  [/\bskillet\b|\bfrittata\b/, 'skillet meal'],
  [/\bsmoothie\b/, 'smoothie drink'],
  [/\bshake\b/, 'protein shake'],
  [/\bslush\b|\bdrink\b/, 'fruit drink'],
  [/\bbites?\b/, 'energy balls snack'],
  [/\bmuffins?\b|\bbars?\b/, 'snack bar'],
  [/\bmix\b|\bpack\b/, 'snack mix'],
  [/\bstack\b|\bplate\b/, 'dinner plate'],
  [/\bbowl\b/, 'bowl meal'],
  [/\bsalmon\b|\bcod\b|\bprawn\b|\btuna\b/, 'seafood dish'],
  [/\bchicken\b/, 'chicken dish'],
  [/\bturkey\b/, 'turkey dish'],
  [/\bbeef\b|\bsteak\b|\bmeatball\b|\bburger\b/, 'beef dish'],
  [/\begg[s]?\b/, 'eggs breakfast'],
  [/\byogurt\b|\bcottage cheese\b/, 'yogurt bowl'],
  [/\brice\b|\bquinoa\b|\brisotto\b/, 'grain bowl'],
];

function extractFoodQuery(name) {
  const lower = name.toLowerCase();
  for (const [pattern, query] of DISH_KEYWORDS) {
    if (pattern.test(lower)) return `${query} food`;
  }
  return 'healthy meal food';
}

// Dedupe concurrent requests for the same recipe within a session.
const inFlight = new Map();

export async function fetchRecipeImage(recipe) {
  if (!ACCESS_KEY) return null;

  const cacheKey = CACHE_PREFIX + recipe.id;
  const cached = await AsyncStorage.getItem(cacheKey);
  if (cached) return cached;

  if (inFlight.has(recipe.id)) return inFlight.get(recipe.id);

  const promise = (async () => {
    try {
      const query = encodeURIComponent(extractFoodQuery(recipe.name));
      const res = await fetch(
        `https://api.unsplash.com/photos/random?query=${query}&orientation=landscape&content_filter=high`,
        { headers: { Authorization: `Client-ID ${ACCESS_KEY}` } }
      );
      if (!res.ok) return null;
      const data = await res.json();
      const base = data?.urls?.regular || data?.urls?.small;
      if (!base) return null;

      const url = `${base}&w=400&h=300&fit=crop`;
      await AsyncStorage.setItem(cacheKey, url);
      return url;
    } catch {
      return null;
    } finally {
      inFlight.delete(recipe.id);
    }
  })();

  inFlight.set(recipe.id, promise);
  return promise;
}
