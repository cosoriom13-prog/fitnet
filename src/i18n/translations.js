const translations = {
  en: {
    appName: 'FitNet',
    tagline: 'Fuel your sport. Own your performance.',

    yourName: 'Your Name',
    namePlaceholder: 'e.g. Alex Johnson',
    age: 'Age (optional)',
    agePlaceholder: 'e.g. 24',
    primarySport: 'Primary Sport',
    fitnessGoal: 'Fitness Goal',
    getStarted: 'Get Started →',
    errorName: 'Please enter your name.',
    errorSport: 'Please select your primary sport.',
    errorGoal: 'Please select a fitness goal.',
    errorTrainingFrequency: 'Please select your training frequency.',
    errorSessionIntensity: 'Please select your session intensity.',

    goalPerformance: '🏆 Peak Performance',
    goalStrength: '💪 Build Strength',
    goalEndurance: '🫀 Endurance',
    goalWeightloss: '⚡ Weight Loss',

    trainingFrequencyLabel: 'Training Frequency',
    freq1to2: '1–2× / week',
    freq3to4: '3–4× / week',
    freq5plus: '5×+ / week',

    sessionIntensityLabel: 'Session Intensity',
    intensityEasy: '🟢 Easy',
    intensityModerate: '🟡 Moderate',
    intensityHard: '🔴 Hard',

    recoveryPriorityLabel: 'Prioritise Recovery',

    greeting: (name) => `Hey, ${name} 👋`,
    recipesReady: (n) => `${n} recipe${n !== 1 ? 's' : ''} ready for you`,
    recipeFallback: (sport) => `Showing all ${sport} recipes`,
    logOut: 'Log Out',
    logOutMessage: 'Clear your profile and start over?',
    cancel: 'Cancel',

    sportAll: 'All',
    sportFootball: 'Football',
    sportBasketball: 'Basketball',
    sportSwimming: 'Swimming',
    sportCycling: 'Cycling',
    sportRunning: 'Running',
    sportWeightlifting: 'Weightlifting',

    settings: 'Settings',
    profile: 'PROFILE',
    changeSport: 'Change Sport',
    changeSportDesc: 'Update your primary sport',
    changeSportTitle: 'Change Sport',
    changeSportConfirm: 'Are you sure you want to change your sport?',
    confirm: 'Confirm',
    appearance: 'APPEARANCE',
    darkMode: 'Dark Mode',
    darkModeDesc: 'Switch between dark and light theme',
    languageSection: 'LANGUAGE',
    english: '🇺🇸 English',
    spanish: '🇪🇸 Spanish',
    yourActivity: 'YOUR ACTIVITY',
    recentlyViewed: 'Recently Viewed Recipes',
    noRecentRecipes: 'No recipes viewed yet',

    calories: 'Calories',
    protein: 'Protein',
    carbs: 'Carbs',
    fat: 'Fat',
    ingredients: 'Ingredients',
    instructions: 'Instructions',
    whyItWorks: 'Why It Works',
  },
  es: {
    appName: 'FitNet',
    tagline: 'Alimenta tu deporte. Domina tu rendimiento.',

    yourName: 'Tu Nombre',
    namePlaceholder: 'ej. Alex Johnson',
    age: 'Edad (opcional)',
    agePlaceholder: 'ej. 24',
    primarySport: 'Deporte Principal',
    fitnessGoal: 'Meta de Fitness',
    getStarted: 'Comenzar →',
    errorName: 'Por favor ingresa tu nombre.',
    errorSport: 'Por favor selecciona tu deporte principal.',
    errorGoal: 'Por favor selecciona una meta de fitness.',
    errorTrainingFrequency: 'Por favor selecciona tu frecuencia de entrenamiento.',
    errorSessionIntensity: 'Por favor selecciona tu intensidad de sesión.',

    goalPerformance: '🏆 Rendimiento Máximo',
    goalStrength: '💪 Desarrollar Fuerza',
    goalEndurance: '🫀 Resistencia',
    goalWeightloss: '⚡ Pérdida de Peso',

    trainingFrequencyLabel: 'Frecuencia de Entrenamiento',
    freq1to2: '1–2× / semana',
    freq3to4: '3–4× / semana',
    freq5plus: '5×+ / semana',

    sessionIntensityLabel: 'Intensidad de Sesión',
    intensityEasy: '🟢 Fácil',
    intensityModerate: '🟡 Moderado',
    intensityHard: '🔴 Intenso',

    recoveryPriorityLabel: 'Priorizar Recuperación',

    greeting: (name) => `Hola, ${name} 👋`,
    recipesReady: (n) => `${n} receta${n !== 1 ? 's' : ''} lista${n !== 1 ? 's' : ''} para ti`,
    recipeFallback: (sport) => `Mostrando todas las recetas de ${sport}`,
    logOut: 'Cerrar Sesión',
    logOutMessage: '¿Limpiar tu perfil y empezar de nuevo?',
    cancel: 'Cancelar',

    sportAll: 'Todos',
    sportFootball: 'Fútbol Am.',
    sportBasketball: 'Baloncesto',
    sportSwimming: 'Natación',
    sportCycling: 'Ciclismo',
    sportRunning: 'Correr',
    sportWeightlifting: 'Pesas',

    settings: 'Ajustes',
    profile: 'PERFIL',
    changeSport: 'Cambiar Deporte',
    changeSportDesc: 'Actualiza tu deporte principal',
    changeSportTitle: 'Cambiar Deporte',
    changeSportConfirm: '¿Estás seguro de que quieres cambiar tu deporte?',
    confirm: 'Confirmar',
    appearance: 'APARIENCIA',
    darkMode: 'Modo Oscuro',
    darkModeDesc: 'Cambia entre tema oscuro y claro',
    languageSection: 'IDIOMA',
    english: '🇺🇸 Inglés',
    spanish: '🇪🇸 Español',
    yourActivity: 'TU ACTIVIDAD',
    recentlyViewed: 'Recetas Vistas Recientemente',
    noRecentRecipes: 'Sin recetas vistas aún',

    calories: 'Calorías',
    protein: 'Proteína',
    carbs: 'Carbohidratos',
    fat: 'Grasa',
    ingredients: 'Ingredientes',
    instructions: 'Instrucciones',
    whyItWorks: 'Por Qué Funciona',
  },
};

