import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { colors, theme } from '../styles/GlobalStyles';
import TmvLogo from '../assets/tmv_app_thumbnail.png';

// Componentes styled
const Container = styled(SafeAreaView)`
  flex: 1;
  background-color: ${colors.darkBackground};
`;

const Header = styled.View`
  background-color: rgba(25, 25, 25, 0.9);
  padding: ${theme.spacing.lg}px;
  border-bottom-width: 1px;
  border-bottom-color: ${colors.inputBorder};
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const HeaderLeft = styled.View`
  flex: 1;
  flex-direction: row;
  align-items: center;
  gap: ${theme.spacing.md}px;
`;

const HeaderLogo = styled.View`
  width: 40px;
  height: 40px;
  background-color: ${colors.primaryGold};
  border-radius: ${theme.borderRadius.sm}px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

const HeaderLogoImage = styled.Image`
  width: 100%;
  height: 100%;
  resize-mode: contain;
`;

const UserInfo = styled.View`
  flex: 1;
`;

const WelcomeText = styled.Text`
  color: ${colors.subtleGrey};
  font-size: ${theme.fontSize.sm}px;
  margin-bottom: 2px;
`;

const UserName = styled.Text`
  color: ${colors.lightText};
  font-size: ${theme.fontSize.lg}px;
  font-weight: ${theme.fontWeight.semibold};
`;

const UserRole = styled.Text`
  color: ${colors.primaryGold};
  font-size: ${theme.fontSize.sm}px;
  font-weight: ${theme.fontWeight.medium};
  margin-top: 2px;
`;

const LogoutButton = styled(TouchableOpacity)`
  padding: ${theme.spacing.sm}px;
`;

const Content = styled(ScrollView)`
  flex: 1;
  padding: ${theme.spacing.lg}px;
`;

const Section = styled.View`
  margin-bottom: ${theme.spacing.xl}px;
`;

const SectionTitle = styled.Text`
  color: ${colors.lightText};
  font-size: ${theme.fontSize.xl}px;
  font-weight: ${theme.fontWeight.bold};
  margin-bottom: ${theme.spacing.md}px;
`;

const Card = styled.View`
  background-color: rgba(25, 25, 25, 0.9);
  border-radius: ${theme.borderRadius.lg}px;
  padding: ${theme.spacing.lg}px;
  margin-bottom: ${theme.spacing.md}px;
  border: 1px solid ${colors.inputBorder};
  ${theme.shadows.md};
`;

const CardTitle = styled.Text`
  color: ${colors.primaryGold};
  font-size: ${theme.fontSize.md}px;
  font-weight: ${theme.fontWeight.semibold};
  margin-bottom: ${theme.spacing.sm}px;
`;

const CardDescription = styled.Text`
  color: ${colors.subtleGrey};
  font-size: ${theme.fontSize.sm}px;
  line-height: 20px;
`;

const QuickActions = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: ${theme.spacing.md}px;
`;

const ActionButtonContainer = styled(TouchableOpacity)<{ variant?: 'primary' | 'secondary' }>`
  flex: 1;
  min-width: 150px;
  border-radius: ${theme.borderRadius.md}px;
  ${theme.shadows.sm};
`;

const ActionButtonGradient = styled(LinearGradient)<{ variant?: 'primary' | 'secondary' }>`
  padding: ${theme.spacing.lg}px;
  border-radius: ${theme.borderRadius.md}px;
  align-items: center;
  gap: ${theme.spacing.sm}px;
  border: 1px solid ${props => props.variant === 'primary' ? colors.primaryGold : colors.inputBorder};
`;

const ActionButtonText = styled.Text<{ variant?: 'primary' | 'secondary' }>`
  color: ${props => props.variant === 'primary' ? colors.darkBackground : colors.lightText};
  font-size: ${theme.fontSize.sm}px;
  font-weight: ${theme.fontWeight.semibold};
  text-align: center;
`;

const StatusCard = styled.View`
  background-color: rgba(212, 175, 55, 0.1);
  border: 1px solid ${colors.primaryGold};
  border-radius: ${theme.borderRadius.md}px;
  padding: ${theme.spacing.md}px;
  flex-direction: row;
  align-items: center;
  gap: ${theme.spacing.sm}px;
`;

const StatusText = styled.Text`
  color: ${colors.primaryGold};
  font-size: ${theme.fontSize.sm}px;
  font-weight: ${theme.fontWeight.medium};
  flex: 1;
