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
    next: 'Next →',
    back: '← Back',
    errorName: 'Please enter your name.',
    errorSport: 'Please select your primary sport.',
    errorGoal: 'Please select a fitness goal.',
    errorTrainingFrequency: 'Please select your training frequency.',
    errorSessionIntensity: 'Please select your session intensity.',

    welcomeTitle: 'Welcome to FitNet',
    welcomeSubtitle: "Let's set up your profile so we can personalise your nutrition.",
    chooseSportTitle: 'Choose Your Sport',
    chooseSportSubtitle: 'Select the sport you train for most.',
    chooseGoalTitle: "What's Your Goal?",
    chooseGoalSubtitle: 'This helps us tailor your recipes to you.',
    trainingDetailsTitle: 'Training Details',
    trainingDetailsSubtitle: 'A few more details to fine-tune your plan.',

    goalPerformanceTitle: 'Peak Performance',
    goalPerformanceDesc: 'Push your limits and maximise output.',
    goalStrengthTitle: 'Build Strength',
    goalStrengthDesc: 'Get stronger, session after session.',
    goalEnduranceTitle: 'Endurance',
    goalEnduranceDesc: 'Build stamina for longer, harder efforts.',
    goalWeightlossTitle: 'Weight Loss',
    goalWeightlossDesc: 'Burn fat while fuelling performance.',

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
    trainingProfile: 'TRAINING PROFILE',
    changeFrequency: 'Training Frequency',
    changeFrequencyDesc: 'How often you train each week',
    changeIntensity: 'Session Intensity',
    changeIntensityDesc: 'Your typical training intensity',
    recoveryPriorityDesc: 'Prioritize recovery-focused recipes and guidance',
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
    next: 'Siguiente →',
    back: '← Atrás',
    errorName: 'Por favor ingresa tu nombre.',
    errorSport: 'Por favor selecciona tu deporte principal.',
    errorGoal: 'Por favor selecciona una meta de fitness.',
    errorTrainingFrequency: 'Por favor selecciona tu frecuencia de entrenamiento.',
    errorSessionIntensity: 'Por favor selecciona tu intensidad de sesión.',

    welcomeTitle: 'Bienvenido a FitNet',
    welcomeSubtitle: 'Configuremos tu perfil para personalizar tu nutrición.',
    chooseSportTitle: 'Elige Tu Deporte',
    chooseSportSubtitle: 'Selecciona el deporte que más practicas.',
    chooseGoalTitle: '¿Cuál Es Tu Meta?',
    chooseGoalSubtitle: 'Esto nos ayuda a adaptar tus recetas.',
    trainingDetailsTitle: 'Detalles de Entrenamiento',
    trainingDetailsSubtitle: 'Unos detalles más para ajustar tu plan.',

    goalPerformanceTitle: 'Rendimiento Máximo',
    goalPerformanceDesc: 'Supera tus límites y maximiza tu rendimiento.',
    goalStrengthTitle: 'Desarrollar Fuerza',
    goalStrengthDesc: 'Gánate más fuerza en cada sesión.',
    goalEnduranceTitle: 'Resistencia',
    goalEnduranceDesc: 'Desarrolla resistencia para esfuerzos más largos.',
    goalWeightlossTitle: 'Pérdida de Peso',
    goalWeightlossDesc: 'Quema grasa sin sacrificar el rendimiento.',

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
    trainingProfile: 'PERFIL DE ENTRENAMIENTO',
    changeFrequency: 'Frecuencia de Entrenamiento',
    changeFrequencyDesc: 'Con qué frecuencia entrenas cada semana',
    changeIntensity: 'Intensidad de Sesión',
    changeIntensityDesc: 'Tu intensidad de entrenamiento habitual',
    recoveryPriorityDesc: 'Prioriza recetas y consejos centrados en la recuperación',
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
