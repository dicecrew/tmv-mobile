import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { colors, theme, commonStyles } from '../styles/GlobalStyles';
import TmvLogo from '../assets/tmv_app_thumbnail.png';

// Componentes styled
const Container = styled(SafeAreaView)`
  flex: 1;
  background-color: ${colors.darkBackground};
  padding: ${theme.spacing.lg}px;
`;

const ScrollContainer = styled(ScrollView)`
  flex: 1;
`;

const Content = styled(KeyboardAvoidingView)`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

const LoginCard = styled.View`
  background-color: rgba(25, 25, 25, 0.9);
  border-radius: ${theme.borderRadius.xl}px;
  padding: ${theme.spacing.xxl}px;
  width: 100%;
  max-width: 400px;
  border: 1px solid ${colors.inputBorder};
  ${theme.shadows.lg};
`;

const Header = styled.View`
  align-items: center;
  margin-bottom: ${theme.spacing.xl}px;
`;

const LogoContainer = styled.View`
  width: 80px;
  height: 80px;
  background-color: ${colors.primaryGold};
  border-radius: ${theme.borderRadius.lg}px;
  align-items: center;
  justify-content: center;
  margin-bottom: ${theme.spacing.lg}px;
  ${theme.shadows.gold};
  overflow: hidden;
`;

const LogoImage = styled.Image`
  width: 100%;
  height: 100%;
  resize-mode: contain;
`;

const Title = styled.Text`
  font-size: ${theme.fontSize.xxxl}px;
  font-weight: ${theme.fontWeight.bold};
  color: ${colors.primaryGold};
  margin-bottom: ${theme.spacing.sm}px;
  text-align: center;
`;

const Subtitle = styled.Text`
  font-size: ${theme.fontSize.md}px;
  color: ${colors.subtleGrey};
  text-align: center;
  line-height: 22px;
`;

const Form = styled.View`
  gap: ${theme.spacing.lg}px;
`;

const InputGroup = styled.View`
  gap: ${theme.spacing.sm}px;
`;

const InputLabel = styled.Text`
  font-size: ${theme.fontSize.sm}px;
  font-weight: ${theme.fontWeight.semibold};
  color: ${colors.lightText};
  flex-direction: row;
  align-items: center;
`;

const InputContainer = styled.View`
  position: relative;
  flex-direction: row;
  align-items: center;
`;

const StyledInput = styled(TextInput)`
  flex: 1;
  background-color: ${colors.inputBackground};
  border: 2px solid ${colors.inputBorder};
  border-radius: ${theme.borderRadius.md}px;
  padding: ${theme.spacing.md}px ${theme.spacing.lg}px ${theme.spacing.md}px 52px;
  color: ${colors.lightText};
  font-size: ${theme.fontSize.md}px;
`;

const InputIcon = styled.View`
  position: absolute;
  left: ${theme.spacing.md}px;
  z-index: 2;
`;

const ToggleButton = styled(TouchableOpacity)`
  position: absolute;
  right: ${theme.spacing.md}px;
  padding: ${theme.spacing.sm}px;
  z-index: 2;
`;

const LoginButtonContainer = styled(TouchableOpacity)<{ disabled?: boolean }>`
  border-radius: ${theme.borderRadius.md}px;
  margin-top: ${theme.spacing.sm}px;
  opacity: ${props => props.disabled ? 0.6 : 1};
  ${theme.shadows.md};
`;

const LoginButtonGradient = styled(LinearGradient)`
  padding: ${theme.spacing.md}px ${theme.spacing.lg}px;
  border-radius: ${theme.borderRadius.md}px;
  align-items: center;
  justify-content: center;
  flex-direction: row;
  gap: ${theme.spacing.sm}px;
`;

const LoginButtonText = styled.Text`
  color: ${colors.darkBackground};
  font-size: ${theme.fontSize.md}px;
  font-weight: ${theme.fontWeight.semibold};
`;

const ErrorMessage = styled.View`
  background-color: ${colors.errorBackground};
  border: 1px solid ${colors.errorBorder};
  border-radius: ${theme.borderRadius.sm}px;
  padding: ${theme.spacing.md}px;
  flex-direction: row;
  align-items: center;
  gap: ${theme.spacing.sm}px;
`;

const ErrorText = styled.Text`
  color: ${colors.errorText};
  font-size: ${theme.fontSize.sm}px;
  font-weight: ${theme.fontWeight.medium};
  flex: 1;
`;

const DemoSection = styled.View`
  margin-top: ${theme.spacing.xl}px;
  padding: ${theme.spacing.lg}px;
  background-color: ${colors.inputBackground};
  border-radius: ${theme.borderRadius.lg}px;
  border: 1px solid ${colors.inputBorder};
`;

const DemoTitle = styled.Text`
  font-size: ${theme.fontSize.md}px;
  font-weight: ${theme.fontWeight.semibold};
  color: ${colors.primaryGold};
  margin-bottom: ${theme.spacing.md}px;
  flex-direction: row;
  align-items: center;
`;

const DemoGrid = styled.View`
  gap: ${theme.spacing.md}px;
`;

const DemoItem = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: ${theme.spacing.md}px ${theme.spacing.lg}px;
  background-color: ${colors.inputBorder};
  border-radius: ${theme.borderRadius.md}px;
  border: 1px solid ${colors.inputBorder};
`;

const DemoInfo = styled.View`
  flex: 1;
`;

const DemoRole = styled.Text`
  font-weight: ${theme.fontWeight.semibold};
  color: ${colors.lightText};
  font-size: ${theme.fontSize.sm}px;
  margin-bottom: 2px;
`;

