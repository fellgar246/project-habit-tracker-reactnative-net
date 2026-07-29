import { View, Text, StyleSheet } from 'react-native';

import { Card } from '../../../components';
import { useTheme } from '../../../theme';

type StatCardProps = {
  label: string;
  value: string;
  emoji?: string;
};

export function StatCard({ label, value, emoji }: StatCardProps) {
  const { colors, spacing, typography } = useTheme();

  return (
    <Card style={[styles.card, { padding: spacing.md }]}>
      {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
      <Text style={[typography.subtitle, { color: colors.text }]}>{value}</Text>
      <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xs }]}>
        {label}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '45%',
  },
  emoji: {
    fontSize: 18,
    marginBottom: 4,
  },
});
