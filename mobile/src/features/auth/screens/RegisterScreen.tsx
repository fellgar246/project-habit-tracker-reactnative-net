import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { isApiError } from '../../../api/errors';
import { Button, Input, Screen } from '../../../components';
import { useToast } from '../../../components/Toast';
import { getUserFriendlyError } from '../../../utils/errors';
import { AuthStackParamList } from '../../../navigation/types';
import { useTheme } from '../../../theme';
import { useAuth } from '../AuthContext';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type RegisterNavigation = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

type FieldErrors = {
  displayName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

export function RegisterScreen() {
  const { typography, colors, spacing } = useTheme();
  const { register } = useAuth();
  const toast = useToast();
  const navigation = useNavigation<RegisterNavigation>();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const errors: FieldErrors = {};
    const trimmedName = displayName.trim();

    if (trimmedName.length < 2 || trimmedName.length > 50) {
      errors.displayName = 'El nombre debe tener entre 2 y 50 caracteres';
    }

    if (!email.trim()) {
      errors.email = 'El correo es obligatorio';
    } else if (!EMAIL_PATTERN.test(email.trim())) {
      errors.email = 'Ingresa un correo válido';
    }

    if (password.length < 8) {
      errors.password = 'La contraseña debe tener al menos 8 caracteres';
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden';
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
      await register(email.trim(), password, displayName.trim());
    } catch (error) {
      if (isApiError(error)) {
        if (error.status === 409) {
          setApiError('Ese correo ya está registrado');
        } else {
          toast.show(getUserFriendlyError(error, 'No se pudo crear la cuenta'));
        }
      } else {
        toast.show('No se pudo crear la cuenta. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen scroll>
      <Text style={typography.title}>Registrarse</Text>
      <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xl }]}>
        Crea tu cuenta para empezar a registrar hábitos
      </Text>

      <View style={{ gap: spacing.md, marginBottom: spacing.lg }}>
        <Input
          label="Nombre"
          value={displayName}
          onChangeText={setDisplayName}
          error={fieldErrors.displayName}
          autoCapitalize="words"
          textContentType="name"
          autoComplete="name"
        />

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
            textContentType="newPassword"
            autoComplete="new-password"
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

        <Input
          label="Confirmar contraseña"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          error={fieldErrors.confirmPassword}
          secureTextEntry={!showPassword}
          textContentType="newPassword"
          autoComplete="new-password"
        />
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

      <Button title="Crear cuenta" loading={loading} disabled={loading} onPress={handleSubmit} />

      <Pressable
        accessibilityRole="link"
        onPress={() => navigation.navigate('Login')}
        style={{ marginTop: spacing.lg, alignItems: 'center' }}
      >
        <Text style={[typography.body, { color: colors.primary }]}>
          ¿Ya tienes cuenta? Inicia sesión
        </Text>
      </Pressable>
    </Screen>
  );
}