const DemoCredentials = styled.Text`
  color: ${colors.subtleGrey};
  font-size: ${theme.fontSize.xs}px;
  font-family: monospace;
`;

const DemoButtonContainer = styled(TouchableOpacity)`
  border-radius: ${theme.borderRadius.sm}px;
  min-width: 50px;
`;

const DemoButtonGradient = styled(LinearGradient)`
  padding: ${theme.spacing.sm}px ${theme.spacing.md}px;
  border-radius: ${theme.borderRadius.sm}px;
  border: 1px solid ${colors.primaryGold};
`;

const DemoButtonText = styled.Text`
  color: ${colors.primaryGold};
  font-size: ${theme.fontSize.xs}px;
  font-weight: ${theme.fontWeight.medium};
  text-align: center;
`;

const LoginScreen: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading, error, user } = useAuth();

  // Redirigir automáticamente si ya está autenticado
  useEffect(() => {
    if (user) {
      // En React Native, la navegación se manejará desde el componente padre
      console.log('Usuario autenticado, redirigiendo...');
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!phone.trim() || !password.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    try {
      const result = await login(phone, password);
      if (result.success) {
        console.log('Login exitoso');
      }
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  const fillCredentials = (demoPhone: string, demoPassword: string) => {
    setPhone(demoPhone);
    setPassword(demoPassword);
  };

  return (
    <Container>
      <ScrollContainer
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <Content behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <LoginCard>
            <Header>
              <LogoContainer>
                <LogoImage source={TmvLogo} />
              </LogoContainer>
              <Title>Iniciar Sesión</Title>
              <Subtitle>Accede a tu cuenta empresarial</Subtitle>
            </Header>

            <Form>
              <InputGroup>
                <InputLabel>Teléfono</InputLabel>
                <InputContainer>
                  <InputIcon>
                    <Ionicons name="call" size={20} color={colors.subtleGrey} />
                  </InputIcon>
                  <StyledInput
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="+1 (555) 123-4567"
                    placeholderTextColor={colors.subtleGrey}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </InputContainer>
              </InputGroup>

              <InputGroup>
                <InputLabel>Contraseña</InputLabel>
                <InputContainer>
                  <InputIcon>
                    <Ionicons name="lock-closed" size={20} color={colors.subtleGrey} />
                  </InputIcon>
                  <StyledInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Ingresa tu contraseña"
                    placeholderTextColor={colors.subtleGrey}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <ToggleButton
                    onPress={() => setShowPassword(!showPassword)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color={colors.subtleGrey}
                    />
                  </ToggleButton>
                </InputContainer>
              </InputGroup>

              {error && (
                <ErrorMessage>
                  <Ionicons name="shield" size={18} color={colors.errorText} />
                  <ErrorText>{error}</ErrorText>
                </ErrorMessage>
              )}

              <LoginButtonContainer
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LoginButtonGradient
                  colors={[colors.primaryGold, colors.primaryRed]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  locations={[0.4, 1]}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.darkBackground} size="small" />
                  ) : (
                    <>
                      <Ionicons name="log-in" size={20} color={colors.darkBackground} />
                      <LoginButtonText>Iniciar Sesión</LoginButtonText>
                    </>
                  )}
                </LoginButtonGradient>
              </LoginButtonContainer>
            </Form>

            <DemoSection>
              <DemoTitle>
                <Ionicons name="information-circle" size={18} color={colors.primaryGold} />
                {' '}Credenciales de Prueba
              </DemoTitle>
              <DemoGrid>
                <DemoItem>
                  <DemoInfo>
                    <DemoRole>Listero</DemoRole>
                    <DemoCredentials>+56984593684 / 871131</DemoCredentials>
                  </DemoInfo>
                  <DemoButtonContainer
                    onPress={() => fillCredentials('+56984593684', '871131')}
                    activeOpacity={0.7}
                  >
                    <DemoButtonGradient
                      colors={[colors.inputBackground, colors.inputBackground]}
                    >
                      <DemoButtonText>Usar</DemoButtonText>
                    </DemoButtonGradient>
                  </DemoButtonContainer>
                </DemoItem>
                
                <DemoItem>
                  <DemoInfo>
                    <DemoRole>Admin</DemoRole>
                    <DemoCredentials>admin / Admin123!</DemoCredentials>
                  </DemoInfo>
                  <DemoButtonContainer
                    onPress={() => fillCredentials('admin', 'Admin123!')}
                    activeOpacity={0.7}
                  >
                    <DemoButtonGradient
                      colors={[colors.inputBackground, colors.inputBackground]}
                    >
                      <DemoButtonText>Usar</DemoButtonText>
                    </DemoButtonGradient>
                  </DemoButtonContainer>
                </DemoItem>
                
                <DemoItem>
                  <DemoInfo>
                    <DemoRole>Usuario</DemoRole>
                    <DemoCredentials>+56968571473 / 871131</DemoCredentials>
                  </DemoInfo>
                  <DemoButtonContainer
                    onPress={() => fillCredentials('+56968571473', '871131')}
                    activeOpacity={0.7}
                  >
                    <DemoButtonGradient
                      colors={[colors.inputBackground, colors.inputBackground]}
                    >
                      <DemoButtonText>Usar</DemoButtonText>
                    </DemoButtonGradient>
                  </DemoButtonContainer>
                </DemoItem>
              </DemoGrid>
            </DemoSection>
          </LoginCard>
        </Content>
      </ScrollContainer>
    </Container>
  );
};

export default LoginScreen;