`;

const DashboardScreen: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const getRoleSpecificContent = () => {
    if (!user) return null;

    switch (user.roleName.toLowerCase()) {
      case 'admin':
        return (
          <Section>
            <SectionTitle>Panel de Administración</SectionTitle>
            <Card>
              <CardTitle>Gestión del Sistema</CardTitle>
              <CardDescription>
                Administra usuarios, loterías, y configuración del sistema.
              </CardDescription>
            </Card>
            <QuickActions>
              <ActionButtonContainer variant="primary">
                <ActionButtonGradient
                  variant="primary"
                  colors={[colors.primaryGold, colors.primaryRed]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  locations={[0.4, 1]}
                >
                  <Ionicons name="people" size={24} color={colors.darkBackground} />
                  <ActionButtonText variant="primary">Gestionar Usuarios</ActionButtonText>
                </ActionButtonGradient>
              </ActionButtonContainer>
              <ActionButtonContainer variant="secondary">
                <ActionButtonGradient
                  variant="secondary"
                  colors={[colors.inputBackground, colors.inputBackground]}
                >
                  <Ionicons name="settings" size={24} color={colors.lightText} />
                  <ActionButtonText variant="secondary">Configuración</ActionButtonText>
                </ActionButtonGradient>
              </ActionButtonContainer>
            </QuickActions>
          </Section>
        );
      
      case 'listero':
        return (
          <Section>
            <SectionTitle>Panel de Listero</SectionTitle>
            <Card>
              <CardTitle>Gestión de Apuestas</CardTitle>
              <CardDescription>
                Registra y valida apuestas de tus jugadores.
              </CardDescription>
            </Card>
            <QuickActions>
              <ActionButtonContainer variant="primary">
                <ActionButtonGradient
                  variant="primary"
                  colors={[colors.primaryGold, colors.primaryRed]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  locations={[0.4, 1]}
                >
                  <Ionicons name="add-circle" size={24} color={colors.darkBackground} />
                  <ActionButtonText variant="primary">Registrar Apuesta</ActionButtonText>
                </ActionButtonGradient>
              </ActionButtonContainer>
              <ActionButtonContainer variant="secondary">
                <ActionButtonGradient
                  variant="secondary"
                  colors={[colors.inputBackground, colors.inputBackground]}
                >
                  <Ionicons name="checkmark-circle" size={24} color={colors.lightText} />
                  <ActionButtonText variant="secondary">Validar Apuestas</ActionButtonText>
                </ActionButtonGradient>
              </ActionButtonContainer>
            </QuickActions>
          </Section>
        );
      
      case 'jugador':
        return (
          <Section>
            <SectionTitle>Panel de Jugador</SectionTitle>
            <Card>
              <CardTitle>Mis Apuestas</CardTitle>
              <CardDescription>
                Revisa el historial y estado de tus apuestas.
              </CardDescription>
            </Card>
            <QuickActions>
              <ActionButtonContainer variant="primary">
                <ActionButtonGradient
                  variant="primary"
                  colors={[colors.primaryGold, colors.primaryRed]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  locations={[0.4, 1]}
                >
                  <Ionicons name="game-controller" size={24} color={colors.darkBackground} />
                  <ActionButtonText variant="primary">Nueva Apuesta</ActionButtonText>
                </ActionButtonGradient>
              </ActionButtonContainer>
              <ActionButtonContainer variant="secondary">
                <ActionButtonGradient
                  variant="secondary"
                  colors={[colors.inputBackground, colors.inputBackground]}
                >
                  <Ionicons name="time" size={24} color={colors.lightText} />
                  <ActionButtonText variant="secondary">Historial</ActionButtonText>
                </ActionButtonGradient>
              </ActionButtonContainer>
            </QuickActions>
          </Section>
        );
      
      default:
        return (
          <Section>
            <SectionTitle>Panel General</SectionTitle>
            <Card>
              <CardTitle>Bienvenido</CardTitle>
              <CardDescription>
                Accede a las funciones disponibles según tu rol.
              </CardDescription>
            </Card>
          </Section>
        );
    }
  };

  return (
    <Container>
      <Header>
        <HeaderLeft>
          <HeaderLogo>
            <HeaderLogoImage source={TmvLogo} />
          </HeaderLogo>
          <UserInfo>
            <WelcomeText>Bienvenido</WelcomeText>
            <UserName>{user?.firstName || 'Usuario'}</UserName>
            <UserRole>{user?.roleName || 'Usuario'}</UserRole>
          </UserInfo>
        </HeaderLeft>
        <LogoutButton onPress={handleLogout} activeOpacity={0.7}>
          <Ionicons name="log-out" size={24} color={colors.subtleGrey} />
        </LogoutButton>
      </Header>

      <Content>
        <Section>
          <StatusCard>
            <Ionicons name="information-circle" size={20} color={colors.primaryGold} />
            <StatusText>
              Aplicación móvil TMV - Versión de desarrollo
            </StatusText>
          </StatusCard>
        </Section>

        {getRoleSpecificContent()}

        <Section>
          <SectionTitle>Información del Sistema</SectionTitle>
          <Card>
            <CardTitle>Estado de Conexión</CardTitle>
            <CardDescription>
              {user?.id === 'mock-user-id' 
                ? 'Modo offline - Usando datos de demostración'
                : 'Conectado al servidor'
              }
            </CardDescription>
          </Card>
          
          <Card>
            <CardTitle>Lotería por Defecto</CardTitle>
            <CardDescription>
              {user?.defaultLotteryName || 'No configurada'}
            </CardDescription>
          </Card>
        </Section>
      </Content>
    </Container>
  );
};

export default DashboardScreen;
