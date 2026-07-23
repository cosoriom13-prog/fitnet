import { useState, useCallback, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, Modal, Alert, Platform, StyleSheet } from 'react-native';
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

  useFocusEffect(
    useCallback(() => {
      Promise.all([loadUser(), loadMealPlans(), loadMealReminders()]).then(
        ([savedUser, plans, savedReminders]) => {
          setUser(savedUser);
          setMealPlans(plans);
          setReminders(savedReminders);
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

        {/* CALENDAR */}
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
});
