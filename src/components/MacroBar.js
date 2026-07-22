import { View, Text, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';
import translations from '../i18n/translations';

const MACRO_COLORS = { protein: '#7C3AED', carbs: '#3B82F6', fat: '#F97316' };

export default function MacroBar({ recipe, theme }) {
  const { language } = useApp();
  const t = translations[language];
  const protein = Math.max(0, Number(recipe.protein) || 0);
  const carbs = Math.max(0, Number(recipe.carbs) || 0);
  const fat = Math.max(0, Number(recipe.fat) || 0);
  const total = protein + carbs + fat;

  if (total <= 0) return null;

  const macros = [
    { key: 'protein', value: protein },
    { key: 'carbs', value: carbs },
    { key: 'fat', value: fat },
  ].map(m => ({ ...m, pct: Math.round((m.value / total) * 100) }));

  return (
    <View style={styles.macroBarContainer}>
      <View style={styles.macroBarTrack}>
        {macros.map(m => (
          m.value > 0 ? (
            <View
              key={m.key}
              style={{
                flexGrow: m.value,
                flexShrink: 0,
                flexBasis: 0,
                minWidth: 3,
                backgroundColor: MACRO_COLORS[m.key],
              }}
            />
          ) : null
        ))}
      </View>
      <View style={styles.macroLegendRow}>
        {macros.map(m => (
          <View key={m.key} style={styles.macroLegendItem}>
            <View style={[styles.macroDot, { backgroundColor: MACRO_COLORS[m.key] }]} />
            <Text style={[styles.macroLegendText, { color: theme.muted }]}>{t[m.key]} {m.pct}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  macroBarContainer: { marginTop: 12 },
  macroBarTrack: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  macroLegendRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  macroLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  macroDot: { width: 7, height: 7, borderRadius: 3.5 },
  macroLegendText: { fontSize: 11, fontWeight: '500' },
});
