import { useState, useCallback } from 'react';
import {
  View,
  Text,
  Switch,
  Pressable,
  ScrollView,
  Alert,
  Modal,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { loadUser, saveUser } from '../utils/storage';
import { SPORTS } from '../data/recipes';
import translations, { getSportName } from '../i18n/translations';

export default function SettingsScreen({ navigation }) {
  const { isDark, toggleTheme, language, changeLanguage, theme, recentRecipes, refreshRecentRecipes } = useApp();
  const t = translations[language];
  const [user, setUser] = useState(null);
  const [sportModal, setSportModal] = useState(false);
  const [frequencyModal, setFrequencyModal] = useState(false);
  const [intensityModal, setIntensityModal] = useState(false);

  const frequencies = [
    { id: '1-2x/week', label: t.freq1to2 },
    { id: '3-4x/week', label: t.freq3to4 },
    { id: '5x+/week', label: t.freq5plus },
  ];

  const intensities = [
    { id: 'easy', label: t.intensityEasy },
    { id: 'moderate', label: t.intensityModerate },
    { id: 'hard', label: t.intensityHard },
  ];

  useFocusEffect(
    useCallback(() => {
      loadUser().then(setUser);
      refreshRecentRecipes();
    }, [])
  );

  const currentSport = SPORTS.find(s => s.id === user?.sport);
  const currentFrequency = frequencies.find(f => f.id === user?.trainingFrequency);
  const currentIntensity = intensities.find(i => i.id === user?.sessionIntensity);

  const handleChangeSportPress = () => {
    Alert.alert(t.changeSportTitle, t.changeSportConfirm, [
      { text: t.cancel, style: 'cancel' },
      { text: t.confirm, onPress: () => setSportModal(true) },
    ]);
  };

  const handleSportSelect = async (sportId) => {
    setSportModal(false);
    if (user) {
      const updated = { ...user, sport: sportId };
      await saveUser(updated);
      setUser(updated);
    }
  };

  const handleFrequencySelect = async (frequencyId) => {
    setFrequencyModal(false);
    if (user) {
      const updated = { ...user, trainingFrequency: frequencyId };
      await saveUser(updated);
      setUser(updated);
    }
  };

  const handleIntensitySelect = async (intensityId) => {
    setIntensityModal(false);
    if (user) {
      const updated = { ...user, sessionIntensity: intensityId };
      await saveUser(updated);
      setUser(updated);
    }
  };

  const handleRecoveryToggle = async (value) => {
    if (user) {
      const updated = { ...user, recoveryPriority: value };
      await saveUser(updated);
      setUser(updated);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        {navigation.canGoBack() ? (
          <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.backBtn}>
            <Text style={[styles.backIcon, { color: theme.accent }]}>‹</Text>
          </Pressable>
        ) : (
          <View style={styles.backBtn} />
        )}
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t.settings}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Profile */}
        <Text style={[styles.sectionLabel, { color: theme.muted }]}>{t.profile}</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Pressable onPress={handleChangeSportPress} style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={[styles.rowTitle, { color: theme.text }]}>{t.changeSport}</Text>
              <Text style={[styles.rowDesc, { color: theme.subtext }]}>{t.changeSportDesc}</Text>
            </View>
            <View style={styles.rowRight}>
              {currentSport && (
                <Text style={styles.sportEmoji}>{currentSport.icon}</Text>
              )}
              <Text style={[styles.rowRightText, { color: theme.muted }]}>
                {currentSport ? getSportName(currentSport.id, language) : ''}
              </Text>
              <Text style={[styles.rowChevron, { color: theme.accent }]}>›</Text>
            </View>
          </Pressable>
        </View>

        {/* Training Profile */}
        <Text style={[styles.sectionLabel, { color: theme.muted }]}>{t.trainingProfile}</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Pressable
            onPress={() => setFrequencyModal(true)}
            style={[styles.row, styles.rowBorder, { borderBottomColor: theme.border }]}
          >
            <View style={styles.rowLeft}>
              <Text style={[styles.rowTitle, { color: theme.text }]}>{t.changeFrequency}</Text>
              <Text style={[styles.rowDesc, { color: theme.subtext }]}>{t.changeFrequencyDesc}</Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={[styles.rowRightText, { color: theme.muted }]}>
                {currentFrequency?.label ?? ''}
              </Text>
              <Text style={[styles.rowChevron, { color: theme.accent }]}>›</Text>
            </View>
          </Pressable>
          <Pressable
            onPress={() => setIntensityModal(true)}
            style={[styles.row, styles.rowBorder, { borderBottomColor: theme.border }]}
          >
            <View style={styles.rowLeft}>
              <Text style={[styles.rowTitle, { color: theme.text }]}>{t.changeIntensity}</Text>
              <Text style={[styles.rowDesc, { color: theme.subtext }]}>{t.changeIntensityDesc}</Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={[styles.rowRightText, { color: theme.muted }]}>
                {currentIntensity?.label ?? ''}
              </Text>
              <Text style={[styles.rowChevron, { color: theme.accent }]}>›</Text>
            </View>
          </Pressable>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={[styles.rowTitle, { color: theme.text }]}>{t.recoveryPriorityLabel}</Text>
              <Text style={[styles.rowDesc, { color: theme.subtext }]}>{t.recoveryPriorityDesc}</Text>
            </View>
            <Switch
              value={!!user?.recoveryPriority}
              onValueChange={handleRecoveryToggle}
              trackColor={{ false: '#3A3A3C', true: theme.accent }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Appearance */}
        <Text style={[styles.sectionLabel, { color: theme.muted }]}>{t.appearance}</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={[styles.rowTitle, { color: theme.text }]}>{t.darkMode}</Text>
              <Text style={[styles.rowDesc, { color: theme.subtext }]}>{t.darkModeDesc}</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#3A3A3C', true: theme.accent }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Language */}
        <Text style={[styles.sectionLabel, { color: theme.muted }]}>{t.languageSection}</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Pressable
            onPress={() => changeLanguage('en')}
            style={[styles.row, styles.rowBorder, { borderBottomColor: theme.border }]}
          >
            <Text style={[styles.rowTitle, { color: theme.text }]}>{t.english}</Text>
            {language === 'en' && <Text style={[styles.checkmark, { color: theme.accent }]}>✓</Text>}
          </Pressable>
          <Pressable
            onPress={() => changeLanguage('es')}
            style={styles.row}
          >
            <Text style={[styles.rowTitle, { color: theme.text }]}>{t.spanish}</Text>
            {language === 'es' && <Text style={[styles.checkmark, { color: theme.accent }]}>✓</Text>}
          </Pressable>
        </View>

        {/* Activity */}
        <Text style={[styles.sectionLabel, { color: theme.muted }]}>{t.yourActivity}</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.activityHeader, { color: theme.text }]}>{t.recentlyViewed}</Text>
          {recentRecipes.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.subtext }]}>{t.noRecentRecipes}</Text>
          ) : (
            recentRecipes.map((r, i) => {
              const sport = SPORTS.find(s => s.id === r.sport);
              const last = i === recentRecipes.length - 1;
              return (
                <View
                  key={r.id}
                  style={[
                    styles.recentRow,
                    !last && styles.recentRowBorder,
                    !last && { borderBottomColor: theme.border },
                  ]}
                >
                  <Text style={styles.recentIcon}>{sport?.icon ?? '🍽'}</Text>
                  <Text style={[styles.recentName, { color: theme.text }]} numberOfLines={1}>
                    {r.name}
                  </Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Sport Picker Modal */}
      <Modal
        visible={sportModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSportModal(false)}
      >
        <SafeAreaView style={[styles.modalSafe, { backgroundColor: theme.bg }]} edges={['top', 'bottom']}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{t.primarySport}</Text>
            <Pressable
              onPress={() => setSportModal(false)}
              hitSlop={8}
              style={[styles.modalClose, { backgroundColor: theme.border }]}
            >
              <Text style={[styles.modalCloseText, { color: theme.muted }]}>✕</Text>
            </Pressable>
          </View>
          <ScrollView>
            {SPORTS.map((s) => {
              const selected = user?.sport === s.id;
              return (
                <Pressable
                  key={s.id}
                  onPress={() => handleSportSelect(s.id)}
                  style={({ pressed }) => [
                    styles.sportRow,
                    { borderBottomColor: theme.border },
                    selected && { backgroundColor: theme.accentDim },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text style={styles.sportRowIcon}>{s.icon}</Text>
                  <Text style={[styles.sportRowName, { color: theme.text }]}>
                    {getSportName(s.id, language)}
                  </Text>
                  {selected && (
                    <Text style={[styles.checkmark, { color: theme.accent, marginLeft: 'auto' }]}>✓</Text>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Training Frequency Picker Modal */}
      <Modal
        visible={frequencyModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setFrequencyModal(false)}
      >
        <SafeAreaView style={[styles.modalSafe, { backgroundColor: theme.bg }]} edges={['top', 'bottom']}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{t.changeFrequency}</Text>
            <Pressable
              onPress={() => setFrequencyModal(false)}
              hitSlop={8}
              style={[styles.modalClose, { backgroundColor: theme.border }]}
            >
              <Text style={[styles.modalCloseText, { color: theme.muted }]}>✕</Text>
            </Pressable>
          </View>
          <ScrollView>
            {frequencies.map((f) => {
              const selected = user?.trainingFrequency === f.id;
              return (
                <Pressable
                  key={f.id}
                  onPress={() => handleFrequencySelect(f.id)}
                  style={({ pressed }) => [
                    styles.sportRow,
                    { borderBottomColor: theme.border },
                    selected && { backgroundColor: theme.accentDim },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text style={[styles.sportRowName, { color: theme.text }]}>{f.label}</Text>
                  {selected && (
                    <Text style={[styles.checkmark, { color: theme.accent, marginLeft: 'auto' }]}>✓</Text>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Session Intensity Picker Modal */}
      <Modal
        visible={intensityModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIntensityModal(false)}
      >
        <SafeAreaView style={[styles.modalSafe, { backgroundColor: theme.bg }]} edges={['top', 'bottom']}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{t.changeIntensity}</Text>
            <Pressable
              onPress={() => setIntensityModal(false)}
              hitSlop={8}
              style={[styles.modalClose, { backgroundColor: theme.border }]}
            >
              <Text style={[styles.modalCloseText, { color: theme.muted }]}>✕</Text>
            </Pressable>
          </View>
          <ScrollView>
            {intensities.map((i) => {
              const selected = user?.sessionIntensity === i.id;
              return (
                <Pressable
                  key={i.id}
                  onPress={() => handleIntensitySelect(i.id)}
                  style={({ pressed }) => [
                    styles.sportRow,
                    { borderBottomColor: theme.border },
                    selected && { backgroundColor: theme.accentDim },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text style={[styles.sportRowName, { color: theme.text }]}>{i.label}</Text>
                  {selected && (
                    <Text style={[styles.checkmark, { color: theme.accent, marginLeft: 'auto' }]}>✓</Text>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: { width: 36, alignItems: 'flex-start' },
  backIcon: { fontSize: 32, lineHeight: 32, fontWeight: '300' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700' },
  headerSpacer: { width: 36 },
  scroll: { padding: 20, paddingBottom: 48 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 24,
    marginLeft: 4,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowBorder: { borderBottomWidth: 1 },
  rowLeft: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  rowDesc: { fontSize: 12, marginTop: 2 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowRightText: { fontSize: 13, fontWeight: '500' },
  sportEmoji: { fontSize: 16 },
  rowChevron: { fontSize: 22, lineHeight: 22, fontWeight: '300' },
  checkmark: { fontSize: 18, fontWeight: '700' },
  activityHeader: { fontSize: 13, fontWeight: '700', padding: 16, paddingBottom: 8 },
  emptyText: { fontSize: 13, padding: 16, paddingTop: 0 },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  recentRowBorder: { borderBottomWidth: 1 },
  recentIcon: { fontSize: 18 },
  recentName: { flex: 1, fontSize: 14, fontWeight: '500' },
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
  sportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 14,
  },
  sportRowIcon: { fontSize: 22 },
  sportRowName: { fontSize: 16, fontWeight: '600' },
});
