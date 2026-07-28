import { useState } from 'react';
import { Text } from 'react-native';

import { checkHealth } from '../../../api/endpoints/health';
import { getApiUrl, getHealthUrl } from '../../../api/config';
import { isApiError } from '../../../api/errors';
import { Button, Card, Screen } from '../../../components';
import { useAuth } from '../../auth/AuthContext';
import { useTheme } from '../../../theme';
import { HealthResponse } from '../../../types/api';

export function ProfileScreen() {
  const { colors, spacing, typography } = useTheme();
  const { setIsAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);

  async function handleTestConnection() {
    setLoading(true);
    setResult(null);
    setHealth(null);

    try {
      const data = await checkHealth();
      setHealth(data);
      setResult(`OK — ${data.status}, DB: ${data.database}`);
    } catch (error) {
      if (isApiError(error)) {
        setResult(`Error ${error.status}: ${error.detail ?? error.title}`);
      } else {
        setResult('Error desconocido al conectar con la API');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen scroll>
      <Text style={[typography.title, { marginBottom: spacing.lg }]}>Perfil</Text>

      <Card style={{ marginBottom: spacing.lg }}>
        <Text style={[typography.subtitle, { marginBottom: spacing.sm }]}>
          Diagnóstico de red
        </Text>
        <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>
          API URL
        </Text>
        <Text style={[typography.body, { marginBottom: spacing.sm }]} selectable>
          {getApiUrl()}
        </Text>
        <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>
          Health endpoint
        </Text>
        <Text style={[typography.body, { marginBottom: spacing.lg }]} selectable>
          {getHealthUrl()}
        </Text>
        <Button
          title="Probar conexión"
          loading={loading}
          onPress={handleTestConnection}
        />
        {result ? (
          <Text
            style={[
              typography.body,
              {
                marginTop: spacing.md,
                color: health?.status === 'ok' ? colors.success : colors.danger,
              },
            ]}
          >
            {result}
          </Text>
        ) : null}
      </Card>

      <Button
        title="Cerrar sesión (mock)"
        variant="secondary"
        onPress={() => setIsAuthenticated(false)}
      />
    </Screen>
  );
}
