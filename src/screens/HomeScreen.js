import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Alert,
  StyleSheet,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { loadUser, clearUser, loadProgressProfile, loadCheckIns } from '../utils/storage';
import { CATALOG } from '../data/catalog';
import { SPORTS } from '../data/recipes';
import { useApp } from '../context/AppContext';
import translations, { getSportName, getMotivationalPhrase, getTimingLabel } from '../i18n/translations';
import RecipeCard from '../components/RecipeCard';
import RecipeDetailModal from '../components/RecipeDetailModal';

function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor((date - start) / oneDay);
}

function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function RecipeOfTheDayCard({ recipe, onPress, language }) {
  const t = translations[language];

  return (
    <LinearGradient
      colors={['#8B5CF6', '#5B21B6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.heroCard}
    >
      <Text style={styles.heroLabel}>✨ Today's Pick</Text>
      <Text style={styles.heroName} numberOfLines={2}>{recipe.name}</Text>
      {recipe.why_it_works ? (
        <Text style={styles.heroWhy} numberOfLines={3}>{recipe.why_it_works}</Text>
      ) : null}

      <View style={styles.heroStatsRow}>
        {recipe.calories != null && (
          <View style={styles.heroStat}>
            <Text style={styles.heroStatText}>🔥 {recipe.calories} kcal</Text>
          </View>
        )}
        {recipe.protein != null && (
          <View style={styles.heroStat}>
            <Text style={styles.heroStatText}>💪 {recipe.protein}g {t.protein.toLowerCase()}</Text>
          </View>
        )}
        {recipe.timing && (
          <View style={styles.heroStat}>
            <Text style={styles.heroStatText}>⏱ {getTimingLabel(recipe.timing, language)}</Text>
          </View>
        )}
      </View>

      <Pressable onPress={onPress} style={styles.heroButton}>
        <Text style={styles.heroButtonText}>View Recipe →</Text>
      </Pressable>
    </LinearGradient>
  );
}

export default function HomeScreen({ navigation }) {
  const { isDark, theme, language } = useApp();
  const t = translations[language];
  const [user, setUser] = useState(null);
  const [progressProfile, setProgressProfile] = useState(null);
  const [yesterdayCheckIn, setYesterdayCheckIn] = useState(null);
  const [featuredModalVisible, setFeaturedModalVisible] = useState(false);
  const listFade = useRef(new Animated.Value(0)).current;
  const listSlide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(listFade, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(listSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUser().then(u => {
        if (u) setUser(u);
      });
      loadProgressProfile().then(setProgressProfile);
      loadCheckIns().then(allCheckIns => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        setYesterdayCheckIn(allCheckIns[formatDateKey(yesterday)] ?? null);
      });
    }, [])
  );

  const filteredRecipes = (() => {
    if (!user?.sport) return CATALOG;
    const bySportAndGoal = CATALOG.filter(
      r => r.sport === user.sport && r.goal === user.goal
    );
    const base = bySportAndGoal.length
      ? bySportAndGoal
      : CATALOG.filter(r => r.sport === user.sport);

    const recoveryRank = (recipe) => {
      if (!user.recoveryPriority) return 0;
      return recipe.timing === 'post' || recipe.timing === 'recovery' ? 0 : 1;
    };

    return [...base].sort((a, b) => {
      const recoveryDiff = recoveryRank(a) - recoveryRank(b);
      if (recoveryDiff !== 0) return recoveryDiff;
      return (a.intensity_tag === user.sessionIntensity ? 0 : 1) -
        (b.intensity_tag === user.sessionIntensity ? 0 : 1);
    });
  })();

  const recipeOfTheDay = (() => {
    let pool = CATALOG;
    if (user?.sport) {
      const bySportAndGoal = CATALOG.filter(r => r.sport === user.sport && r.goal === user.goal);
      pool = bySportAndGoal.length ? bySportAndGoal : CATALOG.filter(r => r.sport === user.sport);
    }

    // Weight goal preference: prefer recipes matching the goal, but fall back
    // to the full pool if nothing qualifies so a pick is always available.
    if (progressProfile?.goal === 'lose') {
      const leaner = pool.filter(r => r.calories != null && r.calories < 500);
      if (leaner.length) pool = leaner;
    } else if (progressProfile?.goal === 'gain') {
      const highProtein = pool.filter(r => r.protein != null && r.protein > 40);
      if (highProtein.length) pool = highProtein;
    }

    // If yesterday's check-in showed the user skipped or strayed from their
    // meal plan, boost recovery/post recipes for today.
    const ateOffPlanYesterday =
      yesterdayCheckIn?.eating === 'bad' || yesterdayCheckIn?.eating === 'other';
    if (ateOffPlanYesterday) {
      const recoveryFocused = pool.filter(r => r.timing === 'post' || r.timing === 'recovery');
      if (recoveryFocused.length) pool = recoveryFocused;
    }

    if (!pool.length) return null;
    const dayOfYear = getDayOfYear(new Date());
    return pool[dayOfYear % pool.length];
  })();

  const handleLogout = () => {
    Alert.alert(t.logOut, t.logOutMessage, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.logOut,
        style: 'destructive',
        onPress: async () => {
          await clearUser();
          navigation.getParent()?.replace('Register');
        },
      },
    ]);
  };

  const firstName = user?.name?.split(' ')[0] ?? null;
  const currentSport = SPORTS.find(s => s.id === user?.sport);
  const motivationalPhrase = getMotivationalPhrase(language);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={styles.header}>
        <View style={styles.headerText}>
          <View style={styles.greetingRow}>
            <Text style={[styles.greeting, { color: theme.text }]}>
              {firstName ? t.greeting(firstName) : t.appName}
            </Text>
            {currentSport && (
              <View style={[styles.sportPill, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={styles.sportPillIcon}>{currentSport.icon}</Text>
                <Text style={[styles.sportPillText, { color: theme.muted }]}>
                  {getSportName(currentSport.id, language)}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.subtitle, { color: theme.subtext }]}>
            {t.recipesReady(filteredRecipes.length)}
          </Text>
          <Text style={[styles.motivational, { color: theme.accent }]}>
            {motivationalPhrase}
          </Text>
        </View>
        <View style={styles.headerButtons}>
          <Pressable
            onPress={() => navigation.navigate('Settings')}
            style={[styles.iconBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
            hitSlop={6}
          >
            <Text style={[styles.iconBtnText, { color: theme.muted }]}>⚙</Text>
          </Pressable>
          <Pressable
            onPress={handleLogout}
            style={[styles.iconBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
            hitSlop={6}
          >
            <Text style={[styles.iconBtnText, { color: theme.muted }]}>⎋</Text>
          </Pressable>
        </View>
      </View>

      <Animated.View
        style={{ flex: 1, opacity: listFade, transform: [{ translateY: listSlide }] }}
      >
        <FlatList
          data={filteredRecipes}
          keyExtractor={r => r.id}
          renderItem={({ item }) => <RecipeCard recipe={item} />}
          ListHeaderComponent={
            recipeOfTheDay ? (
              <RecipeOfTheDayCard
                recipe={recipeOfTheDay}
                onPress={() => setFeaturedModalVisible(true)}
                language={language}
              />
            ) : null
          }
          contentContainerStyle={styles.recipeList}
          showsVerticalScrollIndicator={false}
        />
      </Animated.View>

      <RecipeDetailModal
        recipe={recipeOfTheDay}
        visible={featuredModalVisible}
        onClose={() => setFeaturedModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerText: { flex: 1, paddingRight: 12 },
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  greeting: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 2 },
  motivational: { fontFamily: 'Poppins_600SemiBold', fontSize: 16, marginTop: 4 },
  sportPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  sportPillIcon: { fontSize: 12 },
  sportPillText: { fontSize: 12, fontWeight: '600' },
  headerButtons: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  iconBtnText: { fontSize: 16 },
  recipeList: { paddingHorizontal: 16, paddingBottom: 24 },

  heroCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 8,
  },
  heroName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  heroWhy: {
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 16,
  },
  heroStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  heroStat: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  heroStatText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },
  heroButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  heroButtonText: { fontSize: 14, fontWeight: '700', color: '#5B21B6' },
});
