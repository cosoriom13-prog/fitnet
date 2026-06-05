import { useState } from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { SPORTS } from '../data/recipes';
import { useApp } from '../context/AppContext';
import { addRecentRecipe } from '../utils/storage';
import { getSportName } from '../i18n/translations';
import RecipeDetailModal from './RecipeDetailModal';

export default function RecipeCard({ recipe }) {
  const { theme, language, refreshRecentRecipes } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const sport = SPORTS.find(s => s.id === recipe.sport);

  const handleOpen = async () => {
    setModalVisible(true);
    await addRecentRecipe(recipe);
    refreshRecentRecipes();
  };

  return (
    <>
      <Pressable
        onPress={handleOpen}
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: theme.card, borderColor: theme.border },
          pressed && styles.cardPressed,
        ]}
      >
        <View style={styles.top}>
          <View style={[styles.sportBadge, { backgroundColor: theme.border }]}>
            <Text style={styles.sportIcon}>{sport?.icon}</Text>
            <Text style={[styles.sportName, { color: theme.muted }]}>
              {getSportName(recipe.sport, language)}
            </Text>
          </View>
          <Text style={[styles.chevron, { color: theme.accent }]}>›</Text>
        </View>

        <Text style={[styles.recipeName, { color: theme.text }]}>{recipe.name}</Text>
        <Text style={[styles.description, { color: theme.subtext }]} numberOfLines={2}>
          {recipe.description}
        </Text>

        <View style={styles.statsRow}>
          {recipe.calories != null ? (
            <>
              <StatChip icon="🔥" value={`${recipe.calories} kcal`} color={theme.muted} />
              <StatChip icon="💪" value={`${recipe.protein}g protein`} color={theme.muted} />
              {recipe.prepTime ? <StatChip icon="⏱" value={recipe.prepTime} color={theme.muted} /> : null}
            </>
          ) : (
            <>
              {recipe.intensity_tag ? (
                <StatChip
                  icon={recipe.intensity_tag === 'hard' ? '🔴' : recipe.intensity_tag === 'moderate' ? '🟡' : '🟢'}
                  value={recipe.intensity_tag}
                  color={theme.muted}
                />
              ) : null}
              {recipe.timing ? <StatChip icon="⏱" value={recipe.timing} color={theme.muted} /> : null}
            </>
          )}
        </View>
      </Pressable>

      <RecipeDetailModal
        recipe={recipe}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}

function StatChip({ icon, value, color }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statText, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardPressed: { opacity: 0.75 },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  sportIcon: { fontSize: 12 },
  sportName: { fontSize: 11, fontWeight: '600' },
  chevron: { fontSize: 24, lineHeight: 24, fontWeight: '300' },
  recipeName: { fontSize: 17, fontWeight: '700', marginBottom: 6 },
  description: { fontSize: 13, lineHeight: 19, marginBottom: 12 },
  statsRow: { flexDirection: 'row', gap: 14 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statIcon: { fontSize: 11 },
  statText: { fontSize: 12, fontWeight: '500' },
});
