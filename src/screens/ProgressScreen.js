import { useState, useCallback, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { loadCheckIns, saveCheckIn } from '../utils/storage';

const BAR_HEIGHT = 72;

function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function RatingRow({ emoji, label, value, onChange, theme }) {
  return (
    <View style={styles.ratingRow}>
      <View style={styles.ratingLabelRow}>
        <Text style={styles.ratingEmoji}>{emoji}</Text>
        <Text style={[styles.ratingLabel, { color: theme.text }]}>{label}</Text>
      </View>
      <View style={styles.ratingOptions}>
        {[1, 2, 3, 4, 5].map(n => {
          const selected = value === n;
          return (
            <Pressable
              key={n}
              onPress={() => onChange(n)}
              hitSlop={4}
              style={[
                styles.ratingCircle,
                { borderColor: theme.border },
                selected && { backgroundColor: theme.accent, borderColor: theme.accent },
              ]}
            >
              <Text style={[styles.ratingCircleText, { color: selected ? '#FFFFFF' : theme.muted }]}>
                {n}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function ProgressScreen() {
  const { isDark, theme } = useApp();
  const [checkIns, setCheckIns] = useState({});
  const [energy, setEnergy] = useState(null);
  const [sleep, setSleep] = useState(null);
  const [workout, setWorkout] = useState(null);
  const [saved, setSaved] = useState(false);

  const todayKey = formatDateKey(new Date());

  useFocusEffect(
    useCallback(() => {
      loadCheckIns().then(all => {
        setCheckIns(all);
        const today = all[todayKey];
        setEnergy(today?.energy ?? null);
        setSleep(today?.sleep ?? null);
        setWorkout(today?.workout ?? null);
        setSaved(!!today);
      });
    }, [todayKey])
  );

  const canSave = energy != null && sleep != null && workout != null;

  const handleChange = (setter) => (n) => {
    setter(n);
    setSaved(false);
  };

  const handleSave = async () => {
    const updated = await saveCheckIn(todayKey, { energy, sleep, workout, updatedAt: Date.now() });
    setCheckIns(updated);
    setSaved(true);
  };

  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = formatDateKey(d);
      const entry = checkIns[key];
      const avg = entry ? (entry.energy + entry.sleep + entry.workout) / 3 : null;
      days.push({
        key,
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        avg,
        isToday: key === todayKey,
      });
    }
    return days;
  }, [checkIns, todayKey]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.text }]}>Progress</Text>
        <Text style={[styles.subtitle, { color: theme.subtext }]}>
          Track how you feel, day by day.
        </Text>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Daily Check-In</Text>
          <Text style={[styles.sectionDesc, { color: theme.subtext }]}>
            Takes less than a minute. How was today?
          </Text>

          <RatingRow emoji="⚡" label="Energy" value={energy} onChange={handleChange(setEnergy)} theme={theme} />
          <RatingRow emoji="😴" label="Sleep" value={sleep} onChange={handleChange(setSleep)} theme={theme} />
          <RatingRow emoji="🏋️" label="Workout" value={workout} onChange={handleChange(setWorkout)} theme={theme} />

          <Pressable
            onPress={handleSave}
            disabled={!canSave}
            style={[
              styles.saveBtn,
              { backgroundColor: canSave ? theme.accent : theme.border },
            ]}
          >
            <Text style={[styles.saveBtnText, { color: canSave ? '#FFFFFF' : theme.muted }]}>
              {saved ? '✓ Saved for Today' : 'Save Check-In'}
            </Text>
          </Pressable>
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Last 7 Days</Text>
          <Text style={[styles.sectionDesc, { color: theme.subtext }]}>
            Average of energy, sleep &amp; workout ratings (1–5).
          </Text>

          <View style={styles.chartRow}>
            {weekDays.map(d => (
              <View key={d.key} style={styles.chartCol}>
                <View style={[styles.chartBarTrack, { backgroundColor: theme.border }]}>
                  <View
                    style={[
                      styles.chartBarFill,
                      {
                        height: d.avg != null ? Math.max(4, (d.avg / 5) * BAR_HEIGHT) : 0,
                        backgroundColor: theme.accent,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.chartValue, { color: theme.muted }]}>
                  {d.avg != null ? d.avg.toFixed(1) : '–'}
                </Text>
                <Text
                  style={[
                    styles.chartLabel,
                    { color: d.isToday ? theme.accent : theme.subtext },
                    d.isToday && styles.chartLabelToday,
                  ]}
                >
                  {d.label}
                </Text>
              </View>
            ))}
          </View>
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
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  sectionDesc: { fontSize: 12, marginTop: 2, marginBottom: 16 },
  ratingRow: { marginBottom: 16 },
  ratingLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  ratingEmoji: { fontSize: 15 },
  ratingLabel: { fontSize: 14, fontWeight: '600' },
  ratingOptions: { flexDirection: 'row', gap: 8 },
  ratingCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingCircleText: { fontSize: 14, fontWeight: '700' },
  saveBtn: {
    marginTop: 4,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: { fontSize: 14, fontWeight: '700' },
  chartRow: { flexDirection: 'row', justifyContent: 'space-between' },
  chartCol: { alignItems: 'center', gap: 6, flex: 1 },
  chartBarTrack: {
    width: 18,
    height: BAR_HEIGHT,
    borderRadius: 9,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartBarFill: { width: '100%', borderRadius: 9 },
  chartValue: { fontSize: 10, fontWeight: '600' },
  chartLabel: { fontSize: 11, fontWeight: '600' },
  chartLabelToday: { fontWeight: '800' },
});
