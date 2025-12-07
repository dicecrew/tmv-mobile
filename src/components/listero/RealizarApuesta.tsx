import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Combobox, { ComboboxOption } from '../common/Combobox';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../styles/GlobalStyles';
import Card from '../common/Card';
import Toast from 'react-native-toast-message';
import { bookieService } from '../../api/services';
import { useAuth } from '../../contexts/AuthContext';
import RegistrarApuesta from '../jugador/RegistrarApuesta';

interface Player {
  id: string;
  firstName: string;
  lastName?: string;
  nickName?: string | null;
  phoneNumber: string;
  roleName: string;
  defaultLotteryId?: string | null;
  defaultLotteryName?: string | null;
}

interface Lottery {
  id: string;
  name: string;
}

interface Throw {
  id: string;
  name: string;
  endTime: string;
  startTime: string;
}

interface PlayType {
  id: string;
  name: string;
  code: string;
}

const formatAmount = (amount: number): string => {
  if (amount === null || amount === undefined) return '0';
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount));
  if (isNaN(num)) return '0';
  return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const RealizarApuesta: React.FC = () => {
  const { user } = useAuth();
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoadingBookie, setIsLoadingBookie] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [bookieId, setBookieId] = useState<string | null>(null);
  const [showPlayerBetForm, setShowPlayerBetForm] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Cargar bookie del usuario
  const loadUserBookie = async () => {
    if (!user?.id) return;

    setIsLoadingBookie(true);
    try {
      const response = await bookieService.getBookieByUserId(user.id);
      const bookie = response?.data || response;
      setBookieId(bookie?.id || null);
    } catch (error) {
      console.error('Error loading bookie:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo cargar información del bookie',
        position: 'top',
        topOffset: 60,
      });
    } finally {
      setIsLoadingBookie(false);
    }
  };

  // Cargar jugadores del bookie
  const loadBookieUsers = async () => {
    if (!bookieId) return;

    setIsLoadingUsers(true);
    try {
      const response = await bookieService.getBookieUsers(bookieId);
      
      let usersArray: any[] = [];
      if (response && Array.isArray(response)) {
        usersArray = response;
      } else if (response?.data && Array.isArray(response.data)) {
        usersArray = response.data;
      } else if (response?.data && typeof response.data === 'object') {
        usersArray = Object.values(response.data);
      }
      
      setPlayers(usersArray);
    } catch (error) {
      console.error('Error loading users:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudieron cargar los jugadores',
        position: 'top',
        topOffset: 60,
      });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadUserBookie();
  }, [user?.id]);

  useEffect(() => {
    if (bookieId) {
      loadBookieUsers();
    }
  }, [bookieId]);

  // Actualizar hora cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const selectedPlayerData = useMemo(() => {
    return players.find((p) => p.id === selectedPlayer);
  }, [players, selectedPlayer]);

  const currentTimeFormatted = currentTime.toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  // Convertir players a opciones del combobox
  const playerOptions: ComboboxOption[] = players.map(player => ({
    id: player.id,
    label: `${player.firstName} ${player.lastName || ''} (${player.phoneNumber})`,
    value: player.id,
  }));

  if (showPlayerBetForm && selectedPlayerData) {
    return (
      <PlayerBetForm
        player={selectedPlayerData}
        bookieId={bookieId}
        onBack={() => {
          setShowPlayerBetForm(false);
          setSelectedPlayer('');
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Card title="Seleccionar Jugador para Registrar Apuesta" icon="play-outline" style={styles.card}>
        {/* Hora actual */}
        <View style={styles.timeDisplay}>
          <Text style={styles.timeText}>⏰ Hora actual: {currentTimeFormatted}</Text>
        </View>

        {/* Selección de jugador */}
        <Text style={styles.sectionTitle}>Paso 1: Seleccionar Jugador</Text>

        <View style={styles.formGroup}>
          <Combobox
            options={playerOptions}
            selectedValue={selectedPlayer}
            onValueChange={setSelectedPlayer}
            placeholder="-- Seleccione un jugador --"
            loading={isLoadingBookie || isLoadingUsers}
            loadingText={isLoadingBookie ? "Cargando información del bookie..." : "Cargando jugadores..."}
            emptyText="No hay jugadores registrados"
            enabled={!isLoadingBookie && !isLoadingUsers}
            label="Lista de mis jugadores registrados"
            icon="people-outline"
          />
        </View>

        {/* Información del jugador seleccionado */}
        {selectedPlayerData && (
          <View style={styles.playerInfoBox}>
            <Ionicons name="person-circle-outline" size={24} color={colors.primaryGold} />
            <View style={styles.playerInfoText}>
              <Text
                style={[
                  styles.playerInfoName,
                  selectedPlayerData.roleName === 'Bookie' && styles.playerNameDanger,
                ]}
              >
                Jugador seleccionado: {selectedPlayerData.firstName} {selectedPlayerData.lastName || ''}
              </Text>
              <Text style={styles.playerInfoDetail}>Teléfono: {selectedPlayerData.phoneNumber}</Text>
            </View>
          </View>
        )}

        {/* Botón para continuar */}
        {selectedPlayer && (
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => setShowPlayerBetForm(true)}
          >
            <LinearGradient
              colors={['#22c55e', '#16a34a']}
              style={styles.continueButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="play-outline" size={24} color="white" />
              <Text style={styles.continueButtonText}>Continuar al Registro de Apuestas</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Mensaje de advertencia */}
        <View style={styles.warningBox}>
          <Ionicons name="warning-outline" size={20} color="white" />
          <Text style={styles.warningText}>
            Recuerda que eres responsable de todas las jugadas registradas a nombre de tus jugadores.
          </Text>
        </View>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    flex: 1,
  },
  timeDisplay: {
    alignItems: 'center',
    backgroundColor: `${colors.primaryGold}1A`,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: `${colors.primaryGold}33`,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  timeText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.primaryGold,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primaryGold,
    marginBottom: spacing.md,
  },
  formGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.lightText,
    marginBottom: spacing.sm,
  },
  playerInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: `${colors.primaryGold}1A`,
    borderWidth: 2,
    borderColor: `${colors.primaryGold}33`,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  playerInfoText: {
    flex: 1,
  },
  playerInfoName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primaryGold,
  },
  playerNameDanger: {
    color: colors.primaryRed,
  },
  playerInfoDetail: {
    fontSize: fontSize.sm,
    color: colors.subtleGrey,
    marginTop: spacing.xs,
  },
  continueButton: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  continueButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  continueButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: 'white',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: `${colors.primaryRed}20`,
    borderWidth: 2,
    borderColor: colors.primaryRed,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  warningText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: 'white',
    fontWeight: fontWeight.semibold,
  },
  // Vista de formulario de apuestas
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: `${colors.primaryGold}20`,
    borderWidth: 2,
    borderColor: colors.primaryGold,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  playerDetails: {
    flex: 1,
  },
  playerName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primaryGold,
  },
  playerPhone: {
    fontSize: fontSize.sm,
    color: colors.subtleGrey,
    marginTop: spacing.xs,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryRed,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: 'white',
  },
  betFormPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.inputBorder,
    padding: spacing.xl,
  },
  placeholderTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.lightText,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  placeholderText: {
    fontSize: fontSize.md,
    color: colors.subtleGrey,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  placeholderSubtext: {
    fontSize: fontSize.sm,
    color: colors.primaryGold,
    textAlign: 'center',
  },
});

