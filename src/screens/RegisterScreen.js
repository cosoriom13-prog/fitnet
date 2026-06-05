import { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { saveUser } from '../utils/storage';
import { SPORTS } from '../data/recipes';
import { useApp } from '../context/AppContext';
import translations, { getSportName } from '../i18n/translations';

export default function RegisterScreen({ navigation }) {
  const { isDark, theme, language } = useApp();
  const t = translations[language];

  const GOALS = [
    { id: 'performance', label: t.goalPerformance },
    { id: 'strength', label: t.goalStrength },
    { id: 'endurance', label: t.goalEndurance },
    { id: 'weightloss', label: t.goalWeightloss },
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

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [selectedSport, setSelectedSport] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [selectedFrequency, setSelectedFrequency] = useState(null);
  const [selectedIntensity, setSelectedIntensity] = useState(null);
  const [recoveryPriority, setRecoveryPriority] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!name.trim()) { setError(t.errorName); return; }
    if (!selectedSport) { setError(t.errorSport); return; }
    if (!selectedGoal) { setError(t.errorGoal); return; }
    if (!selectedFrequency) { setError(t.errorTrainingFrequency); return; }
    if (!selectedIntensity) { setError(t.errorSessionIntensity); return; }
    setError('');
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
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top', 'bottom']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={[styles.logo, { color: theme.accent }]}>{t.appName}</Text>
            <Text style={[styles.tagline, { color: theme.subtext }]}>{t.tagline}</Text>
          </View>

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
            <TextInput
              style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
              placeholder={t.agePlaceholder}
              placeholderTextColor={theme.subtext}
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
              returnKeyType="done"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>{t.primarySport}</Text>
            <View style={styles.grid}>
              {SPORTS.map(s => (
                <Pressable
                  key={s.id}
                  onPress={() => setSelectedSport(s.id)}
                  style={[
                    styles.optionCard,
                    { backgroundColor: theme.card, borderColor: theme.border },
                    selectedSport === s.id && { borderColor: theme.accent, backgroundColor: theme.accentDim },
                  ]}
                >
                  <Text style={styles.optionIcon}>{s.icon}</Text>
                  <Text
                    style={[
                      styles.optionLabel,
                      { color: theme.muted },
                      selectedSport === s.id && { color: theme.text },
                    ]}
                  >
                    {getSportName(s.id, language)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>{t.fitnessGoal}</Text>
            <View style={styles.grid}>
              {GOALS.map(g => (
                <Pressable
                  key={g.id}
                  onPress={() => setSelectedGoal(g.id)}
                  style={[
                    styles.optionCard,
                    { backgroundColor: theme.card, borderColor: theme.border },
                    selectedGoal === g.id && { borderColor: theme.accent, backgroundColor: theme.accentDim },
                  ]}
                >
                  <Text
                    style={[
                      styles.optionLabel,
                      { color: theme.muted },
                      selectedGoal === g.id && { color: theme.text },
                    ]}
                  >
                    {g.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>{t.trainingFrequencyLabel}</Text>
            <View style={styles.grid}>
              {FREQUENCIES.map(f => (
                <Pressable
                  key={f.id}
                  onPress={() => setSelectedFrequency(f.id)}
                  style={[
                    styles.optionCard,
                    { backgroundColor: theme.card, borderColor: theme.border },
                    selectedFrequency === f.id && { borderColor: theme.accent, backgroundColor: theme.accentDim },
                  ]}
                >
                  <Text
                    style={[
                      styles.optionLabel,
                      { color: theme.muted },
                      selectedFrequency === f.id && { color: theme.text },
                    ]}
                  >
                    {f.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>{t.sessionIntensityLabel}</Text>
            <View style={styles.grid}>
              {INTENSITIES.map(i => (
                <Pressable
                  key={i.id}
                  onPress={() => setSelectedIntensity(i.id)}
                  style={[
                    styles.optionCard,
                    { backgroundColor: theme.card, borderColor: theme.border },
                    selectedIntensity === i.id && { borderColor: theme.accent, backgroundColor: theme.accentDim },
                  ]}
                >
                  <Text
                    style={[
                      styles.optionLabel,
                      { color: theme.muted },
                      selectedIntensity === i.id && { color: theme.text },
                    ]}
                  >
                    {i.label}
                  </Text>
                </Pressable>
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

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            onPress={handleRegister}
            style={({ pressed }) => [
              styles.cta,
              { backgroundColor: theme.accent },
              pressed && styles.ctaPressed,
            ]}
          >
            <Text style={styles.ctaText}>{t.getStarted}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  container: { padding: 24, paddingBottom: 48 },
  header: { marginBottom: 32, marginTop: 8 },
  logo: { fontSize: 38, fontWeight: '900', letterSpacing: -1 },
  tagline: { fontSize: 15, marginTop: 6 },
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 6,
  },
  optionIcon: { fontSize: 16 },
  optionLabel: { fontSize: 14, fontWeight: '600' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  error: { color: '#F87171', fontSize: 13, marginBottom: 16, textAlign: 'center' },
  cta: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  ctaPressed: { opacity: 0.85 },
  ctaText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
});
