import { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
  StyleSheet,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { saveUser } from '../utils/storage';
import { SPORTS } from '../data/recipes';
import { useApp } from '../context/AppContext';
import translations, { getSportName } from '../i18n/translations';
import WheelPicker from '../components/WheelPicker';

const TOTAL_STEPS = 4;
const MIN_AGE = 13;
const MAX_AGE = 80;
const DEFAULT_AGE = 25;
const AGE_RANGE = Array.from({ length: MAX_AGE - MIN_AGE + 1 }, (_, i) => MIN_AGE + i);

export default function RegisterScreen({ navigation }) {
  const { isDark, theme, language } = useApp();
  const t = translations[language];
  const { width } = useWindowDimensions();

  const GOALS = [
    { id: 'performance', icon: '🏆', title: t.goalPerformanceTitle, desc: t.goalPerformanceDesc },
    { id: 'strength', icon: '💪', title: t.goalStrengthTitle, desc: t.goalStrengthDesc },
    { id: 'endurance', icon: '🫀', title: t.goalEnduranceTitle, desc: t.goalEnduranceDesc },
    { id: 'weightloss', icon: '⚡', title: t.goalWeightlossTitle, desc: t.goalWeightlossDesc },
  ];

  const FREQUENCIES = [
    { id: '1-2x/week', label: t.freq1to2 },
    { id: '3-4x/week', label: t.freq3to4 },
    { id: '5x+/week', label: t.freq5plus },
  ];

  const INTENSITIES = [
    { id: 'easy', label: t.intensityEasy },
    { id: 'moderate', label: t.intensityModerate },
    { id: 'hard', label: t.intensityHard },
  ];

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [age, setAge] = useState(String(DEFAULT_AGE));
  const [selectedSport, setSelectedSport] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [selectedFrequency, setSelectedFrequency] = useState(null);
  const [selectedIntensity, setSelectedIntensity] = useState(null);
  const [recoveryPriority, setRecoveryPriority] = useState(false);
  const [error, setError] = useState('');

  const progressAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const transitionTo = (nextStep, direction) => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -direction * width,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setStep(nextStep);
      Animated.timing(progressAnim, {
        toValue: nextStep,
        duration: 400,
        useNativeDriver: false,
      }).start();

      slideAnim.setValue(direction * width);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          speed: 14,
          bounciness: 6,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const validateStep = () => {
    if (step === 0) {
      if (!name.trim()) { setError(t.errorName); return false; }
    } else if (step === 1) {
      if (!selectedSport) { setError(t.errorSport); return false; }
    } else if (step === 2) {
      if (!selectedGoal) { setError(t.errorGoal); return false; }
    } else if (step === 3) {
      if (!selectedFrequency) { setError(t.errorTrainingFrequency); return false; }
      if (!selectedIntensity) { setError(t.errorSessionIntensity); return false; }
    }
    setError('');
    return true;
  };

  const handleNext = async () => {
    if (!validateStep()) return;

    if (step === TOTAL_STEPS - 1) {
      await saveUser({
        name: name.trim(),
        age: age.trim(),
        sport: selectedSport,
        goal: selectedGoal,
        trainingFrequency: selectedFrequency,
        sessionIntensity: selectedIntensity,
        recoveryPriority,
      });
      navigation.replace('Home');
      return;
    }

    transitionTo(step + 1, 1);
  };

  const handleBack = () => {
    if (step === 0) return;
    setError('');
    transitionTo(step - 1, -1);
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, TOTAL_STEPS - 1],
    outputRange: [`${100 / TOTAL_STEPS}%`, '100%'],
  });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top', 'bottom']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={styles.progressWrap}>
        <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
          <Animated.View style={[styles.progressFill, { backgroundColor: theme.accent, width: progressWidth }]} />
        </View>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ transform: [{ translateX: slideAnim }], opacity: fadeAnim }}>
            {step === 0 && (
              <StepName t={t} theme={theme} name={name} setName={setName} age={age} setAge={setAge} />
            )}
            {step === 1 && (
              <StepSport
                t={t}
                theme={theme}
                language={language}
                selectedSport={selectedSport}
                setSelectedSport={setSelectedSport}
              />
            )}
            {step === 2 && (
              <StepGoal t={t} theme={theme} goals={GOALS} selectedGoal={selectedGoal} setSelectedGoal={setSelectedGoal} />
            )}
            {step === 3 && (
              <StepDetails
                t={t}
                theme={theme}
                frequencies={FREQUENCIES}
                intensities={INTENSITIES}
                selectedFrequency={selectedFrequency}
                setSelectedFrequency={setSelectedFrequency}
                selectedIntensity={selectedIntensity}
                setSelectedIntensity={setSelectedIntensity}
                recoveryPriority={recoveryPriority}
                setRecoveryPriority={setRecoveryPriority}
              />
            )}
          </Animated.View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.navRow}>
            {step > 0 && (
              <Pressable
                onPress={handleBack}
                style={({ pressed }) => [
                  styles.backBtn,
                  { borderColor: theme.border },
                  pressed && styles.backPressed,
                ]}
              >
                <Text style={[styles.backText, { color: theme.text }]}>{t.back}</Text>
              </Pressable>
            )}

            <Pressable
              onPress={handleNext}
              style={({ pressed }) => [
                styles.nextBtn,
                { backgroundColor: theme.accent },
                pressed && styles.nextPressed,
              ]}
            >
              <Text style={styles.nextText}>{step === TOTAL_STEPS - 1 ? t.getStarted : t.next}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function bounce(anim, toValue) {
  Animated.sequence([
    Animated.timing(anim, { toValue, duration: 80, useNativeDriver: true }),
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 12 }),
  ]).start();
}

