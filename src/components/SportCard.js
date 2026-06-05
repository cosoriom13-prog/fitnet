import { Pressable, Text, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';

export default function SportCard({ sport, selected, onPress }) {
  const { theme } = useApp();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor: theme.card, borderColor: theme.border },
        selected && { backgroundColor: theme.accent, borderColor: theme.accent },
      ]}
    >
      <Text style={styles.icon}>{sport.icon}</Text>
      <Text style={[styles.label, { color: theme.muted }, selected && { color: '#FFFFFF' }]}>
        {sport.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1.5,
  },
  icon: { fontSize: 15, marginRight: 6 },
  label: { fontSize: 14, fontWeight: '600' },
});
