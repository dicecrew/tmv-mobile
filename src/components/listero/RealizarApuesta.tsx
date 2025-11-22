import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Combobox, { ComboboxOption } from '../common/Combobox';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../styles/GlobalStyles';
import Card from '../common/Card';
import Toast from 'react-native-toast-message';
import { bookieService, lotteryService, throwService, playTypeService } from '../../api/services';
import { useAuth } from '../../contexts/AuthContext';
import FloatingKeyboardModal from '../jugador/FloatingKeyboardModal';

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

interface ValidPlay {
  type: string;
  combinations: string[];
  amount: number;
  totalCost: number;
  details: string;
}

interface Play {
  id: string;
  numbers: string;
  validPlays: ValidPlay[];
  amount: number;
  timestamp: string;
  typeAmountInputs: { [key: string]: string };
}

const PLAY_TYPE_COLORS: { [key: string]: string } = {
  FIJO: '#2563eb',
  CORRIDO: '#16a34a',
  PARLET: '#dc2626',
  CENTENA: '#7c3aed',
};

const formatAmount = (amount: number): string => {
  if (amount === null || amount === undefined) return '0';
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount));
  if (isNaN(num)) return '0';
  return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const formatNumberDisplay = (number: string): string => {
  if (!number) return '';
  const cleanNumber = number.trim();
  return cleanNumber.length === 1 ? `0${cleanNumber}` : cleanNumber;
};

const getPlayTypeId = (typeName: string): string => {
  const normalizedTypeName = typeName.toLowerCase().trim();
  switch (normalizedTypeName) {
    case 'fijo':
      return 'fdea9747-7648-4f62-9693-fa2c21fafe08';
    case 'corrido':
      return '98d020d7-0435-4b31-86c4-fcb72cb3aeb8';
    case 'parlet':
      return 'e885329c-1f42-45d4-8927-50f07d53a0fa';
    case 'centena':
      return 'c6914e4e-86a4-44b4-8278-62164593528f';
    default:
      return 'fdea9747-7648-4f62-9693-fa2c21fafe08';
  }
};

