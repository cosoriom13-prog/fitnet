import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { loadUser, clearUser } from '../utils/storage';
import { CATALOG } from '../data/catalog';
import { useApp } from '../context/AppContext';
import translations from '../i18n/translations';
import RecipeCard from '../components/RecipeCard';

export default function HomeScreen({ navigation }) {
  const { isDark, theme, language } = useApp();
  const t = translations[language];
  const [user, setUser] = useState(null);

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

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: theme.text }]}>
            {firstName ? t.greeting(firstName) : t.appName}
          </Text>
          <Text style={[styles.subtitle, { color: theme.subtext }]}>
            {t.recipesReady(filteredRecipes.length)}
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

      <FlatList
        data={filteredRecipes}
        keyExtractor={r => r.id}
        renderItem={({ item }) => <RecipeCard recipe={item} />}
        contentContainerStyle={styles.recipeList}
        showsVerticalScrollIndicator={false}
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
  greeting: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 2 },
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
