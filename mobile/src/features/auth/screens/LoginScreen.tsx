import { Text } from 'react-native';

import { Button, Screen } from '../../../components';
import { useAuth } from '../AuthContext';
import { useTheme } from '../../../theme';

export function LoginScreen() {
  const { typography } = useTheme();
  const { setIsAuthenticated } = useAuth();

  return (
    <Screen>
      <Text style={typography.title}>Iniciar sesión</Text>
      <Text style={[typography.body, { marginTop: 8, marginBottom: 24 }]}>
        Pantalla placeholder — la autenticación real llega en PLAN-04.
      </Text>
      <Button title="Entrar (mock)" onPress={() => setIsAuthenticated(true)} />
    </Screen>
  );
}