const convertUtcTimeToLocal = (utcTimeString: string): string => {
  if (!utcTimeString) return '';

  try {
    let utcDateTime: Date;

    if (typeof utcTimeString === 'string') {
      if (utcTimeString.includes('T') && utcTimeString.includes('Z')) {
        utcDateTime = new Date(utcTimeString);
      } else if (utcTimeString.includes(':') && !utcTimeString.includes('T')) {
        const today = new Date().toISOString().split('T')[0];
        utcDateTime = new Date(`${today}T${utcTimeString}Z`);
      } else {
        utcDateTime = new Date(utcTimeString);
      }
    } else {
      utcDateTime = new Date(utcTimeString);
    }

    if (isNaN(utcDateTime.getTime())) {
      console.error('❌ Fecha inválida en convertUtcTimeToLocal:', {
        utcTimeString,
        utcDateTime,
      });
      return utcTimeString;
    }

    const localTime = utcDateTime.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    return localTime;
  } catch (error) {
    console.error('Error converting UTC time to local:', error);
    return utcTimeString;
  }
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
  const numbersInputRef = useRef<TextInput>(null);

  const [lotteries, setLotteries] = useState<Lottery[]>([]);
  const [throws, setThrows] = useState<Throw[]>([]);
  const [playTypes, setPlayTypes] = useState<PlayType[]>([]);

  const [selectedLotteryId, setSelectedLotteryId] = useState('');
  const [selectedThrowId, setSelectedThrowId] = useState('');
  const [currentNumbers, setCurrentNumbers] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [typeAmountInputs, setTypeAmountInputs] = useState<{ [key: string]: string }>({});
  const [allPlays, setAllPlays] = useState<Play[]>([]);
  const [activeGameTab, setActiveGameTab] = useState('numeros');
  const [isEditingSeparatedPlay, setIsEditingSeparatedPlay] = useState(false);
  const [currentPlayId, setCurrentPlayId] = useState<string | null>(null);
  const [isAlMode, setIsAlMode] = useState(false);
  const [alFirstNumber, setAlFirstNumber] = useState('');

  const [isLoadingLotteries, setIsLoadingLotteries] = useState(false);
  const [isLoadingThrows, setIsLoadingThrows] = useState(false);
  const [isLoadingPlayTypes, setIsLoadingPlayTypes] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isFloatingModalVisible, setIsFloatingModalVisible] = useState(false);

  const [currentTime, setCurrentTime] = useState(new Date());

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

  const getIndividualNumbers = (): string[] => {
    if (!currentNumbers) return [];
    return currentNumbers.split(/[,\n]/).filter(num => num.trim() !== '');
  };

  const validateNumberForType = (number: string, typeId: string): boolean => {
    const cleanNumber = number.replace(/\./g, '');

    switch (typeId) {
      case 'FIJO':
        return (cleanNumber.length === 1 || cleanNumber.length === 2) && !isNaN(parseInt(cleanNumber));
      case 'CORRIDO':
        return (cleanNumber.length === 1 || cleanNumber.length === 2) && !isNaN(parseInt(cleanNumber));
      case 'CENTENA':
        return cleanNumber.length === 3 && !isNaN(parseInt(cleanNumber));
      case 'PARLET':
        return (cleanNumber.length === 1 || cleanNumber.length === 2) && !isNaN(parseInt(cleanNumber));
      default:
        return false;
    }
  };

  const getAvailableTypes = (): string[] => {
    const numbers = getIndividualNumbers();
    if (numbers.length === 0) return [];

    const availableTypes: string[] = [];
    const availableTypeNames = playTypes.map(type => type.name.toLowerCase().trim());

    const validFijoCorridoNumbers = numbers.filter(num => validateNumberForType(num, 'FIJO'));

    if (validFijoCorridoNumbers.length > 0) {
      if (availableTypeNames.includes('fijo')) availableTypes.push('Fijo');
      if (availableTypeNames.includes('corrido')) availableTypes.push('Corrido');
    }

    const threeDigitNumbers = numbers.filter(num => validateNumberForType(num, 'CENTENA'));
    if (threeDigitNumbers.length > 0) {
      if (availableTypeNames.includes('centena')) availableTypes.push('Centena');
    }

    if (validFijoCorridoNumbers.length >= 2) {
      if (availableTypeNames.includes('parlet')) availableTypes.push('Parlet');
    }

    return availableTypes;
  };

  const getValidPlays = (): ValidPlay[] => {
    const numbers = getIndividualNumbers();
    const validPlays: ValidPlay[] = [];

    selectedTypes.forEach(typeName => {
      const amountInputs = typeAmountInputs[typeName] || '';
      const amountLines = amountInputs.split('\n').filter(line => line.trim() !== '');

      if (typeName === 'Parlet') {
        const validNumbers = numbers.filter(num => validateNumberForType(num, 'PARLET'));
        if (validNumbers.length >= 2) {
          const combinations: string[] = [];
          for (let i = 0; i < validNumbers.length; i++) {
            for (let j = i + 1; j < validNumbers.length; j++) {
              const firstNum = formatNumberDisplay(validNumbers[i]);
              const secondNum = formatNumberDisplay(validNumbers[j]);
              combinations.push(`${firstNum}X${secondNum}`);
            }
          }
          if (combinations.length > 0) {
            const expectedCombinations = (validNumbers.length * (validNumbers.length - 1)) / 2;
            const baseAmount = amountLines.length > 0 ? parseFloat(amountLines[0]) || 0 : 0;

            if (baseAmount > 0) {
              const totalAmount = baseAmount * expectedCombinations;

              validPlays.push({
                type: typeName,
                combinations,
                amount: totalAmount,
                totalCost: totalAmount,
                details: `${expectedCombinations} combinaciones × $${baseAmount} = $${formatAmount(totalAmount)}`,
              });
            }
          }
        }
      } else if (typeName === 'Fijo') {
        const validNumbers = numbers.filter(num => validateNumberForType(num, 'FIJO'));
        if (validNumbers.length > 0) {
          const totalAmount = amountLines.reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0);

          if (totalAmount > 0) {
            validPlays.push({
              type: typeName,
              combinations: validNumbers,
              amount: totalAmount,
              totalCost: totalAmount,
              details: `${validNumbers.length} números × $${totalAmount} = $${formatAmount(totalAmount)}`,
            });
          }
        }
      } else if (typeName === 'Corrido') {
        const validNumbers = numbers.filter(num => validateNumberForType(num, 'CORRIDO'));
        if (validNumbers.length > 0) {
          const totalAmount = amountLines.reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0);

          if (totalAmount > 0) {
            validPlays.push({
              type: typeName,
              combinations: validNumbers,
              amount: totalAmount,
              totalCost: totalAmount,
              details: `${validNumbers.length} números × $${totalAmount} = $${formatAmount(totalAmount)}`,
            });
          }
        }
      } else if (typeName === 'Centena') {
        const validNumbers = numbers.filter(num => validateNumberForType(num, 'CENTENA'));
        if (validNumbers.length > 0) {
          let totalAmount = 0;
          let details = '';

          if (amountLines.length > 0) {
            totalAmount = amountLines.reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0);
            details = `${validNumbers.length} centenas con montos individuales = $${formatAmount(totalAmount)}`;
          } else {
            totalAmount = 0;
            details = `${validNumbers.length} centenas sin montos = $0`;
          }

          if (totalAmount > 0) {
            validPlays.push({
              type: typeName,
              combinations: validNumbers,
              amount: totalAmount,
              totalCost: totalAmount,
              details,
            });
          }
        }
      }
    });

    return validPlays;
  };

  const calculateCurrentAmount = (): number => {
    const validPlays = getValidPlays();
    return validPlays.reduce((total, play) => total + play.totalCost, 0);
  };

  const calculateTotalAmount = (): number => {
    return allPlays.reduce((total, playVal) => total + playVal.amount, 0) + calculateCurrentAmount();
  };

  const hasValidAmounts = (): boolean => {
    const hasCurrentPlay = currentNumbers && selectedTypes.length > 0 && calculateCurrentAmount() > 0;
    const hasSeparatedPlays = allPlays.length > 0;

    if (!hasCurrentPlay && !hasSeparatedPlays) {
      return false;
    }

    for (const playVal of allPlays) {
      for (const validPlay of playVal.validPlays) {
        if (validPlay.totalCost <= 0) {
          return false;
        }
      }
    }

    if (hasCurrentPlay) {
      const validPlays = getValidPlays();
      for (const validPlay of validPlays) {
        if (validPlay.totalCost <= 0) {
          return false;
        }
      }
    }

    return true;
  };

  const [isLoadingInitialData, setIsLoadingInitialData] = useState(false);

  const loadPlayTypes = async () => {
    setIsLoadingPlayTypes(true);
    try {
      const response = await playTypeService.getPlayTypes();

      let typesArray: any[] = [];

      if (response) {
        if (Array.isArray(response)) {
          typesArray = response;
        } else if (response.data) {
          if (Array.isArray(response.data)) {
            typesArray = response.data;
          } else if (typeof response.data === 'object') {
            typesArray = Object.values(response.data);
          }
        } else if (typeof response === 'object') {
          typesArray = Object.values(response);
        }
      }

      const validTypes = typesArray.filter(type => 
        type &&
        typeof type === 'object' &&
        type.id &&
        type.name &&
        typeof type.id === 'string' &&
        typeof type.name === 'string'
      );

      setPlayTypes(validTypes);
    } catch (error) {
      console.error('❌ Error loading play types:', error);
      setPlayTypes([]);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudieron cargar los tipos de juego',
        position: 'top',
        topOffset: 60,
      });
    } finally {
      setIsLoadingPlayTypes(false);
    }
  };

  const loadActiveLotteries = async () => {
    setIsLoadingLotteries(true);
    try {
      const response = await lotteryService.getActiveLotteries();

      let lotteriesArray: any[] = [];

      if (response) {
        if (Array.isArray(response)) {
          lotteriesArray = response;
        } else if (response.data) {
          if (Array.isArray(response.data)) {
            lotteriesArray = response.data;
          } else if (typeof response.data === 'object') {
            lotteriesArray = Object.values(response.data);
          }
        } else if (typeof response === 'object') {
          lotteriesArray = Object.values(response);
        }
      }

      const validLotteries = lotteriesArray.filter(lottery => 
        lottery &&
        typeof lottery === 'object' &&
        lottery.id &&
        lottery.name &&
        typeof lottery.id === 'string' &&
        typeof lottery.name === 'string'
      );

      setLotteries(validLotteries);

      if (validLotteries.length > 0) {
        if (player?.defaultLotteryId) {
          const isDefaultLotteryAvailable = validLotteries.some(lottery => lottery.id === player.defaultLotteryId);

          if (isDefaultLotteryAvailable) {
            setSelectedLotteryId(player.defaultLotteryId);
          } else {
            setSelectedLotteryId(validLotteries[0].id);
          }
        } else {
          if (!selectedLotteryId) {
            setSelectedLotteryId(validLotteries[0].id);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error loading lotteries:', error);
      setLotteries([]);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudieron cargar las loterías',
        position: 'top',
        topOffset: 60,
      });
    } finally {
      setIsLoadingLotteries(false);
    }
  };

  const loadThrows = async (lotteryId: string) => {
    if (!lotteryId) {
      setThrows([]);
      setSelectedThrowId('');
      return;
    }

    setIsLoadingThrows(true);
    try {
      if (!lotteryId || typeof lotteryId !== 'string' || lotteryId.trim() === '') {
        throw new Error('ID de lotería inválido');
      }

      // Usar solo el endpoint active-for-time (no hacer fallback a /active)
      const utcTime = new Date().toISOString();
      const response = await throwService.getActiveThrowsByLotteryForTime(lotteryId, utcTime);

      let throwsArray: any[] = [];

      if (response) {
        if (Array.isArray(response)) {
          throwsArray = response;
        } else if (response.data) {
          if (Array.isArray(response.data)) {
            throwsArray = response.data;
          } else if (typeof response.data === 'object' && response.data.id) {
            throwsArray = [response.data];
          } else if (typeof response.data === 'object') {
            throwsArray = Object.values(response.data);
          }
        } else if (typeof response === 'object' && response.id) {
          throwsArray = [response];
        } else if (typeof response === 'object') {
          throwsArray = Object.values(response);
        }
      }

      const validThrows = throwsArray.filter(throwItem => 
        throwItem &&
        typeof throwItem === 'object' &&
        throwItem.id &&
        throwItem.name &&
        typeof throwItem.id === 'string' &&
        typeof throwItem.name === 'string'
      );

      setThrows(validThrows);

      if (validThrows.length > 0) {
        setSelectedThrowId(validThrows[0].id);
        Toast.show({
          type: 'success',
          text1: '✅ Tirada activa cargada',
          text2: validThrows[0].name,
          position: 'top',
          topOffset: 60,
          visibilityTime: 2000,
        });
      } else {
        setSelectedThrowId('');
        Toast.show({
          type: 'info',
          text1: 'ℹ️ Sin tiradas',
          text2: 'No hay tiradas activas para esta lotería',
          position: 'top',
          topOffset: 60,
          visibilityTime: 3000,
        });
      }
    } catch (error: any) {
      console.error('❌ Error loading throws:', error);

      if (error.response) {
        console.error('❌ Error response:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          url: error.config?.url,
          method: error.config?.method,
          lotteryId,
        });
      }

      // Siempre establecer throws como vacío cuando hay error
      setThrows([]);
      setSelectedThrowId('');

      // Si es 404, tratarlo como "no hay tiradas activas" (no mostrar error)
      if (error.response?.status === 404) {
        // No mostrar Toast de error, solo establecer estado vacío
        // El UI mostrará "📊 Sin tiradas activas" automáticamente
        return;
      }
      
      // Para error 401, mostrar mensaje de sesión expirada
      if (error.response?.status === 401) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Sesión expirada. Por favor, inicia sesión nuevamente.',
          position: 'top',
          topOffset: 60,
        });
      }
      // Para otros errores, no mostrar Toast, solo establecer estado vacío
      // El UI mostrará "📊 Sin tiradas activas" automáticamente
    } finally {
      setIsLoadingThrows(false);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      setIsLoadingInitialData(true);
      try {
        await loadPlayTypes();
        await loadActiveLotteries();
      } catch (error) {
        console.error('Error inicializando datos de apuesta para jugador:', error);
      } finally {
        setIsLoadingInitialData(false);
      }
    };

    initializeData();
  }, [player.id]);

  useEffect(() => {
    if (selectedLotteryId) {
      loadThrows(selectedLotteryId);
    }
  }, [selectedLotteryId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const addNumber = (num: string) => {
    if (isAlMode && alFirstNumber) {
      const numbers = getIndividualNumbers();

      if (numbers.length >= 30) {
        return;
      }

      let newCurrentNumbers: string;

      const lastChar = currentNumbers[currentNumbers.length - 1];
      const parts = currentNumbers.split(/[\n,]/);
      const currentNumber = parts[parts.length - 1];

      if (lastChar === '\n' || lastChar === ',' || currentNumbers === '') {
        newCurrentNumbers = currentNumbers + num;
      } else {
        if (currentNumber.length >= 3) {
          return;
        }

        newCurrentNumbers = currentNumbers + num;
      }

      setCurrentNumbers(newCurrentNumbers);
      return;
    }

    let targetType: string | null = null;
    switch (activeGameTab) {
      case 'numeros':
        targetType = null;
        break;
      case 'fijo':
        targetType = 'Fijo';
        break;
      case 'corrido':
        targetType = 'Corrido';
        break;
      case 'centena':
        targetType = 'Centena';
        break;
      case 'parlet':
        targetType = 'Parlet';
        break;
      default:
        targetType = null;
    }

    if (targetType) {
      if (!selectedTypes.includes(targetType)) {
        setSelectedTypes(prev => [...prev, targetType!]);
      }

      const currentAmounts = typeAmountInputs[targetType] || '';

      if (currentAmounts) {
        const amountLines = currentAmounts.split('\n');
        const lastLine = amountLines[amountLines.length - 1] || '';
        const newLastLine = lastLine + num;
        amountLines[amountLines.length - 1] = newLastLine;
        const newAmounts = amountLines.join('\n');

        setTypeAmountInputs(prev => ({
          ...prev,
          [targetType!]: newAmounts,
        }));
      } else {
        setTypeAmountInputs(prev => ({
          ...prev,
          [targetType!]: num,
        }));
      }
    } else {
      const numbers = getIndividualNumbers();

      if (numbers.length >= 30) {
        return;
      }

      let newCurrentNumbers: string;

      const lastChar = currentNumbers[currentNumbers.length - 1];
      const parts = currentNumbers.split(/[\n,]/);
      const currentNumber = parts[parts.length - 1];

      if (lastChar === '\n' || lastChar === ',' || currentNumbers === '') {
        newCurrentNumbers = currentNumbers + num;
      } else {
        if (currentNumber.length >= 3) {
          return;
        }

        newCurrentNumbers = currentNumbers + num;
      }

      setCurrentNumbers(newCurrentNumbers);

      const updatedParts = newCurrentNumbers.split(/[\n,]/);
      const updatedCurrentNumber = updatedParts[updatedParts.length - 1];
      if (updatedCurrentNumber.length === 3 && !isNaN(parseInt(updatedCurrentNumber))) {
        setTimeout(() => {
          setCurrentNumbers(prev => prev + '\n');
        }, 100);
      }

      if (!currentNumbers) {
        const newPlayId = Date.now().toString();
        setCurrentPlayId(newPlayId);
      }
    }
  };

  const addDecimalPoint = () => {
    if (activeGameTab !== 'numeros' && selectedTypes.length > 0) {
      const currentType = activeGameTab.charAt(0).toUpperCase() + activeGameTab.slice(1);
      const currentAmounts = typeAmountInputs[currentType] || '';

      const amountLines = currentAmounts.split('\n');
      const lastLine = amountLines[amountLines.length - 1] || '';

      if (!lastLine.includes('.') && lastLine.length > 0) {
        amountLines[amountLines.length - 1] = lastLine + '.';
        const newAmounts = amountLines.join('\n');

        setTypeAmountInputs(prev => ({
          ...prev,
          [currentType]: newAmounts,
        }));
      }
    }
  };

  const generateAlRange = (firstNum: string, secondNum: string): string[] => {
    const num1 = parseInt(firstNum);
    const num2 = parseInt(secondNum);

    if (isNaN(num1) || isNaN(num2)) return [];

    if (firstNum.length === 3 && secondNum.length === 3) {
      const result: string[] = [];

      const firstDigits = firstNum.split('');
      const secondDigits = secondNum.split('');

      const firstHundred = firstDigits[0];
      const firstTen = firstDigits[1];
      const firstUnit = firstDigits[2];

      const secondHundred = secondDigits[0];
      const secondTen = secondDigits[1];
      const secondUnit = secondDigits[2];

      if (firstTen === secondTen && firstUnit === secondUnit) {
        const hundredStart = Math.min(parseInt(firstHundred), parseInt(secondHundred));
        const hundredEnd = Math.max(parseInt(firstHundred), parseInt(secondHundred));

        for (let i = hundredStart; i <= hundredEnd; i++) {
          const number = i.toString() + firstTen + firstUnit;
          result.push(number);
        }

        return result;
      }

      if (firstHundred === secondHundred && firstUnit === secondUnit) {
        const tenStart = Math.min(parseInt(firstTen), parseInt(secondTen));
        const tenEnd = Math.max(parseInt(firstTen), parseInt(secondTen));

        for (let i = tenStart; i <= tenEnd; i++) {
          const number = firstHundred + i.toString() + firstUnit;
          result.push(number);
        }

        return result;
      }

      if (firstHundred === secondHundred) {
        const firstLastTwo = parseInt(firstNum.substring(1));
        const secondLastTwo = parseInt(secondNum.substring(1));
        const difference = Math.abs(secondLastTwo - firstLastTwo);

        if (difference < 10) {
          const start = Math.min(firstLastTwo, secondLastTwo);
          const end = Math.max(firstLastTwo, secondLastTwo);

          for (let i = start; i <= end; i++) {
            const lastTwoStr = i.toString().padStart(2, '0');
            const number = firstHundred + lastTwoStr;
            result.push(number);
          }
        } else {
          return [];
        }

        return result;
      }

      return [];
    }

    if (num1 >= 0 && num2 >= 0 && num1 <= 99 && num2 <= 99) {
      const result: string[] = [];
      const start = Math.min(num1, num2);
      const end = Math.max(num1, num2);

      const firstDigits = firstNum.split('');
      const secondDigits = secondNum.split('');
      const bothHaveEqualDigits =
        firstDigits.length === 2 &&
        firstDigits[0] === firstDigits[1] &&
        secondDigits.length === 2 &&
        secondDigits[0] === secondDigits[1];

      if (bothHaveEqualDigits) {
        const firstDigit = parseInt(firstDigits[0]);
        const secondDigit = parseInt(secondDigits[0]);
        const digitStart = Math.min(firstDigit, secondDigit);
        const digitEnd = Math.max(firstDigit, secondDigit);

        for (let i = digitStart; i <= digitEnd; i++) {
          const number = i.toString() + i.toString();
          result.push(number);
        }

        return result;
      }

      const difference = Math.abs(num2 - num1);

      if (difference <= 10) {
        for (let i = start; i <= end; i++) {
          if (firstNum.startsWith('0') || secondNum.startsWith('0')) {
            result.push(i.toString().padStart(2, '0'));
          } else {
            result.push(i.toString());
          }
        }
      } else {
        for (let i = start; i <= end; i += 10) {
          if (firstNum.startsWith('0') || secondNum.startsWith('0')) {
            result.push(i.toString().padStart(2, '0'));
          } else {
            result.push(i.toString());
          }
        }
        if (!result.includes(secondNum)) {
          result.push(secondNum);
        }
      }
      return result;
    }

    if (firstNum.length === 1 && secondNum.length === 1) {
      const start = Math.min(num1, num2);
      const end = Math.max(num1, num2);
      const result: string[] = [];

      for (let i = start; i <= end; i++) {
        result.push(i.toString());
      }
      return result;
    }

    return [];
  };

  const addComma = () => {
    if (activeGameTab === 'numeros') {
      if (isAlMode && alFirstNumber) {
        const numbers = getIndividualNumbers();
        if (numbers.length >= 2) {
          const secondNumber = numbers[numbers.length - 1];
          const alRange = generateAlRange(alFirstNumber, secondNumber);

          if (alRange.length > 0) {
            const alRangeString = alRange.join('\n');
            setCurrentNumbers(alRangeString);

            setIsAlMode(false);
            setAlFirstNumber('');
            return;
          }
        }
      }

      const numbers = getIndividualNumbers();

      if (numbers.length >= 30) {
        return;
      }

      const lastChar = currentNumbers[currentNumbers.length - 1];

      if (lastChar === '\n') {
        return;
      }

      const parts = currentNumbers.split(/[\n,]/);
      const lastPart = parts[parts.length - 1];

      if (!lastPart || lastPart.trim() === '') {
        return;
      }

      const newNumbers = currentNumbers + '\n';
      setCurrentNumbers(newNumbers);
      return;
    }

    if (activeGameTab !== 'numeros' && selectedTypes.length > 0) {
      const currentType = activeGameTab.charAt(0).toUpperCase() + activeGameTab.slice(1);
      const currentAmounts = typeAmountInputs[currentType] || '';

      if (!currentAmounts.endsWith('\n')) {
        const newAmounts = currentAmounts + '\n';
        setTypeAmountInputs(prev => ({
          ...prev,
          [currentType]: newAmounts,
        }));
      }
    }
  };

  const backspace = () => {
    if (activeGameTab === 'numeros') {
      if (currentNumbers) {
        let newCurrentNumbers: string;
        if (currentNumbers.endsWith('\n')) {
          newCurrentNumbers = currentNumbers.slice(0, -1);
        } else {
          newCurrentNumbers = currentNumbers.slice(0, -1);
        }

        setCurrentNumbers(newCurrentNumbers);
      }
    } else {
      const targetType = activeGameTab.charAt(0).toUpperCase() + activeGameTab.slice(1);

      if (selectedTypes.includes(targetType)) {
        const currentAmounts = typeAmountInputs[targetType] || '';

        if (currentAmounts) {
          const amountLines = currentAmounts.split('\n');
          const lastLine = amountLines[amountLines.length - 1] || '';

          if (lastLine.length > 0) {
            const newLastLine = lastLine.slice(0, -1);
            amountLines[amountLines.length - 1] = newLastLine;
            const newAmounts = amountLines.join('\n');

            setTypeAmountInputs(prev => ({
              ...prev,
              [targetType]: newAmounts,
            }));
          } else if (amountLines.length > 1) {
            amountLines.pop();
            const newAmounts = amountLines.join('\n');

            setTypeAmountInputs(prev => ({
              ...prev,
              [targetType]: newAmounts,
            }));
          }
        }
      }
    }
  };

  const clearAll = () => {
    setCurrentNumbers('');
    setSelectedTypes([]);
    setTypeAmountInputs({});
    setIsEditingSeparatedPlay(false);
    setCurrentPlayId(null);
    setIsAlMode(false);
    setAlFirstNumber('');
    setActiveGameTab('numeros');
  };

  const toggleType = (typeName: string) => {
    const available = getAvailableTypes();

    if (!available.includes(typeName)) {
      return;
    }

    setSelectedTypes(prev => {
      if (prev.includes(typeName)) {
        return prev;
      } else {
        return [...prev, typeName];
      }
    });

    switch (typeName) {
      case 'Fijo':
        setActiveGameTab('fijo');
        break;
      case 'Corrido':
        setActiveGameTab('corrido');
        break;
      case 'Centena':
        setActiveGameTab('centena');
        break;
      case 'Parlet':
        setActiveGameTab('parlet');
        break;
      default:
        setActiveGameTab('numeros');
    }
  };

  const applyAl = () => {
    const numbers = getIndividualNumbers();

    if (numbers.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Primero ingresa un número',
        position: 'top',
        topOffset: 60,
      });
      return;
    }

    if (numbers.length > 1) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Solo ingresa un número antes de presionar AL',
        position: 'top',
        topOffset: 60,
      });
      return;
    }

    const singleNumber = numbers[0].trim();
    setAlFirstNumber(singleNumber);
    setIsAlMode(true);

    setCurrentNumbers(currentNumbers + ',');
  };

  const separatePlay = () => {
    if (currentNumbers && selectedTypes.length > 0) {
      let hasDuplicates = false;
      let hasNonParletDuplicates = false;

      const currentPlayNumbers = getIndividualNumbers();
      const hasParletInCurrent = selectedTypes.includes('Parlet');

      const seenNumbers = new Set<string>();
      currentPlayNumbers.forEach(num => {
        if (seenNumbers.has(num)) {
          hasDuplicates = true;
        } else {
          seenNumbers.add(num);
        }
      });

      if (hasDuplicates && !hasParletInCurrent) {
        hasNonParletDuplicates = true;
      }

      if (hasNonParletDuplicates) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'No se permiten números duplicados en la jugada actual que no sea Parlet',
          position: 'top',
          topOffset: 60,
        });
        return;
      }

      if (hasDuplicates && !hasNonParletDuplicates) {
        Toast.show({
          type: 'success',
          text1: '✅ Números duplicados permitidos',
          text2: 'Para jugadas de Parlet',
          position: 'top',
          topOffset: 60,
        });
      }

      const validPlays = getValidPlays();
      if (validPlays.length > 0 && calculateCurrentAmount() > 0) {
        const newPlay: Play = {
          id: currentPlayId || Date.now().toString(),
          numbers: currentNumbers,
          validPlays,
          amount: validPlays.reduce((total, playVal) => total + playVal.totalCost, 0),
          timestamp: new Date().toLocaleTimeString(),
          typeAmountInputs: JSON.parse(JSON.stringify(typeAmountInputs)),
        };

        setAllPlays(prev => [...prev, newPlay]);

        setCurrentNumbers('');
        setSelectedTypes([]);
        setTypeAmountInputs({});
        setCurrentPlayId(null);
        setIsEditingSeparatedPlay(false);
        setActiveGameTab('numeros');
      }
    }
  };

  const removePlay = (playId: string) => {
    setAllPlays(prev => prev.filter(playVal => playVal.id !== playId));
  };

  const editPlay = (play: Play) => {
    setAllPlays(prev => prev.filter(p => p.id !== play.id));

    setCurrentNumbers(play.numbers);

    const playTypesNames = play.validPlays.map(vp => vp.type);
    setSelectedTypes(playTypesNames);

    if (play.typeAmountInputs) {
      setTypeAmountInputs(JSON.parse(JSON.stringify(play.typeAmountInputs)));
    }

    setIsEditingSeparatedPlay(true);
    setCurrentPlayId(play.id);

    if (playTypesNames.length > 0) {
      const firstType = playTypesNames[0].toLowerCase();
      if (firstType === 'fijo') setActiveGameTab('fijo');
      else if (firstType === 'corrido') setActiveGameTab('corrido');
      else if (firstType === 'centena') setActiveGameTab('centena');
      else if (firstType === 'parlet') setActiveGameTab('parlet');
      else setActiveGameTab('numeros');
    }
  };

  const sendBet = async () => {
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

    if (!selectedThrowId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Selecciona una tirada',
        position: 'top',
        topOffset: 60,
      });
      return;
    }

    let hasDuplicates = false;
    let hasNonParletDuplicates = false;

    if (currentNumbers && selectedTypes.length > 0) {
      const currentPlayNumbers = getIndividualNumbers();
      const hasParletInCurrent = selectedTypes.includes('Parlet');

      const seenNumbers = new Set<string>();
      currentPlayNumbers.forEach(num => {
        if (seenNumbers.has(num)) {
          hasDuplicates = true;
        } else {
          seenNumbers.add(num);
        }
      });

      if (hasDuplicates && !hasParletInCurrent) {
        hasNonParletDuplicates = true;
      }
    }

    if (hasNonParletDuplicates) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se permiten números duplicados en la jugada actual que no sea Parlet',
        position: 'top',
        topOffset: 60,
      });
      return;
    }

    if (hasDuplicates && !hasNonParletDuplicates) {
      Toast.show({
        type: 'success',
        text1: '✅ Números duplicados permitidos',
        text2: 'Para jugadas de Parlet',
        position: 'top',
        topOffset: 60,
      });
    }

    let finalPlays = [...allPlays];

    if (currentNumbers && selectedTypes.length > 0 && calculateCurrentAmount() > 0) {
      const validPlays = getValidPlays();
      if (validPlays.length > 0) {
        const currentPlay: Play = {
          id: Date.now().toString(),
          numbers: currentNumbers,
          validPlays,
          amount: calculateCurrentAmount(),
          timestamp: new Date().toLocaleTimeString(),
          typeAmountInputs: JSON.parse(JSON.stringify(typeAmountInputs)),
        };
        finalPlays.push(currentPlay);
      }
    }

    if (finalPlays.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No hay jugadas para enviar',
        position: 'top',
        topOffset: 60,
      });
      return;
    }

    const playerFullName = `${player.firstName} ${player.lastName || ''}`.trim();

    Alert.alert(
      '🎯 Confirmar Apuesta',
      `¿Registrar apuesta para ${playerFullName} por $${formatAmount(calculateTotalAmount())}?\n\n` +
        `${finalPlays.length} jugada${finalPlays.length !== 1 ? 's' : ''}\n` +
        `Lotería: ${lotteries.find(l => l.id === selectedLotteryId)?.name || 'Sin lotería'}\n` +
        `Tirada: ${throws.find(t => t.id === selectedThrowId)?.name || 'Sin tirada'}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar',
          onPress: async () => {
            setIsSending(true);
            try {
              const betPlays = finalPlays.map(playVal => {
                const moves = playVal.validPlays.map(validPlay => {
                  const playTypeId = getPlayTypeId(validPlay.type);

                  const typeInputRaw =
                    (playVal.typeAmountInputs && playVal.typeAmountInputs[validPlay.type]) || '';
                  const amountLines = typeInputRaw
                    ? typeInputRaw.split('\n').filter(line => (line || '').trim() !== '')
                    : [];

                  const combinations = Array.isArray(validPlay.combinations)
                    ? validPlay.combinations
                    : [];

                  const moveDetails: any[] = [];

                  if (validPlay.type === 'Parlet') {
                    const baseAmount = amountLines.length > 0 ? parseFloat(amountLines[0]) || 0 : 0;

                    combinations.forEach(combo => {
                      if (typeof combo === 'string' && combo.includes('X')) {
                        const [rawFirst, rawSecond] = combo.split('X');
                        const first = formatNumberDisplay((rawFirst || '').trim());
                        const second = formatNumberDisplay((rawSecond || '').trim());

                        moveDetails.push({
                          number: first,
                          secondNumber: second || null,
                          amount: baseAmount,
                        });
                      }
                    });
                  } else {
                    combinations.forEach((numStr, idx) => {
                      const amount =
                        amountLines.length === 1
                          ? parseFloat(amountLines[0]) || 0
                          : parseFloat(amountLines[idx]) || 0;

                      const formattedNumber = formatNumberDisplay((numStr || '').trim());

                      moveDetails.push({
                        number: formattedNumber,
                        secondNumber: null,
                        amount,
                      });
                    });
                  }

                  return {
                    playTypeId,
                    moveDetails,
                  };
                });

                return { moves };
              });

              const currentDateTime = new Date();
              const utcDateTime = currentDateTime.toISOString();

              const betData = {
                userId: player.id,
                throwId: selectedThrowId,
                date: utcDateTime,
                betPlays,
              };

              await bookieService.createBetPlay(betData);

              const totalAmount = finalPlays.reduce((total, playVal) => total + playVal.amount, 0);

              Toast.show({
                type: 'success',
                text1: '¡APUESTA REGISTRADA!',
                text2: `$${formatAmount(totalAmount)} - ${playerFullName}`,
                position: 'top',
                topOffset: 60,
                visibilityTime: 5000,
              });

              setTimeout(() => {
                setAllPlays([]);
                setCurrentNumbers('');
                setSelectedTypes([]);
                setTypeAmountInputs({});
                setActiveGameTab('numeros');
              }, 100);
            } catch (error: any) {
              console.error('Error al registrar la apuesta del jugador:', error);

              let errorMessage = 'Error desconocido';

              if (error.response) {
                if (error.response.status === 401) {
                  errorMessage = '🔐 Sesión expirada. Por favor, inicia sesión nuevamente.';
                } else if (error.response.data) {
                  if (error.response.data.message) {
                    if (error.response.data.message === 'BetOutOfTimeLimit') {
                      errorMessage =
                        '⏰ La tirada seleccionada ya no acepta apuestas. Usa otra tirada activa.';
                    } else {
                      errorMessage = error.response.data.message;
                    }
                  } else if (error.response.data.details) {
                    errorMessage = error.response.data.details;
                  } else if (typeof error.response.data === 'string') {
                    errorMessage = error.response.data;
                  }
                }
              } else if (error.request) {
                errorMessage = 'Error de conexión con el servidor';
              } else {
                errorMessage = error.message || 'Error desconocido';
              }

              Toast.show({
                type: 'error',
                text1: 'Error al registrar la apuesta',
                text2: errorMessage,
                position: 'top',
                topOffset: 60,
                visibilityTime: 5000,
              });
            } finally {
              setIsSending(false);
            }
          },
        },
      ],
    );
  };

  const throwStatus = useMemo(() => {
    if (!Array.isArray(throws) || throws.length === 0) {
      return null;
    }

    const activeThrow = throws[0];
    if (!activeThrow || !activeThrow.endTime) {
      return null;
    }

    try {
      const now = currentTime;
      const endTime = new Date(activeThrow.endTime);

      if (isNaN(endTime.getTime())) {
        return { status: 'error', color: '#ef4444', text: 'Fecha inválida' };
      }

      if (endTime <= now) {
        return { status: 'closed', color: '#ef4444', text: 'Cerrada' };
      }

      const minutesRemaining = Math.floor((endTime.getTime() - now.getTime()) / (1000 * 60));

      if (minutesRemaining <= 5) {
        return { status: 'critical', color: '#dc2626', text: 'Cierra en 5min' };
      } else if (minutesRemaining <= 15) {
        return { status: 'urgent', color: '#ef4444', text: 'Cierra en 15min' };
      } else if (minutesRemaining <= 30) {
        return { status: 'urgent', color: '#f97316', text: 'Cierra en 30min' };
      } else if (minutesRemaining <= 60) {
        return { status: 'warning', color: '#f59e0b', text: 'Cierra en 1h' };
      }

      return { status: 'normal', color: '#22c55e', text: 'Abierta' };
    } catch (error) {
      console.error('❌ Error calculando estado de tirada:', error);
      return { status: 'error', color: '#ef4444', text: 'Error de estado' };
    }
  }, [throws, currentTime]);

  const availableTypes = getAvailableTypes();
  const totalAmount = calculateTotalAmount();

  const lotteryOptions: ComboboxOption[] = (Array.isArray(lotteries) ? lotteries : [])
    .filter(lottery => lottery && typeof lottery === 'object' && lottery.id && lottery.name)
    .map(lottery => ({
      id: lottery.id,
      label: lottery.name,
      value: lottery.id,
    }));

  return (
    <View style={formStyles.mainContainer}>
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

      <KeyboardAvoidingView
        style={formStyles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView style={formStyles.scrollView} keyboardShouldPersistTaps="handled">
          <Card
            title="Registrar Apuesta"
            icon="dice-outline"
            headerRight={
              <TouchableOpacity
                style={[formStyles.sendButton, !hasValidAmounts() && formStyles.sendButtonDisabled]}
                onPress={sendBet}
                disabled={!hasValidAmounts() || isSending || !selectedThrowId}
              >
                <LinearGradient
                  colors={
                    !hasValidAmounts() || !selectedThrowId
                      ? ['#666', '#444']
                      : [colors.primaryGold, colors.primaryRed]
                  }
                  style={formStyles.sendButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {isSending ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Ionicons name="send-outline" size={12} color="white" />
                      <Text style={formStyles.sendButtonText}>Enviar</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            }
          >
            <View style={formStyles.headerContainer}>
              <View style={formStyles.selectorsContainer}>
                <View style={formStyles.lotterySelectorContainer}>
                  <Combobox
                    options={lotteryOptions}
                    selectedValue={selectedLotteryId}
                    onValueChange={value => {
                      setSelectedLotteryId(value);
                      setSelectedThrowId('');
                    }}
                    placeholder="📊 Lotería"
                    loading={isLoadingLotteries || isLoadingInitialData}
                    loadingText="🔄 Cargando loterías..."
                    emptyText="❌ No hay loterías disponibles"
                    enabled={!isLoadingLotteries && lotteryOptions.length > 0}
                    style={formStyles.comboboxStyle}
                  />
                </View>

                <View style={formStyles.throwInfoContainer}>
                  {selectedLotteryId && throws.length > 0 ? (
                    <View style={formStyles.activeThrowContainer}>
                      <Text style={formStyles.throwName}>🎯 {throws[0].name}</Text>
                      {throws[0].endTime && (
                        <Text style={formStyles.throwEndTime}>
                          Cierra: {convertUtcTimeToLocal(throws[0].endTime)}
                        </Text>
                      )}
                    </View>
                  ) : (
                    <View style={formStyles.noThrowContainer}>
                      <Text style={formStyles.noThrowText}>
                        {isLoadingThrows ? '🔄 Cargando...' : '📊 Sin tiradas activas'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {isAlMode && (
                <View style={formStyles.alIndicator}>
                  <Text style={formStyles.alText}>
                    🎯 AL activo: {alFirstNumber} → Ingresa el segundo número y presiona Enter
                  </Text>
                </View>
              )}

              <View style={formStyles.unifiedTable}>
                <View style={formStyles.tableHeader}>
                  <TouchableOpacity
                    style={[
                      formStyles.tableHeaderCell,
                      activeGameTab === 'numeros' && formStyles.tableHeaderCellActive,
                    ]}
                    onPress={() => setActiveGameTab('numeros')}
                  >
                    <Text
                      style={[
                        formStyles.tableHeaderText,
                        activeGameTab === 'numeros' && formStyles.tableHeaderTextActive,
                      ]}
                    >
                      Números
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      formStyles.tableHeaderCell,
                      selectedTypes.includes('Fijo') && formStyles.tableHeaderCellSelected,
                    ]}
                    onPress={() => setActiveGameTab('fijo')}
                  >
                    <Text
                      style={[
                        formStyles.tableHeaderText,
                        selectedTypes.includes('Fijo') && formStyles.tableHeaderTextSelected,
                      ]}
                    >
                      Fijo
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      formStyles.tableHeaderCell,
                      selectedTypes.includes('Corrido') && formStyles.tableHeaderCellSelected,
                    ]}
                    onPress={() => setActiveGameTab('corrido')}
                  >
                    <Text
                      style={[
                        formStyles.tableHeaderText,
                        selectedTypes.includes('Corrido') && formStyles.tableHeaderTextSelected,
                      ]}
                    >
                      Corrido
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      formStyles.tableHeaderCell,
                      selectedTypes.includes('Centena') && formStyles.tableHeaderCellSelected,
                    ]}
                    onPress={() => setActiveGameTab('centena')}
                  >
                    <Text
                      style={[
                        formStyles.tableHeaderText,
                        selectedTypes.includes('Centena') && formStyles.tableHeaderTextSelected,
                      ]}
                    >
                      Centena
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      formStyles.tableHeaderCell,
                      selectedTypes.includes('Parlet') && formStyles.tableHeaderCellSelected,
                    ]}
                    onPress={() => setActiveGameTab('parlet')}
                  >
                    <Text
                      style={[
                        formStyles.tableHeaderText,
                        selectedTypes.includes('Parlet') && formStyles.tableHeaderTextSelected,
                      ]}
                    >
                      Parlet
                    </Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={formStyles.tableBody} nestedScrollEnabled>
                  {getIndividualNumbers().length > 0 ? (
                    getIndividualNumbers().map((number, index) => (
                      <View key={`${number}-${index}`} style={formStyles.tableRow}>
                        <View
                          style={[
                            formStyles.tableCell,
                            activeGameTab === 'numeros' && formStyles.tableCellActive,
                          ]}
                        >
                          <Text style={formStyles.numberText}>{formatNumberDisplay(number)}</Text>
                        </View>

                        <TouchableOpacity
                          style={[
                            formStyles.tableCell,
                            activeGameTab === 'fijo' && formStyles.tableCellActive,
                          ]}
                          onPress={() => setActiveGameTab('fijo')}
                        >
                          <Text style={formStyles.amountText}>
                            {(() => {
                              const fijoAmounts = typeAmountInputs['Fijo'] || '';
                              const amountLines = fijoAmounts.split('\n');
                              const amount = amountLines[index] || '';
                              return amount ? `$${amount}` : '';
                            })()}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            formStyles.tableCell,
                            activeGameTab === 'corrido' && formStyles.tableCellActive,
                          ]}
                          onPress={() => setActiveGameTab('corrido')}
                        >
                          <Text style={formStyles.amountText}>
                            {(() => {
                              const corridoAmounts = typeAmountInputs['Corrido'] || '';
                              const amountLines = corridoAmounts.split('\n');
                              const amount = amountLines[index] || '';
                              return amount ? `$${amount}` : '';
                            })()}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            formStyles.tableCell,
                            activeGameTab === 'centena' && formStyles.tableCellActive,
                          ]}
                          onPress={() => setActiveGameTab('centena')}
                        >
                          <Text style={formStyles.amountText}>
                            {(() => {
                              const centenaAmounts = typeAmountInputs['Centena'] || '';
                              const amountLines = centenaAmounts.split('\n');
                              const amount = amountLines[index] || '';
                              return amount ? `$${amount}` : '';
                            })()}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            formStyles.tableCell,
                            activeGameTab === 'parlet' && formStyles.tableCellActive,
                          ]}
                          onPress={() => setActiveGameTab('parlet')}
                        >
                          <Text style={formStyles.amountText}>
                            {(() => {
                              const parletAmounts = typeAmountInputs['Parlet'] || '';
                              const amountLines = parletAmounts.split('\n');
                              const amount = index === 0 ? amountLines[0] || '' : '';
                              return amount ? `$${amount}` : '';
                            })()}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ))
                  ) : (
                    <View style={formStyles.emptyTableMessage}>
                      <Text style={formStyles.emptyTableText}>
                        Escribe números para comenzar a apostar...
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </View>

              <View style={formStyles.totalContainer}>
                <Text style={formStyles.totalText}>Total $ {formatAmount(totalAmount)}</Text>
              </View>

              <TextInput
                ref={numbersInputRef}
                style={formStyles.hiddenInput}
                value={currentNumbers}
                onChangeText={() => {}}
                onKeyPress={e => {
                  if (e.nativeEvent.key === 'Enter') {
                    addComma();
                  } else if (e.nativeEvent.key === 'Backspace') {
                    backspace();
                  } else if (e.nativeEvent.key === '.') {
                    addDecimalPoint();
                  } else if (/^[0-9]$/.test(e.nativeEvent.key)) {
                    addNumber(e.nativeEvent.key);
                  }
                }}
                autoComplete="off"
                autoCorrect={false}
                autoCapitalize="none"
                spellCheck={false}
                placeholder="Escribe números aquí..."
              />

              {allPlays.length > 0 && (
                <View style={formStyles.playsSection}>
                  <Text style={formStyles.playsSectionTitle}>
                    🎯 JUGADAS REGISTRADAS ({allPlays.length})
                  </Text>
                  <View style={formStyles.playsList}>
                    {allPlays.map(playVal => (
                      <View key={playVal.id} style={formStyles.playItem}>
                        <View style={formStyles.playItemContent}>
                          <View style={formStyles.playHeader}>
                            <Text style={formStyles.playTimestamp}>🔢 {playVal.timestamp}</Text>
                            <View style={formStyles.playActions}>
                              <TouchableOpacity style={formStyles.editButton} onPress={() => editPlay(playVal)}>
                                <Text style={formStyles.editButtonText}>✏️</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={formStyles.deleteButton}
                                onPress={() => removePlay(playVal.id)}
                              >
                                <Text style={formStyles.deleteButtonText}>🗑️</Text>
                              </TouchableOpacity>
                            </View>
                          </View>

                          {/* Mostrar números con montos individuales */}
                          <View style={formStyles.playNumbersContainer}>
                            {playVal.numbers
                              .split('\n')
                              .filter(num => num.trim() !== '')
                              .map((number, idx) => {
                                const numberDisplay = formatNumberDisplay(number);
                                return (
                                  <View key={`${number}-${idx}`} style={formStyles.playNumberRow}>
                                    <Text style={formStyles.playNumberText}>{numberDisplay}</Text>
                                    <View style={formStyles.playAmountButtons}>
                                      {playVal.validPlays.map((validPlay, typeIdx) => {
                                        const typeAmounts = playVal.typeAmountInputs?.[validPlay.type] || '';
                                        const amountLines = typeAmounts.split('\n').filter(line => line.trim() !== '');
                                        
                                        let amount = '';
                                        if (validPlay.type === 'Parlet') {
                                          // Para Parlet, usar el primer monto (monto base)
                                          amount = amountLines.length > 0 ? amountLines[0] : '';
                                        } else {
                                          // Para otros tipos, usar el monto correspondiente al índice del número
                                          amount = amountLines.length === 1 
                                            ? amountLines[0] // Si hay un solo monto, aplicarlo a todos
                                            : (amountLines[idx] || '');
                                        }
                                        
                                        if (!amount || parseFloat(amount) === 0) return null;
                                        
                                        return (
                                          <View
                                            key={typeIdx}
                                            style={[
                                              formStyles.playAmountButton,
                                              { backgroundColor: PLAY_TYPE_COLORS[validPlay.type] || colors.primaryGold },
                                            ]}
                                          >
                                            <Text style={formStyles.playAmountButtonText}>
                                              {validPlay.type}: ${formatAmount(parseFloat(amount))}
                                            </Text>
                                          </View>
                                        );
                                      })}
                                    </View>
                                  </View>
                                );
                              })}
                          </View>

                          {/* Resumen por tipo de juego */}
                          <View style={formStyles.playSummaryContainer}>
                            {playVal.validPlays.map((validPlay, idx) => {
                              const typeAmounts = playVal.typeAmountInputs?.[validPlay.type] || '';
                              const amountLines = typeAmounts.split('\n').filter(line => line.trim() !== '' && parseFloat(line) > 0);
                              const totalByType = validPlay.totalCost;
                              const count = validPlay.type === 'Parlet' 
                                ? validPlay.combinations.length 
                                : validPlay.combinations.length;
                              
                              return (
                                <Text key={`${validPlay.type}-${idx}`} style={formStyles.playSummaryText}>
                                  <Text style={[formStyles.playSummaryType, { color: PLAY_TYPE_COLORS[validPlay.type] || colors.primaryGold }]}>
                                    {validPlay.type}:
                                  </Text>
                                  {' '}
                                  {validPlay.type === 'Parlet' 
                                    ? `${count} combinaciones = $${formatAmount(totalByType)} USD`
                                    : `${count} números = $${formatAmount(totalByType)} USD`
                                  }
                                </Text>
                              );
                            })}
                            <Text style={formStyles.playTotal}>
                              Total: ${formatAmount(playVal.amount)} USD
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>

      <FloatingKeyboardModal
        isVisible={isFloatingModalVisible}
        onToggle={() => setIsFloatingModalVisible(!isFloatingModalVisible)}
        playTypes={playTypes}
        selectedTypes={selectedTypes}
        availableTypes={availableTypes}
        onToggleType={toggleType}
        onAddNumber={addNumber}
        onAddComma={addComma}
        onBackspace={backspace}
        onAddDecimalPoint={addDecimalPoint}
        onApplyAl={applyAl}
        onClearAll={clearAll}
        onSeparatePlay={separatePlay}
        onCopyToAll={() => {
          const numbers = getIndividualNumbers();
          if (numbers.length === 0) return;

          selectedTypes.forEach(typeName => {
            const currentInput = typeAmountInputs[typeName] || '';
            const amountLines = currentInput.split('\n').filter(line => line.trim() !== '');

            if (amountLines.length > 0) {
              const firstAmount = amountLines[0];

              if (typeName === 'Parlet') {
                setTypeAmountInputs(prev => ({
                  ...prev,
                  [typeName]: firstAmount,
                }));
              } else {
                const newAmounts = numbers.map(() => firstAmount).join('\n');
                setTypeAmountInputs(prev => ({
                  ...prev,
                  [typeName]: newAmounts,
                }));
              }
            }
          });
        }}
        getIndividualNumbers={getIndividualNumbers}
        currentNumbers={currentNumbers}
        allPlays={allPlays}
        typeAmountInputs={typeAmountInputs}
        calculateCurrentAmount={calculateCurrentAmount}
      />
    </View>
  );
};

const formStyles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    position: 'relative',
    zIndex: 1,
  },
  container: {
    flex: 1,
  },
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
  scrollView: {
    flex: 1,
    zIndex: 1,
    paddingBottom: 100,
  },
  headerContainer: {
    marginBottom: spacing.md,
  },
  selectorsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  lotterySelectorContainer: {
    flex: 1,
    minWidth: 120,
  },
  comboboxStyle: {
    flex: 1,
    minWidth: 100,
  },
  activeThrowContainer: {
    backgroundColor: `${colors.primaryGold}10`,
    borderWidth: 1,
    borderColor: `${colors.primaryGold}30`,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  throwName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primaryGold,
    marginBottom: 2,
  },
  activeThrowInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  throwEndTime: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.lightText,
  },
  noThrowContainer: {
    backgroundColor: `${colors.subtleGrey}20`,
    borderWidth: 1,
    borderColor: `${colors.subtleGrey}40`,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  noThrowText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.subtleGrey,
  },
  sendButton: {
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    minWidth: 60,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  sendButtonText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: 'white',
  },
  alIndicator: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  alText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primaryGold,
  },
  unifiedTable: {
    marginHorizontal: -spacing.md,
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: `${colors.primaryGold}20`,
  },
  tableHeaderCell: {
    flex: 1,
    padding: spacing.sm,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.inputBorder,
  },
  tableHeaderCellActive: {
    backgroundColor: `${colors.primaryGold}30`,
  },
  tableHeaderCellSelected: {
    backgroundColor: `${colors.primaryGold}20`,
  },
  tableHeaderText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.primaryGold,
    opacity: 0.8,
  },
  tableHeaderTextActive: {
    opacity: 1,
  },
  tableHeaderTextSelected: {
    opacity: 1,
  },
  tableBody: {
    maxHeight: 200,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.inputBorder,
  },
  tableCell: {
    flex: 1,
    padding: spacing.sm,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.inputBorder,
    minHeight: 40,
    justifyContent: 'center',
  },
  tableCellActive: {
    backgroundColor: `${colors.primaryGold}10`,
  },
  numberText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    color: colors.primaryGold,
    fontFamily: 'monospace',
  },
  amountText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.lightText,
  },
  emptyTableMessage: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyTableText: {
    fontSize: fontSize.sm,
    color: colors.subtleGrey,
    fontStyle: 'italic',
  },
  totalContainer: {
    alignItems: 'flex-end',
    marginBottom: spacing.md,
  },
  totalText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primaryGold,
  },
  hiddenInput: {
    position: 'absolute',
    top: -100,
    opacity: 0,
    width: 1,
    height: 1,
  },
  playsSection: {
    marginBottom: spacing.md,
  },
  playsSectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.subtleGrey,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  playsList: {},
  playItem: {
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primaryGold,
  },
  playItemContent: {
    flex: 1,
  },
  playHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  playTimestamp: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.primaryGold,
    fontFamily: 'monospace',
  },
  playActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  editButton: {
    backgroundColor: colors.primaryGold,
    borderRadius: borderRadius.sm,
    padding: spacing.xs,
    minWidth: 24,
    minHeight: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    fontSize: fontSize.xs,
    color: 'white',
  },
  deleteButton: {
    backgroundColor: colors.primaryRed,
    borderRadius: borderRadius.sm,
    padding: spacing.xs,
    minWidth: 24,
    minHeight: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: fontSize.xs,
    color: 'white',
  },
  playNumbers: {
    marginBottom: spacing.sm,
  },
  playNumbersLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primaryGold,
    marginBottom: spacing.xs,
  },
  playNumbersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  playNumberBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: `${colors.primaryGold}40`,
  },
  playNumberText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    color: colors.primaryGold,
    fontFamily: 'monospace',
    minWidth: 40,
  },
  playNumbersContainer: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  playNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: `${colors.primaryGold}20`,
  },
  playAmountButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    flex: 1,
  },
  playAmountButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    minHeight: 28,
    justifyContent: 'center',
  },
  playAmountButtonText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: 'white',
  },
  playSummaryContainer: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: `${colors.primaryGold}20`,
    gap: spacing.xs,
  },
  playSummaryText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.lightText,
  },
  playSummaryType: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  playTypeDetailsContainer: {
    marginBottom: spacing.sm,
  },
  playTypeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  parletCombinationsContainer: {
    marginTop: spacing.xs,
    paddingLeft: spacing.sm,
  },
  parletCombinationsLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.primaryGold,
    marginBottom: spacing.xs,
  },
  parletCombinationsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  parletCombinationBadge: {
    backgroundColor: '#dc2626',
    borderRadius: 4,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  parletCombinationText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: 'white',
    fontFamily: 'monospace',
  },
  playTypeName: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  playTypeInfo: {
    fontSize: fontSize.xs,
    color: colors.lightText,
    flex: 1,
  },
  playTypeAmount: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.primaryGold,
  },
  playTotal: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primaryGold,
    textAlign: 'left',
    marginTop: spacing.xs,
  },
  throwInfoContainer: {
    flex: 1,
    minWidth: 160,
  },
});
