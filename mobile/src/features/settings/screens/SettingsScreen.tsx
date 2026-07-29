import Constants from 'expo-constants';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, Switch, Text, View } from 'react-native';

import { checkHealth } from '../../../api/endpoints/health';
import { getApiUrl, getHealthUrl } from '../../../api/config';
import { isApiError } from '../../../api/errors';
import { Button, Card, Screen } from '../../../components';
import { useAuth } from '../../auth/AuthContext';
import { useHabits } from '../../habits/hooks';
import {
  getPermissionStatus,
  openNotificationSettings,
  setRemindersGloballyEnabled,
} from '../../notifications/scheduler';
import { getRemindersEnabled } from '../../notifications/preferences';
import { useTheme } from '../../../theme';
import { HealthResponse } from '../../../types/api';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

export function SettingsScreen() {
  const { colors, spacing, typography } = useTheme();
  const { user, logout } = useAuth();
  const { data: habits } = useHabits();

  const [remindersEnabled, setRemindersEnabledState] = useState(true);
  const [remindersLoading, setRemindersLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [diagLoading, setDiagLoading] = useState(false);
  const [diagResult, setDiagResult] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPreferences() {
      const [enabled, permission] = await Promise.all([
        getRemindersEnabled(),
        getPermissionStatus(),
      ]);

      if (!cancelled) {
        setRemindersEnabledState(enabled);
        setPermissionDenied(permission === 'denied');
        setRemindersLoading(false);
      }
    }

    void loadPreferences();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleRemindersToggle(enabled: boolean) {
    setRemindersEnabledState(enabled);
    await setRemindersGloballyEnabled(enabled, habits ?? []);
  }

  function handleLogoutPress() {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir de tu cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          setLogoutLoading(true);
          try {
            await logout();
          } finally {
            setLogoutLoading(false);
          }
        },
      },
    ]);
  }

  async function handleTestConnection() {
    setDiagLoading(true);
    setDiagResult(null);
    setHealth(null);

    try {
      const data = await checkHealth();
      setHealth(data);
      setDiagResult(`OK — ${data.status}, DB: ${data.database}`);
    } catch (error) {
      if (isApiError(error)) {
        setDiagResult(`Error ${error.status}: ${error.detail ?? error.title}`);
      } else {
        setDiagResult('Error desconocido al conectar con la API');
      }
    } finally {
      setDiagLoading(false);
    }
  }

  function handleVersionPressIn() {
    longPressTimer.current = setTimeout(() => {
      setShowDiagnostic(true);
    }, 1200);
  }

  function handleVersionPressOut() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  return (
    <Screen scroll>
      <Text style={[typography.title, { marginBottom: spacing.lg }]}>Ajustes</Text>

      <Card style={{ marginBottom: spacing.lg }}>
        <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>
          Nombre
        </Text>
        <Text style={[typography.subtitle, { marginBottom: spacing.md }]}>
          {user?.displayName ?? '—'}
        </Text>
        <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>
          Correo
        </Text>
        <Text style={typography.body}>{user?.email ?? '—'}</Text>
      </Card>

      <Card style={{ marginBottom: spacing.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, paddingRight: spacing.md }}>
            <Text style={typography.subtitle}>Recordatorios</Text>
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xs }]}>
              Notificaciones locales para hábitos con recordatorio activo
            </Text>
          </View>
          <Switch
            accessibilityLabel="Activar recordatorios"
            value={remindersEnabled}
            disabled={remindersLoading}
            onValueChange={(value) => void handleRemindersToggle(value)}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        {permissionDenied && remindersEnabled ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir ajustes del sistema para notificaciones"
            onPress={() => openNotificationSettings()}
            style={{ marginTop: spacing.md }}
          >
            <Text style={[typography.caption, { color: colors.primary }]}>
              Los permisos de notificación están desactivados. Toca aquí para abrirlos en Ajustes del
              sistema.
            </Text>
          </Pressable>
        ) : null}
      </Card>

      <Button
        title="Cerrar sesión"
        variant="secondary"
        loading={logoutLoading}
        disabled={logoutLoading}
        onPress={handleLogoutPress}
      />

      <Pressable
        accessibilityRole="text"
        accessibilityLabel={`Versión ${APP_VERSION}`}
        onPressIn={handleVersionPressIn}
        onPressOut={handleVersionPressOut}
        style={{ marginTop: spacing.xxl, alignItems: 'center' }}
      >
        <Text style={[typography.caption, { color: colors.textMuted }]}>Versión {APP_VERSION}</Text>
      </Pressable>

      {showDiagnostic ? (
        <Card style={{ marginTop: spacing.lg }}>
          <Text style={[typography.subtitle, { marginBottom: spacing.sm }]}>Diagnóstico de red</Text>
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
          <Button title="Probar conexión" loading={diagLoading} onPress={() => void handleTestConnection()} />
          {diagResult ? (
            <Text
              style={[
                typography.body,
                {
                  marginTop: spacing.md,
                  color: health?.status === 'ok' ? colors.success : colors.danger,
                },
              ]}
            >
              {diagResult}
            </Text>
          ) : null}
        </Card>
      ) : null}
    </Screen>
  );
}
