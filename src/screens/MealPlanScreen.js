import { useState, useCallback, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, Modal, Alert, Platform, Share, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { useApp } from '../context/AppContext';
import WheelPicker from '../components/WheelPicker';
import {
  loadUser,
  loadMealPlans,
  saveMealPlanDay,
  loadMealReminders,
  saveMealReminderDay,
  loadShoppingLists,
  saveShoppingListWeek,
} from '../utils/storage';
import { CATALOG } from '../data/catalog';
import translations from '../i18n/translations';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('meal-reminders', {
    name: 'Meal Reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const MEAL_SLOTS = [
  { key: 'breakfast', emoji: '🍳', label: 'Breakfast' },
  { key: 'lunch', emoji: '🥗', label: 'Lunch' },
  { key: 'dinner', emoji: '🍽️', label: 'Dinner' },
  { key: 'snack', emoji: '🍎', label: 'Snack' },
];

const EMPTY_DAY_PLAN = { breakfast: [], lunch: [], dinner: [], snack: [] };
const EMPTY_DAY_REMINDERS = { breakfast: null, lunch: null, dinner: null, snack: null };
const DEFAULT_REMINDER_HOUR = { breakfast: 7, lunch: 12, dinner: 18, snack: 15 };

const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

const CATEGORY_ORDER = ['Proteins', 'Carbs', 'Vegetables', 'Dairy', 'Other'];
const CATEGORY_KEYWORDS = [
  {
    name: 'Vegetables',
    keywords: [
      'spinach', 'broccoli', 'carrot', 'tomato', 'onion', 'garlic', 'pepper', 'lettuce',
      'cucumber', 'kale', 'zucchini', 'mushroom', 'avocado', 'beet', 'corn', 'parsley',
      'cilantro', 'celery', 'cabbage', 'asparagus', 'squash', 'eggplant', 'scallion',
    ],
  },
  {
    name: 'Proteins',
    keywords: [
      'chicken', 'beef', 'turkey', 'salmon', 'tuna', 'fish', 'shrimp', 'egg', 'tofu',
      'protein', 'whey', 'pork', 'bacon', 'sausage', 'lentil', 'bean', 'chickpea',
      'edamame', 'steak', 'shellfish',
    ],
  },
  {
    name: 'Carbs',
    keywords: [
      'rice', 'pasta', 'bread', 'oat', 'potato', 'quinoa', 'noodle', 'tortilla',
      'cereal', 'bagel', 'granola', 'spaghetti', 'couscous', 'barley',
    ],
  },
  {
    name: 'Dairy',
    keywords: ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'parmesan', 'mozzarella', 'cheddar'],
  },
];

function categorizeIngredient(text) {
  const lower = text.toLowerCase();
  const match = CATEGORY_KEYWORDS.find(cat => cat.keywords.some(kw => lower.includes(kw)));
  return match ? match.name : 'Other';
}

// Returns the 7 dates (Monday–Sunday) of the week containing `date`.
function getWeekDays(date) {
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate() + diffToMonday);
  return Array.from({ length: 7 }, (_, i) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i));
}

// Simple Monday-anchored week-of-year number (not full ISO 8601 year-boundary
// handling — good enough for a friendly "Week X of YYYY" label).
function getWeekOfYear(monday) {
  const jan1 = new Date(monday.getFullYear(), 0, 1);
  const jan1Weekday = jan1.getDay();
  const offsetToFirstMonday = jan1Weekday === 0 ? -6 : 1 - jan1Weekday;
  const firstMonday = new Date(monday.getFullYear(), 0, 1 + offsetToFirstMonday);
  const diffDays = Math.round((monday - firstMonday) / (24 * 60 * 60 * 1000));
  return Math.floor(diffDays / 7) + 1;
}

// Returns an array of weeks (each an array of 7 Dates, Monday–Sunday) that
// together cover every day shown in a month-grid for `viewMonth`.
function getMonthWeeks(viewMonth) {
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);

  const firstWeekday = firstOfMonth.getDay();
  const startOffset = firstWeekday === 0 ? -6 : 1 - firstWeekday;
  const gridStart = new Date(year, month, 1 + startOffset);

  const lastWeekday = lastOfMonth.getDay();
  const endOffset = lastWeekday === 0 ? 0 : 7 - lastWeekday;
  const gridEnd = new Date(year, month, lastOfMonth.getDate() + endOffset);

  const weeks = [];
  let cursor = gridStart;
  while (cursor <= gridEnd) {
    weeks.push(Array.from({ length: 7 }, (_, i) => new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + i)));
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 7);
  }
  return weeks;
}

function to24Hour(hour12, period) {
  const hour = hour12 % 12;
  return period === 'PM' ? hour + 12 : hour;
}

