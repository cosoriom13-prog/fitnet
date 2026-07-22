import { useState, useRef } from 'react';
import { Pressable, View, Text, StyleSheet, Animated } from 'react-native';
import { SPORTS } from '../data/recipes';
import { useApp } from '../context/AppContext';
import { addRecentRecipe } from '../utils/storage';
import translations, { getSportName, getIntensityLabel, getTimingLabel } from '../i18n/translations';
import RecipeDetailModal from './RecipeDetailModal';
import MacroBar from './MacroBar';

export default function RecipeCard({ recipe }) {
  const { theme, language, refreshRecentRecipes } = useApp();
  const t = translations[language];
  const [modalVisible, setModalVisible] = useState(false);
  const sport = SPORTS.find(s => s.id === recipe.sport);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleOpen = async () => {
    setModalVisible(true);
    await addRecentRecipe(recipe);
    refreshRecentRecipes();
  };

  const handlePressIn = () => {
    Animated.timing(scaleAnim, { toValue: 0.97, duration: 100, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }).start();
  };

  return (
    <>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          onPress={handleOpen}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
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
                <StatChip icon="💪" value={`${recipe.protein}g ${t.protein.toLowerCase()}`} color={theme.muted} />
                {recipe.prepTime ? <StatChip icon="⏱" value={recipe.prepTime} color={theme.muted} /> : null}
              </>
            ) : (
              <>
                {recipe.intensity_tag ? (
                  <StatChip
                    icon={recipe.intensity_tag === 'hard' ? '🔴' : recipe.intensity_tag === 'moderate' ? '🟡' : '🟢'}
                    value={getIntensityLabel(recipe.intensity_tag, language)}
                    color={theme.muted}
                  />
                ) : null}
                {recipe.timing ? <StatChip icon="⏱" value={getTimingLabel(recipe.timing, language)} color={theme.muted} /> : null}
              </>
            )}
          </View>

          {recipe.calories != null ? <MacroBar recipe={recipe} theme={theme} /> : null}
        </Pressable>
      </Animated.View>

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
