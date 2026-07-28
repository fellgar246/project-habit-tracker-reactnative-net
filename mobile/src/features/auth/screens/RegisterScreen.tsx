import { Text } from 'react-native';

import { Button, Screen } from '../../../components';
import { useAuth } from '../AuthContext';
import { useTheme } from '../../../theme';

export function RegisterScreen() {
  const { typography } = useTheme();
  const { setIsAuthenticated } = useAuth();

  return (
    <Screen>
      <Text style={typography.title}>Registrarse</Text>
      <Text style={[typography.body, { marginTop: 8, marginBottom: 24 }]}>
        Pantalla placeholder — la autenticación real llega en PLAN-04.
      </Text>
      <Button title="Crear cuenta (mock)" onPress={() => setIsAuthenticated(true)} />
    </Screen>
  );
}