function StepName({ t, theme, name, setName, age, setAge }) {
  return (
    <View>
      <Text style={[styles.welcomeTitle, { color: theme.text }]}>{t.welcomeTitle}</Text>
      <Text style={[styles.welcomeSubtitle, { color: theme.subtext }]}>{t.welcomeSubtitle}</Text>

      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: theme.text }]}>{t.yourName}</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
          placeholder={t.namePlaceholder}
          placeholderTextColor={theme.subtext}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          returnKeyType="done"
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: theme.text }]}>{t.age}</Text>
        <WheelPicker
          data={AGE_RANGE}
          selectedValue={Number(age)}
          onValueChange={(value) => setAge(String(value))}
          theme={theme}
        />
      </View>
    </View>
  );
}

function StepSport({ t, theme, language, selectedSport, setSelectedSport }) {
  return (
    <View>
      <Text style={[styles.stepTitle, { color: theme.text }]}>{t.chooseSportTitle}</Text>
      <Text style={[styles.stepSubtitle, { color: theme.subtext }]}>{t.chooseSportSubtitle}</Text>

      <View style={styles.sportGrid}>
        {SPORTS.map(s => (
          <SportCard
            key={s.id}
            sport={s}
            label={getSportName(s.id, language)}
            selected={selectedSport === s.id}
            theme={theme}
            onPress={() => setSelectedSport(s.id)}
          />
        ))}
      </View>
    </View>
  );
}

