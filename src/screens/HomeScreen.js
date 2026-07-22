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
import { useFocusEffect } from '@react-navigation/native';
import { loadUser, clearUser } from '../utils/storage';
import { CATALOG } from '../data/catalog';
import { SPORTS } from '../data/recipes';
import { useApp } from '../context/AppContext';
import translations, { getSportName, getMotivationalPhrase } from '../i18n/translations';
import RecipeCard from '../components/RecipeCard';

export default function HomeScreen({ navigation }) {
  const { isDark, theme, language } = useApp();
  const t = translations[language];
  const [user, setUser] = useState(null);
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
    return [...base].sort((a, b) =>
      (a.intensity_tag === user.sessionIntensity ? 0 : 1) -
      (b.intensity_tag === user.sessionIntensity ? 0 : 1)
    );
  })();

  const handleLogout = () => {
    Alert.alert(t.logOut, t.logOutMessage, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.logOut,
        style: 'destructive',
        onPress: async () => {
          await clearUser();
          navigation.replace('Register');
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
          contentContainerStyle={styles.recipeList}
          showsVerticalScrollIndicator={false}
        />
      </Animated.View>
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
});
