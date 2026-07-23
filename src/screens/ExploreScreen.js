import { useState, useMemo } from 'react';
import { View, Text, TextInput, Pressable, SectionList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useApp } from '../context/AppContext';
import { CATALOG } from '../data/catalog';
import { SPORTS } from '../data/recipes';
import { getSportName } from '../i18n/translations';
import RecipeCard from '../components/RecipeCard';

function matchesQuery(recipe, words) {
  const haystack = [recipe.name, recipe.description, ...(recipe.ingredients ?? [])]
    .join(' ')
    .toLowerCase();
  return words.every(word => haystack.includes(word));
}

export default function ExploreScreen() {
  const { isDark, theme, language } = useApp();
  const [query, setQuery] = useState('');

  const trimmedQuery = query.trim().toLowerCase();
  const isSearching = trimmedQuery.length > 0;

  const sections = useMemo(() => {
    if (isSearching) {
      const words = trimmedQuery.split(/\s+/).filter(Boolean);
      const results = CATALOG.filter(r => matchesQuery(r, words));
      return results.length ? [{ key: 'results', title: null, data: results }] : [];
    }
    return SPORTS
      .map(sport => ({
        key: sport.id,
        title: getSportName(sport.id, language),
        icon: sport.icon,
        data: CATALOG.filter(r => r.sport === sport.id),
      }))
      .filter(section => section.data.length > 0);
  }, [isSearching, trimmedQuery, language]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Explore</Text>
        <View style={[styles.searchBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search recipes or ingredients..."
            placeholderTextColor={theme.subtext}
            style={[styles.searchInput, { color: theme.text }]}
            returnKeyType="search"
            autoCorrect={false}
            clearButtonMode="never"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Text style={[styles.clearIcon, { color: theme.muted }]}>✕</Text>
            </Pressable>
          )}
        </View>
        {isSearching && (
          <Text style={[styles.resultsCount, { color: theme.subtext }]}>
            {sections.length ? sections[0].data.length : 0} result
            {sections.length && sections[0].data.length !== 1 ? 's' : ''} for "{query.trim()}"
          </Text>
        )}
      </View>

      {sections.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No results</Text>
          <Text style={[styles.emptySubtitle, { color: theme.subtext }]}>
            No recipes match "{query.trim()}". Try a different name or ingredient.
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.cardWrap}>
              <RecipeCard recipe={item} />
            </View>
          )}
          renderSectionHeader={({ section }) =>
            section.title ? (
              <View style={[styles.sectionHeader, { backgroundColor: theme.bg }]}>
                <Text style={styles.sectionIcon}>{section.icon}</Text>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>{section.title}</Text>
                <Text style={[styles.sectionCount, { color: theme.subtext }]}>{section.data.length}</Text>
              </View>
            ) : null
          }
          stickySectionHeadersEnabled
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 14 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, fontSize: 14, height: '100%' },
  clearIcon: { fontSize: 14, fontWeight: '700', padding: 4 },
  resultsCount: { fontSize: 12, marginTop: 10, marginLeft: 2 },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  cardWrap: { paddingHorizontal: 4 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
    paddingTop: 16,
    paddingBottom: 10,
  },
  sectionIcon: { fontSize: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', flex: 1 },
  sectionCount: { fontSize: 12, fontWeight: '600' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '800', marginBottom: 6 },
  emptySubtitle: { fontSize: 14, textAlign: 'center' },
});
