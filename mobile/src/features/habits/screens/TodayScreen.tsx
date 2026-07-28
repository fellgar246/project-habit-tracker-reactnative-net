import { Text } from 'react-native';

import { EmptyState, Screen } from '../../../components';
import { useTheme } from '../../../theme';

export function TodayScreen() {
  const { colors, typography } = useTheme();

  return (
    <Screen>
      <Text style={[typography.title, { marginBottom: 16 }]}>Hoy</Text>
      <EmptyState
        title="Sin hábitos todavía"
        description="Aquí verás tus hábitos del día cuando implementemos PLAN-06."
        icon={<Text style={{ fontSize: 40 }}>📋</Text>}
      />
      <Text style={[typography.caption, { color: colors.textMuted, marginTop: 24 }]}>
        Placeholder — tab Hoy
      </Text>
    </Screen>
  );
}