function formatReminderTime(hour24, minute) {
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${String(minute).padStart(2, '0')} ${period}`;
}

function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function dayHasMeals(dayPlan) {
  if (!dayPlan) return false;
  return MEAL_SLOTS.some(slot => (dayPlan[slot.key]?.length ?? 0) > 0);
}

function countPlannedMeals(dayPlan) {
  if (!dayPlan) return 0;
  return MEAL_SLOTS.reduce((sum, slot) => sum + (dayPlan[slot.key]?.length ?? 0), 0);
}

function CalendarDay({ cell, onPress, theme }) {
  if (!cell) return <View style={styles.dayCell} />;

  const { day, isSelected, isToday, hasMeals } = cell;

  return (
    <Pressable onPress={onPress} style={styles.dayCell}>
      <View
        style={[
          styles.dayCircle,
          isToday && !isSelected && { borderWidth: 1.5, borderColor: theme.accent },
          isSelected && { backgroundColor: theme.accent },
        ]}
      >
        <Text style={[styles.dayNumber, { color: isSelected ? '#FFFFFF' : theme.text }]}>{day}</Text>
      </View>
      <View style={[styles.dayDot, { backgroundColor: hasMeals ? theme.accent : 'transparent' }]} />
    </Pressable>
  );
}

function MacroStat({ label, value, unit, theme }) {
  return (
    <View style={styles.macroStat}>
      <Text style={[styles.macroStatValue, { color: theme.text }]}>{value}{unit}</Text>
      <Text style={[styles.macroStatLabel, { color: theme.subtext }]}>{label}</Text>
    </View>
  );
}

function ViewModeToggle({ value, onChange, theme }) {
  return (
    <View style={[styles.viewModeToggle, { borderColor: theme.border }]}>
      {[
        { key: 'day', label: 'Day' },
        { key: 'week', label: 'Week' },
      ].map(opt => {
        const selected = value === opt.key;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            style={[styles.viewModeOption, selected && { backgroundColor: theme.accent }]}
          >
            <Text style={[styles.viewModeText, { color: selected ? '#FFFFFF' : theme.muted }]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function WeekDayCard({ date, mealCount, isSelected, isToday, onPress, theme }) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.weekCard,
        { backgroundColor: theme.card, borderColor: theme.border },
        isSelected && { borderColor: theme.accent, backgroundColor: theme.accentDim },
      ]}
    >
      <Text style={[styles.weekCardDayName, { color: isSelected ? theme.accent : theme.subtext }]}>
        {date.toLocaleDateString('en-US', { weekday: 'short' })}
      </Text>
      <View
        style={[
          styles.weekCardDateCircle,
          isToday && !isSelected && { borderWidth: 1.5, borderColor: theme.accent },
          isSelected && { backgroundColor: theme.accent },
        ]}
      >
        <Text style={[styles.weekCardDateNumber, { color: isSelected ? '#FFFFFF' : theme.text }]}>
          {date.getDate()}
        </Text>
      </View>
      <Text style={[styles.weekCardMealCount, { color: isSelected ? theme.accent : theme.subtext }]}>
        {mealCount === 0 ? 'No meals' : `${mealCount} meal${mealCount !== 1 ? 's' : ''}`}
      </Text>
    </Pressable>
  );
}

function MealRecipeRow({ recipe, onRemove, theme, isLast }) {
  return (
    <View style={[styles.mealRecipeRow, !isLast && { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
      <View style={styles.mealRecipeInfo}>
        <Text style={[styles.mealRecipeName, { color: theme.text }]} numberOfLines={1}>
          {recipe.name}
        </Text>
        <Text style={[styles.mealRecipeCalories, { color: theme.subtext }]}>
          {recipe.calories} kcal
        </Text>
      </View>
      <Pressable onPress={onRemove} hitSlop={8} style={[styles.mealRemoveBtn, { backgroundColor: theme.border }]}>
        <Text style={[styles.mealRemoveBtnText, { color: theme.muted }]}>✕</Text>
      </Pressable>
    </View>
  );
}

function MealSection({ slot, recipes, reminder, onAddPress, onRemove, onBellPress, theme }) {
  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.mealSectionHeader}>
        <View style={styles.mealSectionTitleRow}>
          <Text style={styles.mealSectionEmoji}>{slot.emoji}</Text>
          <Text style={[styles.mealSectionTitle, { color: theme.text }]}>{slot.label}</Text>
        </View>
        <Pressable onPress={onAddPress} style={[styles.addBtn, { backgroundColor: theme.accentDim }]}>
          <Text style={[styles.addBtnText, { color: theme.accent }]}>+ Add recipe</Text>
        </Pressable>
      </View>

      <Pressable onPress={onBellPress} hitSlop={6} style={styles.reminderRow}>
        <Text style={[styles.bellIcon, { color: reminder ? theme.accent : theme.subtext }]}>🔔</Text>
        <Text style={[styles.reminderText, { color: reminder ? theme.accent : theme.subtext }]}>
          {reminder ? formatReminderTime(reminder.hour, reminder.minute) : 'Set reminder'}
        </Text>
      </Pressable>

      {recipes.length === 0 ? (
        <Text style={[styles.mealEmptyText, { color: theme.subtext }]}>No items yet</Text>
      ) : (
        recipes.map((r, i) => (
          <MealRecipeRow
            key={r.id}
            recipe={r}
            onRemove={() => onRemove(r.id)}
            theme={theme}
            isLast={i === recipes.length - 1}
          />
        ))
      )}
    </View>
  );
}

export default function MealPlanScreen() {
  const { isDark, theme, language } = useApp();
  const t = translations[language];

  const [user, setUser] = useState(null);
  const [mealPlans, setMealPlans] = useState({});
  const [reminders, setReminders] = useState({});
  const [viewMode, setViewMode] = useState('day');
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [addModalSlot, setAddModalSlot] = useState(null);
  const [reminderModalSlot, setReminderModalSlot] = useState(null);
  const [pickerHour, setPickerHour] = useState(7);
  const [pickerMinute, setPickerMinute] = useState('00');
  const [pickerPeriod, setPickerPeriod] = useState('AM');
  const [shoppingLists, setShoppingLists] = useState({});
  const [shoppingListVisible, setShoppingListVisible] = useState(false);
  const [weekPickerVisible, setWeekPickerVisible] = useState(false);
  const [weekPickerMonth, setWeekPickerMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  useFocusEffect(
    useCallback(() => {
      Promise.all([loadUser(), loadMealPlans(), loadMealReminders(), loadShoppingLists()]).then(
        ([savedUser, plans, savedReminders, savedShoppingLists]) => {
          setUser(savedUser);
          setMealPlans(plans);
          setReminders(savedReminders);
          setShoppingLists(savedShoppingLists);
        }
      );
    }, [])
  );

  const selectedDateKey = formatDateKey(selectedDate);
  const selectedPlan = mealPlans[selectedDateKey] ?? EMPTY_DAY_PLAN;
  const selectedReminders = reminders[selectedDateKey] ?? EMPTY_DAY_REMINDERS;

  const calendarCells = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayKey = formatDateKey(new Date());

    const cells = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = formatDateKey(new Date(year, month, day));
      cells.push({
        day,
        dateKey,
        hasMeals: dayHasMeals(mealPlans[dateKey]),
        isToday: dateKey === todayKey,
        isSelected: dateKey === selectedDateKey,
      });
    }
    return cells;
  }, [viewMonth, mealPlans, selectedDateKey]);

  const monthLabel = viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const goPrevMonth = () => setViewMonth(v => new Date(v.getFullYear(), v.getMonth() - 1, 1));
  const goNextMonth = () => setViewMonth(v => new Date(v.getFullYear(), v.getMonth() + 1, 1));

  const handleSelectDay = (cell) => {
    if (!cell) return;
    setSelectedDate(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), cell.day));
  };

  const shiftWeek = (deltaDays) => {
    const next = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() + deltaDays);
    setSelectedDate(next);
    setViewMonth(new Date(next.getFullYear(), next.getMonth(), 1));
  };
  const goPrevWeek = () => shiftWeek(-7);
  const goNextWeek = () => shiftWeek(7);

  const openWeekPicker = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const baseMonth = selectedDate.getFullYear() === currentYear
      ? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
      : new Date(currentYear, now.getMonth(), 1);
    setWeekPickerMonth(baseMonth);
    setWeekPickerVisible(true);
  };

  const isPickerPrevMonthDisabled = weekPickerMonth.getMonth() === 0;
  const isPickerNextMonthDisabled = weekPickerMonth.getMonth() === 11;

  const goPrevPickerMonth = () => {
    if (isPickerPrevMonthDisabled) return;
    setWeekPickerMonth(v => new Date(v.getFullYear(), v.getMonth() - 1, 1));
  };
  const goNextPickerMonth = () => {
    if (isPickerNextMonthDisabled) return;
    setWeekPickerMonth(v => new Date(v.getFullYear(), v.getMonth() + 1, 1));
  };

  const handleSelectWeekRow = (days) => {
    const monday = days[0];
    setSelectedDate(monday);
    setViewMonth(new Date(monday.getFullYear(), monday.getMonth(), 1));
    setWeekPickerVisible(false);
  };

  const resolveRecipes = (ids) =>
    (ids ?? []).map(id => CATALOG.find(r => r.id === id)).filter(Boolean);

  const handleAddRecipe = async (recipe) => {
    if (!addModalSlot) return;
    const current = selectedPlan[addModalSlot] ?? [];
    if (current.includes(recipe.id)) {
      setAddModalSlot(null);
      return;
    }
    const updatedDay = { ...selectedPlan, [addModalSlot]: [...current, recipe.id] };
    const updatedAll = await saveMealPlanDay(selectedDateKey, updatedDay);
    setMealPlans(updatedAll);
    setAddModalSlot(null);
  };

  const handleRemoveRecipe = async (slotKey, recipeId) => {
    const current = selectedPlan[slotKey] ?? [];
    const updatedDay = { ...selectedPlan, [slotKey]: current.filter(id => id !== recipeId) };
    const updatedAll = await saveMealPlanDay(selectedDateKey, updatedDay);
    setMealPlans(updatedAll);
  };

  const openReminderPicker = (slotKey) => {
    const defaultHour24 = DEFAULT_REMINDER_HOUR[slotKey] ?? 12;
    const period = defaultHour24 >= 12 ? 'PM' : 'AM';
    const hour12 = defaultHour24 % 12 === 0 ? 12 : defaultHour24 % 12;
    setPickerHour(hour12);
    setPickerMinute('00');
    setPickerPeriod(period);
    setReminderModalSlot(slotKey);
  };

  const handleCancelReminder = async (slotKey) => {
    const existing = selectedReminders[slotKey];
    if (existing?.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(existing.notificationId);
    }
    const updatedDay = { ...selectedReminders, [slotKey]: null };
    const updatedAll = await saveMealReminderDay(selectedDateKey, updatedDay);
    setReminders(updatedAll);
  };

  const handleBellPress = (slotKey) => {
    if (selectedReminders[slotKey]) {
      handleCancelReminder(slotKey);
    } else {
      openReminderPicker(slotKey);
    }
  };

  const handleSetReminder = async () => {
    const slotKey = reminderModalSlot;
    if (!slotKey) return;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      Alert.alert(
        'Notifications disabled',
        'Enable notifications in your device settings to get meal prep reminders.'
      );
      return;
    }

    const hour24 = to24Hour(pickerHour, pickerPeriod);
    const minute = Number(pickerMinute);
    const targetDate = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      hour24,
      minute,
      0
    );

    const existing = selectedReminders[slotKey];
    if (existing?.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(existing.notificationId);
    }

    const slotLabel = MEAL_SLOTS.find(s => s.key === slotKey)?.label ?? 'meal';
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'FitNet',
        body: `Time to prep your ${slotLabel.toLowerCase()}! 🍽️`,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: targetDate,
      },
    });

    const updatedDay = { ...selectedReminders, [slotKey]: { hour: hour24, minute, notificationId } };
    const updatedAll = await saveMealReminderDay(selectedDateKey, updatedDay);
    setReminders(updatedAll);
    setReminderModalSlot(null);
  };

  const totals = useMemo(() => {
    const allRecipes = MEAL_SLOTS.flatMap(slot => resolveRecipes(selectedPlan[slot.key]));
    return allRecipes.reduce(
      (acc, r) => ({
        calories: acc.calories + (Number(r.calories) || 0),
        protein: acc.protein + (Number(r.protein) || 0),
        carbs: acc.carbs + (Number(r.carbs) || 0),
        fat: acc.fat + (Number(r.fat) || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [selectedPlan]);

  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);
  const weekKey = formatDateKey(weekDays[0]);
  const weekLabel = `${weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  const weekNumber = getWeekOfYear(weekDays[0]);
  const weekYear = weekDays[0].getFullYear();
  const thisWeekKey = formatDateKey(getWeekDays(new Date())[0]);
  const checkedMap = shoppingLists[weekKey] ?? {};

  const monthWeeks = useMemo(() => getMonthWeeks(weekPickerMonth), [weekPickerMonth]);
  const pickerMonthLabel = weekPickerMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const groupedIngredients = useMemo(() => {
    const seen = new Map();
    weekDays.forEach(day => {
      const dayPlan = mealPlans[formatDateKey(day)];
      if (!dayPlan) return;
      MEAL_SLOTS.forEach(slot => {
        resolveRecipes(dayPlan[slot.key]).forEach(recipe => {
          (recipe.ingredients ?? []).forEach(ing => {
            const text = ing.trim();
            const key = text.toLowerCase();
            if (!seen.has(key)) seen.set(key, text);
          });
        });
      });
    });

    const groups = {};
    CATEGORY_ORDER.forEach(cat => { groups[cat] = []; });
    Array.from(seen.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .forEach(([key, text]) => {
        groups[categorizeIngredient(text)].push({ key, text });
      });
    return groups;
  }, [weekDays, mealPlans]);

  const totalIngredientCount = CATEGORY_ORDER.reduce((sum, cat) => sum + groupedIngredients[cat].length, 0);

  const handleToggleIngredient = async (key) => {
    const updatedChecked = { ...checkedMap };
    if (updatedChecked[key]) {
      delete updatedChecked[key];
    } else {
      updatedChecked[key] = true;
    }
    const updatedAll = await saveShoppingListWeek(weekKey, updatedChecked);
    setShoppingLists(updatedAll);
  };

  const handleClearAllChecked = async () => {
    const updatedAll = await saveShoppingListWeek(weekKey, {});
    setShoppingLists(updatedAll);
  };

  const handleShareList = async () => {
    const lines = CATEGORY_ORDER.flatMap(cat => {
      const items = groupedIngredients[cat];
      if (!items.length) return [];
      return [`${cat}:`, ...items.map(i => `${checkedMap[i.key] ? '[x]' : '[ ]'} ${i.text}`), ''];
    });
    if (!lines.length) return;
    try {
      await Share.share({ message: `Shopping List (${weekLabel})\n\n${lines.join('\n').trim()}` });
    } catch {
      // user dismissed the share sheet — nothing to do
    }
  };

  const modalRecipes = user?.sport ? CATALOG.filter(r => r.sport === user.sport) : CATALOG;
  const modalSlotInfo = MEAL_SLOTS.find(s => s.key === addModalSlot);
  const reminderSlotInfo = MEAL_SLOTS.find(s => s.key === reminderModalSlot);
  const selectedDateLabel = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.text }]}>Meal Plan</Text>
        <Text style={[styles.subtitle, { color: theme.subtext }]}>
          Plan your breakfast, lunch, dinner, and snacks.
        </Text>

        <ViewModeToggle value={viewMode} onChange={setViewMode} theme={theme} />

        {viewMode === 'day' ? (
          /* CALENDAR */
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.calendarHeader}>
              <Pressable onPress={goPrevMonth} hitSlop={10} style={styles.calendarNavBtn}>
                <Text style={[styles.calendarNavIcon, { color: theme.accent }]}>‹</Text>
              </Pressable>
              <Text style={[styles.calendarMonthLabel, { color: theme.text }]}>{monthLabel}</Text>
              <Pressable onPress={goNextMonth} hitSlop={10} style={styles.calendarNavBtn}>
                <Text style={[styles.calendarNavIcon, { color: theme.accent }]}>›</Text>
              </Pressable>
            </View>

            <View style={styles.weekdayRow}>
              {WEEKDAY_LABELS.map((label, i) => (
                <View key={i} style={styles.weekdayCell}>
                  <Text style={[styles.weekdayText, { color: theme.subtext }]}>{label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {calendarCells.map((cell, i) => (
                <CalendarDay key={cell?.dateKey ?? `blank-${i}`} cell={cell} onPress={() => handleSelectDay(cell)} theme={theme} />
              ))}
            </View>
          </View>
        ) : (
          /* WEEK OVERVIEW */
          <>
            <View style={styles.calendarHeader}>
              <Pressable onPress={goPrevWeek} hitSlop={10} style={styles.calendarNavBtn}>
                <Text style={[styles.calendarNavIcon, { color: theme.accent }]}>‹</Text>
              </Pressable>
              <Pressable onPress={openWeekPicker} hitSlop={6}>
                <Text style={[styles.calendarMonthLabel, { color: theme.text }]}>
                  Week {weekNumber} of {weekYear}
                </Text>
              </Pressable>
              <Pressable onPress={goNextWeek} hitSlop={10} style={styles.calendarNavBtn}>
                <Text style={[styles.calendarNavIcon, { color: theme.accent }]}>›</Text>
              </Pressable>
            </View>
            <Pressable onPress={openWeekPicker} hitSlop={6} style={styles.weekRangeRow}>
              <Text style={[styles.weekRangeLabel, { color: theme.accent }]}>{weekLabel}</Text>
              <Text style={[styles.weekRangeChevron, { color: theme.accent }]}>▾</Text>
            </Pressable>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.weekRow}
              style={styles.weekRowScroll}
            >
              {weekDays.map(date => {
                const dateKey = formatDateKey(date);
                return (
                  <WeekDayCard
                    key={dateKey}
                    date={date}
                    mealCount={countPlannedMeals(mealPlans[dateKey])}
                    isSelected={dateKey === selectedDateKey}
                    isToday={dateKey === formatDateKey(new Date())}
                    onPress={() => setSelectedDate(date)}
                    theme={theme}
                  />
                );
              })}
            </ScrollView>
          </>
        )}

        <Text style={[styles.selectedDateLabel, { color: theme.text }]}>{selectedDateLabel}</Text>

        {/* MEAL SECTIONS */}
        {MEAL_SLOTS.map(slot => (
          <MealSection
            key={slot.key}
            slot={slot}
            recipes={resolveRecipes(selectedPlan[slot.key])}
            reminder={selectedReminders[slot.key]}
            onAddPress={() => setAddModalSlot(slot.key)}
            onRemove={(recipeId) => handleRemoveRecipe(slot.key, recipeId)}
            onBellPress={() => handleBellPress(slot.key)}
            theme={theme}
          />
        ))}

        {/* DAILY TOTAL */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Daily Total</Text>
          <Text style={[styles.totalCalories, { color: theme.accent }]}>{totals.calories} kcal</Text>
          <View style={styles.totalMacroRow}>
            <MacroStat label={t.protein} value={totals.protein} unit="g" theme={theme} />
            <MacroStat label={t.carbs} value={totals.carbs} unit="g" theme={theme} />
            <MacroStat label={t.fat} value={totals.fat} unit="g" theme={theme} />
          </View>
        </View>

        {/* SHOPPING LIST */}
        <Pressable
          onPress={() => setShoppingListVisible(true)}
          style={[styles.shoppingListBtn, { backgroundColor: theme.accent }]}
        >
          <Text style={styles.shoppingListBtnIcon}>🛒</Text>
          <Text style={styles.shoppingListBtnText}>Shopping List</Text>
          {totalIngredientCount > 0 && (
            <View style={styles.shoppingListBadge}>
              <Text style={styles.shoppingListBadgeText}>{totalIngredientCount}</Text>
            </View>
          )}
        </Pressable>
      </ScrollView>

      {/* ADD RECIPE MODAL */}
      <Modal
        visible={!!addModalSlot}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setAddModalSlot(null)}
      >
        <SafeAreaView style={[styles.modalSafe, { backgroundColor: theme.bg }]} edges={['top', 'bottom']}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Add to {modalSlotInfo?.label ?? ''}
            </Text>
            <Pressable
              onPress={() => setAddModalSlot(null)}
              hitSlop={8}
              style={[styles.modalClose, { backgroundColor: theme.border }]}
            >
              <Text style={[styles.modalCloseText, { color: theme.muted }]}>✕</Text>
            </Pressable>
          </View>
          <ScrollView>
            {modalRecipes.map(r => {
              const alreadyAdded = (selectedPlan[addModalSlot] ?? []).includes(r.id);
              return (
                <Pressable
                  key={r.id}
                  onPress={() => handleAddRecipe(r)}
                  style={({ pressed }) => [
                    styles.modalRecipeRow,
                    { borderBottomColor: theme.border },
                    alreadyAdded && { backgroundColor: theme.accentDim },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <View style={styles.modalRecipeInfo}>
                    <Text style={[styles.modalRecipeName, { color: theme.text }]} numberOfLines={1}>
                      {r.name}
                    </Text>
                    <Text style={[styles.modalRecipeCalories, { color: theme.subtext }]}>
                      {r.calories} kcal
                    </Text>
                  </View>
                  {alreadyAdded && <Text style={[styles.checkmark, { color: theme.accent }]}>✓</Text>}
                </Pressable>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* REMINDER TIME PICKER MODAL */}
      <Modal
        visible={!!reminderModalSlot}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setReminderModalSlot(null)}
      >
        <SafeAreaView style={[styles.modalSafe, { backgroundColor: theme.bg }]} edges={['top', 'bottom']}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Remind Me — {reminderSlotInfo?.label ?? ''}
            </Text>
            <Pressable
              onPress={() => setReminderModalSlot(null)}
              hitSlop={8}
              style={[styles.modalClose, { backgroundColor: theme.border }]}
            >
              <Text style={[styles.modalCloseText, { color: theme.muted }]}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.timePickerBody}>
            <Text style={[styles.timePickerHint, { color: theme.subtext }]}>
              We'll remind you to prep this meal on {selectedDateLabel}.
            </Text>

            <View style={styles.timePickerRow}>
              <View style={styles.timePickerColumn}>
                <WheelPicker data={HOURS_12} selectedValue={pickerHour} onValueChange={setPickerHour} theme={theme} />
              </View>
              <Text style={[styles.timePickerColon, { color: theme.text }]}>:</Text>
              <View style={styles.timePickerColumn}>
                <WheelPicker data={MINUTES} selectedValue={pickerMinute} onValueChange={setPickerMinute} theme={theme} />
              </View>
              <View style={[styles.periodToggle, { borderColor: theme.border }]}>
                {['AM', 'PM'].map(period => {
                  const selected = pickerPeriod === period;
                  return (
                    <Pressable
                      key={period}
                      onPress={() => setPickerPeriod(period)}
                      style={[styles.periodOption, selected && { backgroundColor: theme.accent }]}
                    >
                      <Text style={[styles.periodOptionText, { color: selected ? '#FFFFFF' : theme.muted }]}>
                        {period}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Pressable onPress={handleSetReminder} style={[styles.saveBtn, { backgroundColor: theme.accent }]}>
              <Text style={styles.saveBtnText}>Set Reminder</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>

      {/* SHOPPING LIST MODAL */}
      <Modal
        visible={shoppingListVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShoppingListVisible(false)}
      >
        <SafeAreaView style={[styles.modalSafe, { backgroundColor: theme.bg }]} edges={['top', 'bottom']}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <View>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Shopping List</Text>
              <Text style={[styles.shoppingListWeek, { color: theme.subtext }]}>{weekLabel}</Text>
            </View>
            <Pressable
              onPress={() => setShoppingListVisible(false)}
              hitSlop={8}
              style={[styles.modalClose, { backgroundColor: theme.border }]}
            >
              <Text style={[styles.modalCloseText, { color: theme.muted }]}>✕</Text>
            </Pressable>
          </View>

          <View style={[styles.shoppingListActions, { borderBottomColor: theme.border }]}>
            <Pressable onPress={handleClearAllChecked} style={[styles.shoppingActionBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.shoppingActionText, { color: theme.muted }]}>Clear all</Text>
            </Pressable>
            <Pressable onPress={handleShareList} style={[styles.shoppingActionBtn, { backgroundColor: theme.accentDim, borderColor: theme.accent }]}>
              <Text style={[styles.shoppingActionText, { color: theme.accent }]}>Share list</Text>
            </Pressable>
          </View>

          {totalIngredientCount === 0 ? (
            <View style={styles.shoppingEmptyState}>
              <Text style={styles.shoppingEmptyEmoji}>🛒</Text>
              <Text style={[styles.shoppingEmptyTitle, { color: theme.text }]}>Nothing planned this week</Text>
              <Text style={[styles.shoppingEmptySubtitle, { color: theme.subtext }]}>
                Add recipes to your meal plan to build a shopping list.
              </Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.shoppingListScroll}>
              {CATEGORY_ORDER.map(category => {
                const items = groupedIngredients[category];
                if (!items.length) return null;
                return (
                  <View key={category} style={styles.shoppingCategory}>
                    <Text style={[styles.shoppingCategoryTitle, { color: theme.accent }]}>
                      {category} ({items.length})
                    </Text>
                    {items.map(item => {
                      const checked = !!checkedMap[item.key];
                      return (
                        <Pressable
                          key={item.key}
                          onPress={() => handleToggleIngredient(item.key)}
                          style={styles.shoppingItemRow}
                        >
                          <View
                            style={[
                              styles.checkbox,
                              { borderColor: theme.border },
                              checked && { backgroundColor: theme.accent, borderColor: theme.accent },
                            ]}
                          >
                            {checked && <Text style={styles.checkboxMark}>✓</Text>}
                          </View>
                          <Text
                            style={[
                              styles.shoppingItemText,
                              { color: checked ? theme.subtext : theme.text },
                              checked && styles.shoppingItemChecked,
                            ]}
                          >
                            {item.text}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                );
              })}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* WEEK PICKER POPOVER */}
      <Modal
        visible={weekPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setWeekPickerVisible(false)}
      >
        <Pressable style={styles.popoverBackdrop} onPress={() => setWeekPickerVisible(false)}>
          <Pressable
            style={[styles.popoverCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.calendarHeader}>
              <Pressable
                onPress={goPrevPickerMonth}
                disabled={isPickerPrevMonthDisabled}
                hitSlop={10}
                style={styles.calendarNavBtn}
              >
                <Text style={[styles.calendarNavIcon, { color: isPickerPrevMonthDisabled ? theme.border : theme.accent }]}>
                  ‹
                </Text>
              </Pressable>
              <Text style={[styles.calendarMonthLabel, { color: theme.text }]}>{pickerMonthLabel}</Text>
              <Pressable
                onPress={goNextPickerMonth}
                disabled={isPickerNextMonthDisabled}
                hitSlop={10}
                style={styles.calendarNavBtn}
              >
                <Text style={[styles.calendarNavIcon, { color: isPickerNextMonthDisabled ? theme.border : theme.accent }]}>
                  ›
                </Text>
              </Pressable>
            </View>

            <View style={styles.weekdayRow}>
              {WEEKDAY_LABELS.map((label, i) => (
                <View key={i} style={styles.weekdayCell}>
                  <Text style={[styles.weekdayText, { color: theme.subtext }]}>{label}</Text>
                </View>
              ))}
            </View>

            {monthWeeks.map(days => {
              const rowKey = formatDateKey(days[0]);
              const isCurrentWeek = rowKey === thisWeekKey;
              const isSelectedWeekRow = rowKey === weekKey;
              return (
                <Pressable
                  key={rowKey}
                  onPress={() => handleSelectWeekRow(days)}
                  style={({ pressed }) => [
                    styles.weekPickerRow,
                    isCurrentWeek && !isSelectedWeekRow && { borderWidth: 1.5, borderColor: theme.accent },
                    isSelectedWeekRow && { backgroundColor: theme.accent },
                    pressed && !isSelectedWeekRow && { backgroundColor: theme.accentDim },
                  ]}
                >
                  {days.map(d => {
                    const inMonth = d.getMonth() === weekPickerMonth.getMonth();
                    return (
                      <View key={formatDateKey(d)} style={styles.weekPickerDayCell}>
                        <Text
                          style={[
                            styles.weekPickerDayText,
                            { color: isSelectedWeekRow ? '#FFFFFF' : theme.text },
                            !inMonth && !isSelectedWeekRow && { opacity: 0.35 },
                          ]}
                        >
                          {d.getDate()}
                        </Text>
                      </View>
                    );
                  })}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: '800', marginTop: 8 },
  subtitle: { fontSize: 13, marginTop: 2, marginBottom: 20 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700' },

  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  calendarNavBtn: { width: 32, alignItems: 'center' },
  calendarNavIcon: { fontSize: 26, lineHeight: 26, fontWeight: '400' },
  calendarMonthLabel: { fontSize: 16, fontWeight: '700' },

  weekdayRow: { flexDirection: 'row' },
  weekdayCell: { width: `${100 / 7}%`, alignItems: 'center', paddingBottom: 6 },
  weekdayText: { fontSize: 11, fontWeight: '700' },

  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: { fontSize: 14, fontWeight: '600' },
  dayDot: { width: 5, height: 5, borderRadius: 2.5, marginTop: 3 },

  selectedDateLabel: { fontSize: 15, fontWeight: '700', marginBottom: 10, marginLeft: 4 },

  mealSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  mealSectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mealSectionEmoji: { fontSize: 18 },
  mealSectionTitle: { fontSize: 15, fontWeight: '700' },
  addBtn: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  addBtnText: { fontSize: 12, fontWeight: '700' },
  mealEmptyText: { fontSize: 13, marginTop: 8 },

  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
    marginBottom: 6,
  },
  bellIcon: { fontSize: 14 },
  reminderText: { fontSize: 12, fontWeight: '600' },

  mealRecipeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  mealRecipeInfo: { flex: 1, paddingRight: 12 },
  mealRecipeName: { fontSize: 14, fontWeight: '600' },
  mealRecipeCalories: { fontSize: 12, marginTop: 2 },
  mealRemoveBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealRemoveBtnText: { fontSize: 12, fontWeight: '700' },

  totalCalories: { fontSize: 28, fontWeight: '800', marginTop: 6, marginBottom: 14 },
  totalMacroRow: { flexDirection: 'row', justifyContent: 'space-between' },
  macroStat: { alignItems: 'center', flex: 1 },
  macroStatValue: { fontSize: 15, fontWeight: '800' },
  macroStatLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },

  modalSafe: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 17, fontWeight: '700' },
  modalClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: { fontSize: 13, fontWeight: '700' },
  modalRecipeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 10,
  },
  modalRecipeInfo: { flex: 1 },
  modalRecipeName: { fontSize: 15, fontWeight: '600' },
  modalRecipeCalories: { fontSize: 12, marginTop: 2 },
  checkmark: { fontSize: 18, fontWeight: '700' },

  timePickerBody: { padding: 20 },
  timePickerHint: { fontSize: 13, marginBottom: 20, textAlign: 'center' },
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  timePickerColumn: { width: 70 },
  timePickerColon: { fontSize: 20, fontWeight: '700' },
  periodToggle: {
    flexDirection: 'column',
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
    marginLeft: 8,
  },
  periodOption: { paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center' },
  periodOptionText: { fontSize: 13, fontWeight: '700' },

  saveBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

  viewModeToggle: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 16,
  },
  viewModeOption: { paddingHorizontal: 20, paddingVertical: 8 },
  viewModeText: { fontSize: 13, fontWeight: '700' },

  weekRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginBottom: 14,
    marginLeft: 4,
  },
  weekRangeLabel: { fontSize: 13, fontWeight: '700' },
  weekRangeChevron: { fontSize: 10 },
  weekRowScroll: { marginBottom: 20 },
  weekRow: { gap: 10, paddingRight: 4 },
  weekCard: {
    width: 72,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 6,
  },
  weekCardDayName: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  weekCardDateCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekCardDateNumber: { fontSize: 15, fontWeight: '700' },
  weekCardMealCount: { fontSize: 10, fontWeight: '600', textAlign: 'center' },

  shoppingListBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 4,
  },
  shoppingListBtnIcon: { fontSize: 18 },
  shoppingListBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  shoppingListBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 4,
  },
  shoppingListBadgeText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },

  shoppingListWeek: { fontSize: 12, marginTop: 2 },
  shoppingListActions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  shoppingActionBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  shoppingActionText: { fontSize: 13, fontWeight: '700' },

  shoppingEmptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  shoppingEmptyEmoji: { fontSize: 44, marginBottom: 12 },
  shoppingEmptyTitle: { fontSize: 17, fontWeight: '700', marginBottom: 6 },
  shoppingEmptySubtitle: { fontSize: 13, textAlign: 'center' },

  shoppingListScroll: { padding: 20, paddingBottom: 40 },
  shoppingCategory: { marginBottom: 22 },
  shoppingCategoryTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  shoppingItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxMark: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  shoppingItemText: { fontSize: 14, flex: 1 },
  shoppingItemChecked: { textDecorationLine: 'line-through' },

  popoverBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  popoverCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  weekPickerRow: {
    flexDirection: 'row',
    borderRadius: 10,
    paddingVertical: 8,
    marginBottom: 2,
  },
  weekPickerDayCell: { width: `${100 / 7}%`, alignItems: 'center' },
  weekPickerDayText: { fontSize: 14, fontWeight: '600' },
});
