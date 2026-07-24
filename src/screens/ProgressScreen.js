import { useState, useCallback } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import WheelPicker from '../components/WheelPicker';
import {
  loadCheckIns,
  saveCheckIn,
  loadProgressProfile,
  saveProgressProfile,
  loadPRs,
  savePR,
  loadMealPlans,
} from '../utils/storage';
import { CATALOG } from '../data/catalog';

const KG_RANGE = Array.from({ length: 171 }, (_, i) => 30 + i); // 30–200 kg
const LBS_RANGE = Array.from({ length: 376 }, (_, i) => 66 + i); // 66–441 lb
const CM_RANGE = Array.from({ length: 101 }, (_, i) => 120 + i); // 120–220 cm
const FT_RANGE = Array.from({ length: 41 }, (_, i) => formatFeetInches(47 + i)); // ~3'11"–7'3"

const GOAL_OPTIONS = [
  { key: 'lose', emoji: '📉', label: 'Lose Weight' },
  { key: 'maintain', emoji: '⚖️', label: 'Maintain Weight' },
  { key: 'gain', emoji: '💪', label: 'Gain Muscle' },
];

const QUESTIONS = [
  {
    key: 'wakeUp',
    question: 'How did you wake up today?',
    options: [
      { key: 'tired', emoji: '😴', label: 'Tired' },
      { key: 'normal', emoji: '😐', label: 'Normal' },
      { key: 'energized', emoji: '⚡', label: 'Energized' },
    ],
  },
  {
    key: 'training',
    question: 'Did you train today?',
    options: [
      { key: 'rest', emoji: '❌', label: 'Rest Day' },
      { key: 'light', emoji: '💪', label: 'Light Training' },
      { key: 'intense', emoji: '🔥', label: 'Intense Training' },
    ],
  },
  {
    key: 'eating',
    question: 'Did you eat your meal prep today?',
    options: [
      { key: 'followed', emoji: '✅', label: 'I ate my meal', desc: 'I followed my meal plan' },
      { key: 'other', emoji: '😐', label: 'I ate something else', desc: "Didn't follow the plan" },
      { key: 'bad', emoji: '❌', label: "I didn't eat well", desc: 'Skipped or ate badly' },
    ],
  },
  {
    key: 'physical',
    question: 'How do you feel physically?',
    options: [
      { key: 'sore', emoji: '😣', label: 'Sore' },
      { key: 'normal', emoji: '😐', label: 'Normal' },
      { key: 'great', emoji: '💪', label: 'Great' },
    ],
  },
];

const EXERCISES = [
  { key: 'squat', emoji: '🏋️', label: 'Squat', unit: 'kg' },
  { key: 'bench', emoji: '🔱', label: 'Bench Press', unit: 'kg' },
  { key: 'deadlift', emoji: '🧲', label: 'Deadlift', unit: 'kg' },
  { key: 'mile', emoji: '🏃', label: '1 Mile Run', unit: 'min' },
  { key: 'ohp', emoji: '💪', label: 'Overhead Press', unit: 'kg' },
  { key: 'pullups', emoji: '🤸', label: 'Pull-ups', unit: 'reps' },
];

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

function kgToLbs(kg) {
  return Math.round(kg * 2.20462);
}

function lbsToKg(lbs) {
  return Math.round(lbs / 2.20462);
}

function cmToInches(cm) {
  return Math.round(cm / 2.54);
}

function inchesToCm(inches) {
  return Math.round(inches * 2.54);
}

function formatFeetInches(totalInches) {
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${feet}'${inches}"`;
}

