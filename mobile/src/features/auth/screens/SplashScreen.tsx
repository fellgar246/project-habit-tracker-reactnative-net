import { ActivityIndicator, Text, View } from 'react-native';

import { Screen } from '../../../components';
import { useTheme } from '../../../theme';

export function SplashScreen() {
  const { colors, spacing, typography } = useTheme();

  return (
    <Screen>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={[typography.title, { marginBottom: spacing.lg }]}>HabitTracker</Text>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    </Screen>
  );
}
