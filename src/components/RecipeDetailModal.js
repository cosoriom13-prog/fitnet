import { Modal, View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import translations from '../i18n/translations';

export default function RecipeDetailModal({ recipe, visible, onClose }) {
  const { theme, language } = useApp();
  const t = translations[language];

  if (!recipe) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top', 'bottom']}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
            {recipe.name}
          </Text>
          <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.border }]} hitSlop={8}>
            <Text style={[styles.closeBtnText, { color: theme.muted }]}>✕</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {recipe.calories != null && (
            <View style={styles.macros}>
              <MacroPill label={t.calories} value={`${recipe.calories}`} unit="kcal" theme={theme} />
              <MacroPill label={t.protein} value={`${recipe.protein}`} unit="g" theme={theme} />
              <MacroPill label={t.carbs} value={`${recipe.carbs}`} unit="g" theme={theme} />
              <MacroPill label={t.fat} value={`${recipe.fat}`} unit="g" theme={theme} />
            </View>
          )}

          <View style={styles.metaRow}>
            {recipe.prepTime ? (
              <Text style={[styles.metaText, { color: theme.muted }]}>⏱ {recipe.prepTime}</Text>
            ) : recipe.timing ? (
              <Text style={[styles.metaText, { color: theme.muted }]}>⏱ {recipe.timing}</Text>
            ) : null}
            {recipe.difficulty ? (
              <View style={[styles.difficultyBadge, { borderColor: theme.accent }]}>
                <Text style={[styles.difficultyText, { color: theme.accent }]}>{recipe.difficulty}</Text>
              </View>
            ) : recipe.intensity_tag ? (
              <View style={[styles.difficultyBadge, { borderColor: theme.accent }]}>
                <Text style={[styles.difficultyText, { color: theme.accent }]}>{recipe.intensity_tag}</Text>
              </View>
            ) : null}
          </View>

          <Text style={[styles.description, { color: theme.subtext }]}>{recipe.description}</Text>

          {recipe.why_it_works ? (
            <>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>{t.whyItWorks}</Text>
              <View style={[styles.whyBox, { backgroundColor: theme.accentDim, borderColor: theme.accent }]}>
                <Text style={[styles.whyText, { color: theme.text }]}>{recipe.why_it_works}</Text>
              </View>
            </>
          ) : null}

          <Text style={[styles.sectionTitle, { color: theme.text }]}>{t.ingredients}</Text>
          {recipe.ingredients.map((ing, i) => (
            <View key={i} style={styles.listRow}>
              <View style={[styles.bullet, { backgroundColor: theme.accent }]} />
              <Text style={[styles.listText, { color: theme.subtext }]}>{ing}</Text>
            </View>
          ))}

          <Text style={[styles.sectionTitle, { color: theme.text }]}>{t.instructions}</Text>
          {recipe.steps.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={[styles.stepNum, { backgroundColor: theme.accent }]}>
                <Text style={styles.stepNumText}>{i + 1}</Text>
              </View>
              <Text style={[styles.listText, { color: theme.subtext }]}>{step}</Text>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function MacroPill({ label, value, unit, theme }) {
  return (
    <View style={[styles.macroPill, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.macroValue, { color: theme.accent }]}>{value}</Text>
      <Text style={[styles.macroUnit, { color: theme.accent }]}>{unit}</Text>
      <Text style={[styles.macroLabel, { color: theme.muted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: { fontSize: 20, fontWeight: '700', flex: 1, marginRight: 12 },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  closeBtnText: { fontSize: 13, fontWeight: '700' },
  scroll: { padding: 20, paddingBottom: 40 },
  macros: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, gap: 8 },
  macroPill: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
  },
  macroValue: { fontSize: 16, fontWeight: '800' },
  macroUnit: { fontSize: 10, fontWeight: '600', opacity: 0.8 },
  macroLabel: { fontSize: 10, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 12 },
  metaText: { fontSize: 13 },
  difficultyBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
  },
  difficultyText: { fontSize: 12, fontWeight: '600' },
  description: { fontSize: 14, lineHeight: 22, marginBottom: 24 },
  whyBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 24,
  },
  whyText: { fontSize: 14, lineHeight: 22 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 12, marginTop: 8 },
  listRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 8, marginRight: 10, flexShrink: 0 },
  listText: { fontSize: 14, lineHeight: 22, flex: 1 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 1,
    flexShrink: 0,
  },
  stepNumText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
});
