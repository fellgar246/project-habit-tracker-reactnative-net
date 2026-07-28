import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { isApiError } from '../../../api/errors';
import { Button, Input, Screen } from '../../../components';
import { AuthStackParamList } from '../../../navigation/types';
import { useTheme } from '../../../theme';
import { useAuth } from '../AuthContext';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type LoginNavigation = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export function LoginScreen() {
  const { typography, colors, spacing } = useTheme();
  const { login } = useAuth();
  const navigation = useNavigation<LoginNavigation>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const errors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      errors.email = 'El correo es obligatorio';
    } else if (!EMAIL_PATTERN.test(email.trim())) {
      errors.email = 'Ingresa un correo válido';
    }

    if (!password) {
      errors.password = 'La contraseña es obligatoria';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit() {
    setApiError(null);
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (error) {
      if (isApiError(error)) {
        if (error.status === 401) {
          setApiError('Correo o contraseña incorrectos');
        } else {
          setApiError(error.detail ?? error.title);
        }
      } else {
        setApiError('No se pudo iniciar sesión. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen scroll>
      <Text style={typography.title}>Iniciar sesión</Text>
      <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xl }]}>
        Accede a tu cuenta de HabitTracker
      </Text>

      <View style={{ gap: spacing.md, marginBottom: spacing.lg }}>
        <Input
          label="Correo"
          value={email}
          onChangeText={setEmail}
          error={fieldErrors.email}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
        />

        <View>
          <Input
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            error={fieldErrors.password}
            secureTextEntry={!showPassword}
            textContentType="password"
            autoComplete="password"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            onPress={() => setShowPassword((value) => !value)}
            style={{ position: 'absolute', right: spacing.md, top: 38 }}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color={colors.textMuted}
            />
          </Pressable>
        </View>
      </View>

      {apiError ? (
        <Text
          style={[
            typography.body,
            { color: colors.danger, marginBottom: spacing.md, textAlign: 'center' },
          ]}
        >
          {apiError}
        </Text>
      ) : null}

      <Button title="Entrar" loading={loading} disabled={loading} onPress={handleSubmit} />

      <Pressable
        accessibilityRole="link"
        onPress={() => navigation.navigate('Register')}
        style={{ marginTop: spacing.lg, alignItems: 'center' }}
      >
        <Text style={[typography.body, { color: colors.primary }]}>
          ¿No tienes cuenta? Regístrate
        </Text>
      </Pressable>
    </Screen>
  );
}