function SportCard({ sport, label, selected, theme, onPress }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    bounce(scaleAnim, 0.92);
    onPress();
  };

  return (
    <Animated.View style={[styles.sportCardWrap, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        onPress={handlePress}
        style={[
          styles.sportCard,
          { backgroundColor: theme.card, borderColor: theme.border },
          selected && {
            borderColor: theme.accent,
            backgroundColor: theme.accentDim,
            shadowColor: theme.accent,
          },
        ]}
      >
        <Text style={styles.sportCardIcon}>{sport.icon}</Text>
        <Text style={[styles.sportCardLabel, { color: selected ? theme.text : theme.muted }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

function StepGoal({ t, theme, goals, selectedGoal, setSelectedGoal }) {
  return (
    <View>
      <Text style={[styles.stepTitle, { color: theme.text }]}>{t.chooseGoalTitle}</Text>
      <Text style={[styles.stepSubtitle, { color: theme.subtext }]}>{t.chooseGoalSubtitle}</Text>

      <View style={styles.goalList}>
        {goals.map(g => (
          <GoalCard
            key={g.id}
            goal={g}
            selected={selectedGoal === g.id}
            theme={theme}
            onPress={() => setSelectedGoal(g.id)}
          />
        ))}
      </View>
    </View>
  );
}

function GoalCard({ goal, selected, theme, onPress }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    bounce(scaleAnim, 0.97);
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={handlePress}
        style={[
          styles.goalCard,
          { backgroundColor: theme.card, borderColor: theme.border },
          selected && {
            borderColor: theme.accent,
            backgroundColor: theme.accentDim,
            shadowColor: theme.accent,
          },
        ]}
      >
        <Text style={styles.goalIcon}>{goal.icon}</Text>
        <View style={styles.goalTextWrap}>
          <Text style={[styles.goalTitle, { color: theme.text }]}>{goal.title}</Text>
          <Text style={[styles.goalDesc, { color: theme.subtext }]}>{goal.desc}</Text>
        </View>
        {selected ? <Text style={[styles.goalCheck, { color: theme.accent }]}>✓</Text> : null}
      </Pressable>
    </Animated.View>
  );
}

function StepDetails({
  t,
  theme,
  frequencies,
  intensities,
  selectedFrequency,
  setSelectedFrequency,
  selectedIntensity,
  setSelectedIntensity,
  recoveryPriority,
  setRecoveryPriority,
}) {
  return (
    <View>
      <Text style={[styles.stepTitle, { color: theme.text }]}>{t.trainingDetailsTitle}</Text>
      <Text style={[styles.stepSubtitle, { color: theme.subtext }]}>{t.trainingDetailsSubtitle}</Text>

      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: theme.text }]}>{t.trainingFrequencyLabel}</Text>
        <View style={styles.chipRow}>
          {frequencies.map(f => (
            <Chip
              key={f.id}
              label={f.label}
              selected={selectedFrequency === f.id}
              theme={theme}
              onPress={() => setSelectedFrequency(f.id)}
            />
          ))}
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: theme.text }]}>{t.sessionIntensityLabel}</Text>
        <View style={styles.chipRow}>
          {intensities.map(i => (
            <Chip
              key={i.id}
              label={i.label}
              selected={selectedIntensity === i.id}
              theme={theme}
              onPress={() => setSelectedIntensity(i.id)}
            />
          ))}
        </View>
      </View>

      <View style={[styles.fieldGroup, styles.switchRow]}>
        <Text style={[styles.fieldLabel, { color: theme.text, marginBottom: 0 }]}>
          {t.recoveryPriorityLabel}
        </Text>
        <Switch
          value={recoveryPriority}
          onValueChange={setRecoveryPriority}
          trackColor={{ false: theme.border, true: theme.accentDim }}
          thumbColor={recoveryPriority ? theme.accent : theme.muted}
        />
      </View>
    </View>
  );
}

function Chip({ label, selected, theme, onPress }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    bounce(scaleAnim, 0.93);
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={handlePress}
        style={[
          styles.chip,
          { backgroundColor: theme.card, borderColor: theme.border },
          selected && { borderColor: theme.accent, backgroundColor: theme.accentDim },
        ]}
      >
        <Text style={[styles.chipText, { color: selected ? theme.text : theme.muted }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  container: { padding: 24, paddingBottom: 48 },

  progressWrap: { paddingHorizontal: 24, paddingTop: 12 },
  progressTrack: { height: 5, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },

  welcomeTitle: { fontSize: 32, fontWeight: '900', letterSpacing: -0.5, marginTop: 16 },
  welcomeSubtitle: { fontSize: 15, marginTop: 8, marginBottom: 32, lineHeight: 21 },

  stepTitle: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5, marginTop: 16 },
  stepSubtitle: { fontSize: 15, marginTop: 8, marginBottom: 28, lineHeight: 21 },

  fieldGroup: { marginBottom: 24 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },

  sportGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  sportCardWrap: { width: '48%' },
  sportCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    borderRadius: 18,
    borderWidth: 2,
    gap: 8,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
  },
  sportCardIcon: { fontSize: 34 },
  sportCardLabel: { fontSize: 14, fontWeight: '700' },

  goalList: { gap: 12 },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 16,
    borderWidth: 2,
    gap: 14,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
  },
  goalIcon: { fontSize: 28 },
  goalTextWrap: { flex: 1 },
  goalTitle: { fontSize: 16, fontWeight: '700', marginBottom: 3 },
  goalDesc: { fontSize: 13, lineHeight: 18 },
  goalCheck: { fontSize: 20, fontWeight: '900' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1.5,
  },
  chipText: { fontSize: 14, fontWeight: '600' },

  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  error: { color: '#F87171', fontSize: 13, marginBottom: 16, textAlign: 'center' },

  navRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPressed: { opacity: 0.6 },
  backText: { fontSize: 15, fontWeight: '700' },
  nextBtn: { flex: 1, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  nextPressed: { opacity: 0.85 },
  nextText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
});