export function getSportName(sportId, language) {
  const t = translations[language] ?? translations.en;
  const key = 'sport' + sportId.charAt(0).toUpperCase() + sportId.slice(1);
  return t[key] ?? sportId;
}

const INTENSITY_LABELS = {
  en: { easy: 'Easy', moderate: 'Moderate', hard: 'Hard' },
  es: { easy: 'Fácil', moderate: 'Moderado', hard: 'Intenso' },
};

const TIMING_LABELS = {
  en: { pre: 'Pre', post: 'Post', recovery: 'Recovery', anytime: 'Anytime' },
  es: { pre: 'Pre', post: 'Post', recovery: 'Recuperación', anytime: 'Siempre' },
};

export function getIntensityLabel(tag, language) {
  return (INTENSITY_LABELS[language] ?? INTENSITY_LABELS.en)[tag] ?? tag;
}

export function getTimingLabel(timing, language) {
  return (TIMING_LABELS[language] ?? TIMING_LABELS.en)[timing] ?? timing;
}

// Indexed by Date#getDay(): 0 = Sunday … 6 = Saturday.
const MOTIVATIONAL_PHRASES = {
  en: [
    'Recover well, rise stronger. 🌱',
    'Start your week strong. 💪',
    'Small steps, big gains today.',
    'Halfway there — keep pushing!',
    'Fuel it right, feel it right.',
    'Almost the weekend — finish strong!',
    'Momentum builds all week long.',
  ],
  es: [
    'Descansa bien, levántate más fuerte. 🌱',
    'Empieza la semana con fuerza. 💪',
    'Pasos pequeños, grandes logros hoy.',
    'Ya vas a la mitad — ¡sigue así!',
    'Aliméntate bien, siéntete mejor.',
    'Casi el fin de semana — ¡a por todo!',
    'El impulso crece toda la semana.',
  ],
};

export function getMotivationalPhrase(language) {
  const phrases = MOTIVATIONAL_PHRASES[language] ?? MOTIVATIONAL_PHRASES.en;
  return phrases[new Date().getDay()];
}

export default translations;