export default RealizarApuesta;

interface PlayerBetFormProps {
  player: Player;
  bookieId: string | null;
  onBack: () => void;
}

const PlayerBetForm: React.FC<PlayerBetFormProps> = ({ player, onBack, bookieId }) => {
  useEffect(() => {
    if (!bookieId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se encontró información del bookie. Regresa e inténtalo nuevamente.',
        position: 'top',
        topOffset: 60,
      });
      onBack();
    }
  }, [bookieId, onBack]);

  const formatAmount = (amount: number): string => {
    if (amount === null || amount === undefined) return '0';
    const num = typeof amount === 'number' ? amount : parseFloat(String(amount));
    if (isNaN(num)) return '0';
    return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  const playerBar = (
    <View style={formStyles.playerBar}>
      <View style={formStyles.playerChip}>
        <Ionicons name="person-outline" size={16} color={colors.primaryGold} />
        <Text style={formStyles.playerChipText} numberOfLines={1} ellipsizeMode="tail">
          {player.firstName} {player.lastName || ''}
        </Text>
      </View>
      <TouchableOpacity style={formStyles.backButton} onPress={onBack}>
        <Ionicons name="arrow-back" size={16} color="white" />
        <Text style={formStyles.backButtonText}>Volver</Text>
      </TouchableOpacity>
    </View>
  );

  const handleSendBet = async (betData: {
    throwId: string;
    date: string;
    betPlays: any[];
    userId?: string;
  }) => {
    if (!bookieId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se encontró el bookie asociado. Regresa e inténtalo de nuevo.',
        position: 'top',
        topOffset: 60,
      });
      return;
    }

    const betDataWithUserId = {
      ...betData,
      userId: player.id,
    };

    await bookieService.createBetPlay(betDataWithUserId);
  };

    const playerFullName = `${player.firstName} ${player.lastName || ''}`.trim();

  const confirmMessage = (
    totalAmount: number,
    finalPlays: any[],
    lotteryName: string,
    throwName: string
  ) => {
    return `¿Registrar apuesta para ${playerFullName} por $${formatAmount(totalAmount)}?\n\n` +
        `${finalPlays.length} jugada${finalPlays.length !== 1 ? 's' : ''}\n` +
      `Lotería: ${lotteryName}\n` +
      `Tirada: ${throwName}`;
  };

  const successText = (totalAmount: number, finalPlays: any[]) => {
    return `$${formatAmount(totalAmount)} - ${playerFullName}`;
  };

  return (
    <RegistrarApuesta
      playerBar={playerBar}
      onSendBet={handleSendBet}
      customUserId={player.id}
      successTitle="¡APUESTA REGISTRADA!"
      successText={successText}
      confirmTitle="🎯 Confirmar Apuesta"
      confirmMessage={confirmMessage}
    />
  );
};

const formStyles = StyleSheet.create({
  playerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    marginHorizontal: spacing.sm,
    paddingHorizontal: spacing.sm,
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  playerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  playerChipText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.lightText,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryRed,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: 'white',
  },
});
