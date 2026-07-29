import { Text, View } from 'react-native';

import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useTheme } from '../theme';

export function OfflineBanner() {
  const { isOffline } = useNetworkStatus();
  const { colors, spacing, typography } = useTheme();

  if (!isOffline) {
    return null;
  }

  return (
    <View
      accessibilityRole="alert"
      accessibilityLabel="Sin conexión a internet"
      style={{
        backgroundColor: colors.danger,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
      }}
    >
      <Text style={[typography.caption, { color: colors.surface, textAlign: 'center', fontWeight: '600' }]}>
        Sin conexión — los cambios se sincronizarán al reconectar
      </Text>
    </View>
  );
}
