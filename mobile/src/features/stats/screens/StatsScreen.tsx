import { Text } from 'react-native';

import { EmptyState, Screen } from '../../../components';
import { useTheme } from '../../../theme';

export function StatsScreen() {
  const { colors, typography } = useTheme();

  return (
    <Screen>
      <Text style={[typography.title, { marginBottom: 16 }]}>Estadísticas</Text>
      <EmptyState
        title="Estadísticas próximamente"
        description="Gráficas y métricas llegarán en PLAN-09."
        icon={<Text style={{ fontSize: 40 }}>📊</Text>}
      />
      <Text style={[typography.caption, { color: colors.textMuted, marginTop: 24 }]}>
        Placeholder — tab Estadísticas
      </Text>
    </Screen>
  );
}