function parseFeetInches(str) {
  const match = str.match(/(\d+)'(\d+)"/);
  return Number(match[1]) * 12 + Number(match[2]);
}

function convertWeight(value, fromUnit, toUnit) {
  if (fromUnit === toUnit) return value;
  const kg = fromUnit === 'kg' ? value : lbsToKg(value);
  const converted = toUnit === 'kg' ? kg : kgToLbs(kg);
  return toUnit === 'kg' ? clamp(converted, 30, 200) : clamp(converted, 66, 441);
}

function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getPlannedMealNames(dayPlan) {
  if (!dayPlan) return [];
  const ids = ['breakfast', 'lunch', 'dinner', 'snack'].flatMap(slot => dayPlan[slot] ?? []);
  return ids.map(id => CATALOG.find(r => r.id === id)?.name).filter(Boolean);
}

function UnitToggle({ options, value, onChange, theme }) {
  return (
    <View style={[styles.unitToggle, { borderColor: theme.border }]}>
      {options.map(opt => {
        const selected = opt === value;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={[styles.unitOption, selected && { backgroundColor: theme.accent }]}
          >
            <Text style={[styles.unitOptionText, { color: selected ? '#FFFFFF' : theme.muted }]}>
              {opt.toUpperCase()}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function SummaryStat({ icon, label, value, theme }) {
  return (
    <View style={styles.summaryStat}>
      <Text style={styles.summaryIcon}>{icon}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={[styles.summaryLabel, { color: theme.subtext }]}>{label}</Text>
    </View>
  );
}

function QuestionBlock({ question, hint, options, value, onChange, theme }) {
  return (
    <View style={styles.question}>
      <Text style={[styles.questionLabel, { color: theme.text }]}>{question}</Text>
      {hint && (
        <Text style={[styles.questionHint, { color: theme.subtext }]} numberOfLines={2}>
          {hint}
        </Text>
      )}
      <View style={styles.optionList}>
        {options.map(opt => {
          const selected = value === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => onChange(opt.key)}
              style={[
                styles.optionRow,
                { borderColor: theme.border },
                selected && { borderColor: theme.accent, backgroundColor: theme.accentDim },
              ]}
            >
              <Text style={styles.optionEmoji}>{opt.emoji}</Text>
              <View style={styles.optionTextCol}>
                <Text style={[styles.optionLabel, { color: theme.text }]}>{opt.label}</Text>
                {opt.desc && (
                  <Text style={[styles.optionDesc, { color: theme.subtext }]}>{opt.desc}</Text>
                )}
              </View>
              {selected && <Text style={[styles.optionCheck, { color: theme.accent }]}>✓</Text>}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function CheckInSummaryRow({ question, emoji, label, theme, isFirst }) {
  return (
    <View style={[styles.summaryQItem, !isFirst && styles.summaryQItemSpacing]}>
      <Text style={[styles.summaryQLabel, { color: theme.subtext }]}>{question}</Text>
      <View style={[styles.optionRow, { borderColor: theme.accent, backgroundColor: theme.accentDim }]}>
        <Text style={styles.optionEmoji}>{emoji}</Text>
        <Text style={[styles.optionLabel, { color: theme.text }]}>{label}</Text>
      </View>
    </View>
  );
}

function PRRow({ exercise, currentValue, inputValue, onChangeInput, onSave, theme, isFirst }) {
  const trimmed = inputValue.trim();
  const canSave = trimmed !== '' && !Number.isNaN(Number(trimmed));

  return (
    <View style={[styles.prRow, !isFirst && { borderTopWidth: 1, borderColor: theme.border, paddingTop: 16 }]}>
      <View style={styles.prHeaderRow}>
        <View style={styles.prNameRow}>
          <Text style={styles.prEmoji}>{exercise.emoji}</Text>
          <Text style={[styles.prLabel, { color: theme.text }]}>{exercise.label}</Text>
        </View>
        <Text style={[styles.prCurrent, { color: currentValue != null ? theme.accent : theme.subtext }]}>
          {currentValue != null ? `${currentValue} ${exercise.unit}` : 'No PR yet'}
        </Text>
      </View>
      <View style={styles.prInputRow}>
        <TextInput
          value={inputValue}
          onChangeText={onChangeInput}
          placeholder={`Log new PR (${exercise.unit})`}
          placeholderTextColor={theme.subtext}
          keyboardType="decimal-pad"
          style={[styles.prInput, { borderColor: theme.border, color: theme.text, backgroundColor: theme.bg }]}
        />
        <Pressable
          onPress={onSave}
          disabled={!canSave}
          style={[styles.prSaveBtn, { backgroundColor: canSave ? theme.accent : theme.border }]}
        >
          <Text style={[styles.prSaveBtnText, { color: canSave ? '#FFFFFF' : theme.muted }]}>✓</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function ProgressScreen() {
  const { isDark, theme } = useApp();

  const [checkIns, setCheckIns] = useState({});
  const [profile, setProfile] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);

  const [weightUnit, setWeightUnit] = useState('kg');
  const [weightValue, setWeightValue] = useState(70);
  const [heightUnit, setHeightUnit] = useState('cm');
  const [heightValue, setHeightValue] = useState(170);
  const [goal, setGoal] = useState(null);

  const [answers, setAnswers] = useState({ wakeUp: null, training: null, eating: null, physical: null });
  const [editingCheckIn, setEditingCheckIn] = useState(true);

  const [prs, setPrs] = useState({});
  const [prInputs, setPrInputs] = useState({});

  const [plannedMealNames, setPlannedMealNames] = useState([]);

  const todayKey = formatDateKey(new Date());

  useFocusEffect(
    useCallback(() => {
      Promise.all([loadProgressProfile(), loadCheckIns(), loadPRs(), loadMealPlans()]).then(
        ([savedProfile, allCheckIns, allPrs, allMealPlans]) => {
        setCheckIns(allCheckIns);
        setPrs(allPrs);
        setPrInputs({});
        setPlannedMealNames(getPlannedMealNames(allMealPlans[todayKey]));

        if (savedProfile) {
          setProfile(savedProfile);
          setEditingProfile(false);
          setWeightUnit(savedProfile.weightUnit);
          setHeightUnit(savedProfile.heightUnit);
          setWeightValue(
            savedProfile.weightUnit === 'kg' ? savedProfile.weightKg : kgToLbs(savedProfile.weightKg)
          );
          setHeightValue(
            savedProfile.heightUnit === 'cm'
              ? savedProfile.heightCm
              : formatFeetInches(cmToInches(savedProfile.heightCm))
          );
          setGoal(savedProfile.goal);
        } else {
          setProfile(null);
          setEditingProfile(true);
        }

        // The check-in is keyed by today's date, so a new day with no matching
        // entry naturally falls back to the empty survey — no midnight timer needed.
        const today = allCheckIns[todayKey];
        if (today) {
          setAnswers({
            wakeUp: today.wakeUp ?? null,
            training: today.training ?? null,
            eating: today.eating ?? null,
            physical: today.physical ?? null,
          });
          setEditingCheckIn(false);
        } else {
          setAnswers({ wakeUp: null, training: null, eating: null, physical: null });
          setEditingCheckIn(true);
        }
      });
    }, [todayKey])
  );

  const handleWeightUnitToggle = (nextUnit) => {
    setWeightValue(v => convertWeight(v, weightUnit, nextUnit));
    setWeightUnit(nextUnit);
  };

  const handleHeightUnitToggle = (nextUnit) => {
    if (nextUnit === heightUnit) return;
    const currentCm = heightUnit === 'cm' ? heightValue : inchesToCm(parseFeetInches(heightValue));
    setHeightValue(
      nextUnit === 'cm' ? clamp(currentCm, 120, 220) : formatFeetInches(clamp(cmToInches(currentCm), 47, 87))
    );
    setHeightUnit(nextUnit);
  };

  const startEditingProfile = () => {
    if (profile) {
      setWeightUnit(profile.weightUnit);
      setHeightUnit(profile.heightUnit);
      setWeightValue(profile.weightUnit === 'kg' ? profile.weightKg : kgToLbs(profile.weightKg));
      setHeightValue(
        profile.heightUnit === 'cm' ? profile.heightCm : formatFeetInches(cmToInches(profile.heightCm))
      );
      setGoal(profile.goal);
    }
    setEditingProfile(true);
  };

  const cancelEditingProfile = () => {
    if (!profile) return;
    setWeightUnit(profile.weightUnit);
    setHeightUnit(profile.heightUnit);
    setWeightValue(profile.weightUnit === 'kg' ? profile.weightKg : kgToLbs(profile.weightKg));
    setHeightValue(
      profile.heightUnit === 'cm' ? profile.heightCm : formatFeetInches(cmToInches(profile.heightCm))
    );
    setGoal(profile.goal);
    setEditingProfile(false);
  };

  const handleSaveProfile = async () => {
    const weightKg = weightUnit === 'kg' ? weightValue : lbsToKg(weightValue);
    const heightCm = heightUnit === 'cm' ? heightValue : inchesToCm(parseFeetInches(heightValue));
    const newProfile = { weightKg, heightCm, weightUnit, heightUnit, goal };
    await saveProgressProfile(newProfile);
    setProfile(newProfile);
    setEditingProfile(false);
  };

  const handleAnswer = (key, value) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const startEditingCheckIn = () => setEditingCheckIn(true);

  const canSaveCheckIn = Boolean(answers.wakeUp && answers.training && answers.eating && answers.physical);

  const handleSaveCheckIn = async () => {
    if (!canSaveCheckIn) return;
    const updated = await saveCheckIn(todayKey, { ...answers, updatedAt: Date.now() });
    setCheckIns(updated);
    setEditingCheckIn(false);
  };

  const handlePrInputChange = (key, text) => {
    setPrInputs(prev => ({ ...prev, [key]: text }));
  };

  const handleSavePr = async (key) => {
    const raw = (prInputs[key] ?? '').trim();
    const value = Number(raw);
    if (raw === '' || Number.isNaN(value)) return;
    const updated = await savePR(key, value);
    setPrs(updated);
    setPrInputs(prev => ({ ...prev, [key]: '' }));
  };

  const weightDisplay = profile
    ? profile.weightUnit === 'kg'
      ? `${profile.weightKg} kg`
      : `${kgToLbs(profile.weightKg)} lbs`
    : null;
  const heightDisplay = profile
    ? profile.heightUnit === 'cm'
      ? `${profile.heightCm} cm`
      : formatFeetInches(cmToInches(profile.heightCm))
    : null;
  const goalInfo = profile ? GOAL_OPTIONS.find(g => g.key === profile.goal) : null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.text }]}>Progress</Text>
        <Text style={[styles.subtitle, { color: theme.subtext }]}>
          Your profile and how you're feeling, day by day.
        </Text>

        {/* PROFILE */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Your Profile</Text>
            {!editingProfile && profile && (
              <Pressable onPress={startEditingProfile} hitSlop={8}>
                <Text style={[styles.linkText, { color: theme.accent }]}>Edit</Text>
              </Pressable>
            )}
          </View>

          {editingProfile ? (
            <>
              <View style={styles.fieldGroup}>
                <View style={styles.fieldHeaderRow}>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>Weight</Text>
                  <UnitToggle options={['kg', 'lbs']} value={weightUnit} onChange={handleWeightUnitToggle} theme={theme} />
                </View>
                <WheelPicker
                  data={weightUnit === 'kg' ? KG_RANGE : LBS_RANGE}
                  selectedValue={weightValue}
                  onValueChange={setWeightValue}
                  theme={theme}
                />
              </View>

              <View style={styles.fieldGroup}>
                <View style={styles.fieldHeaderRow}>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>Height</Text>
                  <UnitToggle options={['cm', 'ft']} value={heightUnit} onChange={handleHeightUnitToggle} theme={theme} />
                </View>
                <WheelPicker
                  data={heightUnit === 'cm' ? CM_RANGE : FT_RANGE}
                  selectedValue={heightValue}
                  onValueChange={setHeightValue}
                  theme={theme}
                />
              </View>

              <Text style={[styles.fieldLabel, { color: theme.text, marginBottom: 10 }]}>Weight Goal</Text>
              <View style={styles.goalOptions}>
                {GOAL_OPTIONS.map(g => {
                  const selected = goal === g.key;
                  return (
                    <Pressable
                      key={g.key}
                      onPress={() => setGoal(g.key)}
                      style={[
                        styles.goalPill,
                        { borderColor: theme.border },
                        selected && { borderColor: theme.accent, backgroundColor: theme.accentDim },
                      ]}
                    >
                      <Text style={styles.goalEmoji}>{g.emoji}</Text>
                      <Text style={[styles.goalLabel, { color: theme.text }]}>{g.label}</Text>
                      {selected && <Text style={[styles.optionCheck, { color: theme.accent }]}>✓</Text>}
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.profileActions}>
                {profile && (
                  <Pressable onPress={cancelEditingProfile} style={[styles.cancelBtn, { borderColor: theme.border }]}>
                    <Text style={[styles.cancelBtnText, { color: theme.muted }]}>Cancel</Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={handleSaveProfile}
                  disabled={!goal}
                  style={[styles.saveBtn, styles.saveBtnFlex, { backgroundColor: goal ? theme.accent : theme.border }]}
                >
                  <Text style={[styles.saveBtnText, { color: goal ? '#FFFFFF' : theme.muted }]}>Save Profile</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <View style={styles.summaryRow}>
              <SummaryStat icon="🏋️" label="Weight" value={weightDisplay} theme={theme} />
              <SummaryStat icon="📏" label="Height" value={heightDisplay} theme={theme} />
              <SummaryStat icon={goalInfo?.emoji ?? '🎯'} label="Goal" value={goalInfo?.label ?? '—'} theme={theme} />
            </View>
          )}
        </View>

        {/* DAILY CHECK-IN */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Daily Check-In</Text>
            {!editingCheckIn && (
              <Pressable onPress={startEditingCheckIn} hitSlop={8}>
                <Text style={[styles.linkText, { color: theme.accent }]}>Edit</Text>
              </Pressable>
            )}
          </View>

          {editingCheckIn ? (
            <>
              <Text style={[styles.sectionDesc, { color: theme.subtext }]}>
                5 quick taps. Takes less than a minute.
              </Text>

              {QUESTIONS.map(q => (
                <QuestionBlock
                  key={q.key}
                  question={q.question}
                  hint={
                    q.key === 'eating' && plannedMealNames.length > 0
                      ? `Today's plan: ${plannedMealNames.join(', ')}`
                      : null
                  }
                  options={q.options}
                  value={answers[q.key]}
                  onChange={(val) => handleAnswer(q.key, val)}
                  theme={theme}
                />
              ))}

              <Pressable
                onPress={handleSaveCheckIn}
                disabled={!canSaveCheckIn}
                style={[styles.saveBtn, { backgroundColor: canSaveCheckIn ? theme.accent : theme.border }]}
              >
                <Text style={[styles.saveBtnText, { color: canSaveCheckIn ? '#FFFFFF' : theme.muted }]}>
                  Save Check-In
                </Text>
              </Pressable>
              {!canSaveCheckIn && (
                <Text style={[styles.saveHint, { color: theme.subtext }]}>
                  Answer all 4 questions above to save.
                </Text>
              )}
            </>
          ) : (
            <>
              {QUESTIONS.map((q, index) => {
                const selectedOpt = q.options.find(o => o.key === answers[q.key]);
                return (
                  <CheckInSummaryRow
                    key={q.key}
                    question={q.question}
                    emoji={selectedOpt?.emoji}
                    label={selectedOpt?.label}
                    theme={theme}
                    isFirst={index === 0}
                  />
                );
              })}
              <Text style={[styles.savedBadgeText, { color: theme.accent }]}>✓ Saved for Today</Text>
            </>
          )}
        </View>

        {/* PERSONAL RECORDS */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Personal Records</Text>
          <Text style={[styles.sectionDesc, { color: theme.subtext }]}>
            Log your best lifts and times.
          </Text>

          {EXERCISES.map((exercise, index) => (
            <PRRow
              key={exercise.key}
              exercise={exercise}
              currentValue={prs[exercise.key] ?? null}
              inputValue={prInputs[exercise.key] ?? ''}
              onChangeInput={(text) => handlePrInputChange(exercise.key, text)}
              onSave={() => handleSavePr(exercise.key)}
              theme={theme}
              isFirst={index === 0}
            />
          ))}
        </View>
      </ScrollView>
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
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  sectionDesc: { fontSize: 12, marginTop: 2, marginBottom: 8 },
  linkText: { fontSize: 13, fontWeight: '700' },

  fieldGroup: { marginTop: 16 },
  fieldHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  fieldLabel: { fontSize: 14, fontWeight: '600' },

  unitToggle: { flexDirection: 'row', borderWidth: 1, borderRadius: 8, overflow: 'hidden' },
  unitOption: { paddingHorizontal: 10, paddingVertical: 5 },
  unitOptionText: { fontSize: 11, fontWeight: '700' },

  goalOptions: { gap: 8 },
  goalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  goalEmoji: { fontSize: 18 },
  goalLabel: { fontSize: 14, fontWeight: '600', flex: 1 },

  profileActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelBtn: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '700' },

  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  summaryStat: { alignItems: 'center', flex: 1, gap: 2 },
  summaryIcon: { fontSize: 28, marginBottom: 4 },
  summaryValue: { fontSize: 15, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' },
  summaryLabel: { fontSize: 11, fontWeight: '600' },

  question: { marginTop: 18 },
  questionLabel: { fontSize: 14, fontWeight: '600', marginBottom: 10 },
  questionHint: { fontSize: 12, marginTop: -6, marginBottom: 10 },
  optionList: { gap: 8 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  optionEmoji: { fontSize: 18 },
  optionTextCol: { flex: 1 },
  optionLabel: { fontSize: 14, fontWeight: '600', flex: 1 },
  optionDesc: { fontSize: 12, marginTop: 2 },
  optionCheck: { fontSize: 16, fontWeight: '700' },

  summaryQItem: {},
  summaryQItemSpacing: { marginTop: 14 },
  summaryQLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  savedBadgeText: { fontSize: 13, fontWeight: '700', textAlign: 'center', marginTop: 18 },

  saveBtn: {
    marginTop: 20,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnFlex: { flex: 1, marginTop: 0 },
  saveBtnText: { fontSize: 14, fontWeight: '700' },
  saveHint: { fontSize: 12, textAlign: 'center', marginTop: 8 },

  prRow: { marginTop: 16 },
  prHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  prNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  prEmoji: { fontSize: 18 },
  prLabel: { fontSize: 14, fontWeight: '600' },
  prCurrent: { fontSize: 13, fontWeight: '700' },
  prInputRow: { flexDirection: 'row', gap: 8 },
  prInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  prSaveBtn: {
    width: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prSaveBtnText: { fontSize: 16, fontWeight: '700' },
});
