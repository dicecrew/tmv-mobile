import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../styles/GlobalStyles';
import Card from '../common/Card';
import Toast from 'react-native-toast-message';
import { betService, lotteryService, throwService, playTypeService } from '../../api/services';
import { useAuth } from '../../contexts/AuthContext';

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

interface Play {
  id: string;
  numbers: string;
  types: { [key: string]: number }; // { typeId: amount }
  totalAmount: number;
}

const PLAY_TYPE_COLORS: { [key: string]: string } = {
  FIJO: '#2563eb',
  CORRIDO: '#7c3aed',
  PARLET: '#16a34a',
  CENTENA: '#dc2626',
};

const RegistrarApuesta: React.FC = () => {
  const { user } = useAuth();

  // Estados principales
  const [lotteries, setLotteries] = useState<Lottery[]>([]);
  const [throws, setThrows] = useState<Throw[]>([]);
  const [playTypes, setPlayTypes] = useState<PlayType[]>([]);

  const [selectedLotteryId, setSelectedLotteryId] = useState('');
  const [selectedThrowId, setSelectedThrowId] = useState('');
  const [currentNumbers, setCurrentNumbers] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [typeAmounts, setTypeAmounts] = useState<{ [key: string]: string }>({});
  const [plays, setPlays] = useState<Play[]>([]);
  const [playIdCounter, setPlayIdCounter] = useState(0);

  const [isLoadingLotteries, setIsLoadingLotteries] = useState(false);
  const [isLoadingThrows, setIsLoadingThrows] = useState(false);
  const [isLoadingPlayTypes, setIsLoadingPlayTypes] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [currentTime, setCurrentTime] = useState(new Date());

  // Cargar loterías activas
  const loadActiveLotteries = async () => {
    setIsLoadingLotteries(true);
    try {
      const response = await lotteryService.getActiveLotteries();

      let lotteriesArray: any[] = [];
      if (response && typeof response === 'object' && !Array.isArray(response)) {
        lotteriesArray = Object.values(response);
      } else if (response?.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
        lotteriesArray = Object.values(response.data);
      } else if (Array.isArray(response?.data)) {
        lotteriesArray = response.data;
      } else if (Array.isArray(response)) {
        lotteriesArray = response;
      }

      setLotteries(lotteriesArray);

      // Seleccionar primera lotería por defecto
      if (lotteriesArray.length > 0 && !selectedLotteryId) {
        setSelectedLotteryId(lotteriesArray[0].id);
      }
    } catch (error) {
      console.error('Error loading lotteries:', error);
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

  // Cargar tiradas por lotería
  const loadThrows = async (lotteryId: string) => {
    if (!lotteryId) return;

    setIsLoadingThrows(true);
    try {
      const utcTime = new Date().toISOString();
      const response = await throwService.getActiveThrowsByLotteryForTime(lotteryId, utcTime);

      let throwsArray: any[] = [];
      if (response?.data && Array.isArray(response.data)) {
        throwsArray = response.data;
      } else if (Array.isArray(response)) {
        throwsArray = response;
      } else if (response?.data && typeof response.data === 'object') {
        throwsArray = Object.values(response.data);
      }

      setThrows(throwsArray);

      // Seleccionar primera tirada por defecto
      if (throwsArray.length > 0) {
        setSelectedThrowId(throwsArray[0].id);
      } else {
        setSelectedThrowId('');
      }
    } catch (error) {
      console.error('Error loading throws:', error);
      setThrows([]);
      setSelectedThrowId('');
    } finally {
      setIsLoadingThrows(false);
    }
  };

  // Cargar tipos de juego
  const loadPlayTypes = async () => {
    setIsLoadingPlayTypes(true);
    try {
      const response = await playTypeService.getPlayTypes();

      let typesArray: any[] = [];
      if (response?.data && Array.isArray(response.data)) {
        typesArray = response.data;
      } else if (Array.isArray(response)) {
        typesArray = response;
      } else if (response?.data && typeof response.data === 'object') {
        typesArray = Object.values(response.data);
      }

      setPlayTypes(typesArray);
    } catch (error) {
      console.error('Error loading play types:', error);
    } finally {
      setIsLoadingPlayTypes(false);
    }
  };

  useEffect(() => {
    loadActiveLotteries();
    loadPlayTypes();
  }, []);

  useEffect(() => {
    if (selectedLotteryId) {
      loadThrows(selectedLotteryId);
    }
  }, [selectedLotteryId]);

  // Actualizar hora cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Toggle tipo de juego
  const toggleType = (typeId: string) => {
    setSelectedTypes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(typeId)) {
        newSet.delete(typeId);
        // Limpiar monto del tipo
      const newAmounts = { ...typeAmounts };
        delete newAmounts[typeId];
      setTypeAmounts(newAmounts);
    } else {
        newSet.add(typeId);
      }
      return newSet;
    });
  };

  // Actualizar monto de tipo
  const updateTypeAmount = (typeId: string, amount: string) => {
    setTypeAmounts((prev) => ({
      ...prev,
      [typeId]: amount,
    }));
  };

  // Validar números
  const validateNumbers = (numbers: string): boolean => {
    const cleanNumbers = numbers.trim();
    if (cleanNumbers.length < 2 || cleanNumbers.length > 3) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Los números deben tener 2 o 3 dígitos',
        position: 'top',
        topOffset: 60,
      });
      return false;
    }
    if (!/^\d+$/.test(cleanNumbers)) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Solo se permiten números',
        position: 'top',
        topOffset: 60,
      });
      return false;
    }
    return true;
  };

  // Agregar jugada
  const addPlay = () => {
    if (!currentNumbers.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Ingresa los números',
        position: 'top',
        topOffset: 60,
      });
      return;
    }
    
    if (!validateNumbers(currentNumbers)) {
      return;
    }

    if (selectedTypes.size === 0) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Selecciona al menos un tipo de juego',
        position: 'top',
        topOffset: 60,
      });
      return;
    }
    
    // Validar que todos los tipos seleccionados tengan monto
    const types: { [key: string]: number } = {};
    let totalAmount = 0;

    for (const typeId of Array.from(selectedTypes)) {
      const amount = parseFloat(typeAmounts[typeId] || '0');
      if (amount <= 0) {
        const typeName = playTypes.find((t) => t.id === typeId)?.name || 'este tipo';
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: `Ingresa un monto válido para ${typeName}`,
          position: 'top',
          topOffset: 60,
        });
        return;
      }
      types[typeId] = amount;
      totalAmount += amount;
    }

    const newPlay: Play = {
      id: `play-${playIdCounter}`,
      numbers: currentNumbers.trim(),
      types,
      totalAmount,
    };

    setPlays([...plays, newPlay]);
    setPlayIdCounter(playIdCounter + 1);

    // Limpiar formulario
    setCurrentNumbers('');
    setSelectedTypes(new Set());
    setTypeAmounts({});

    Toast.show({
      type: 'success',
      text1: '✅ Jugada agregada',
      text2: `${newPlay.numbers} - $${formatAmount(totalAmount)}`,
      position: 'top',
      topOffset: 60,
    });
  };

  // Eliminar jugada
  const removePlay = (playId: string) => {
    Alert.alert('Eliminar Jugada', '¿Estás seguro de que quieres eliminar esta jugada?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          setPlays(plays.filter((p) => p.id !== playId));
          Toast.show({
            type: 'info',
            text1: 'Jugada eliminada',
            position: 'top',
            topOffset: 60,
          });
        },
      },
    ]);
  };

  // Enviar apuesta
  const sendBet = async () => {
    if (!selectedLotteryId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Selecciona una lotería',
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
      
    if (plays.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Agrega al menos una jugada',
        position: 'top',
        topOffset: 60,
      });
      return;
    }

    const totalBetAmount = plays.reduce((sum, play) => sum + play.totalAmount, 0);

    Alert.alert(
      '🎯 Confirmar Apuesta',
      `¿Enviar apuesta por $${formatAmount(totalBetAmount)}?\n\n` +
        `${plays.length} jugada${plays.length !== 1 ? 's' : ''}\n` +
        `Lotería: ${lotteries.find((l) => l.id === selectedLotteryId)?.name}\n` +
        `Tirada: ${throws.find((t) => t.id === selectedThrowId)?.name}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar',
          onPress: async () => {
            setIsSending(true);
            try {
              // Construir betPlays
              const betPlays = plays.map((play) => {
                const moves = Object.entries(play.types).map(([typeId, amount]) => ({
                  numbers: play.numbers,
                  playTypeId: typeId,
                  totalAmount: amount,
                }));

                return {
                  playTypeId: Object.keys(play.types)[0], // Primer tipo (requerido por DTO)
                  moves,
                };
              });

              const betData = {
                throwId: selectedThrowId,
                date: new Date().toISOString(),
                betPlays,
              };

              await betService.sendUserBetPlay(betData);

              Toast.show({
                type: 'success',
                text1: '¡Apuesta enviada!',
                text2: `$${formatAmount(totalBetAmount)} - ${plays.length} jugada${
                  plays.length !== 1 ? 's' : ''
                }`,
                position: 'top',
                topOffset: 60,
                visibilityTime: 5000,
              });

              // Limpiar todo
              setPlays([]);
              setCurrentNumbers('');
              setSelectedTypes(new Set());
              setTypeAmounts({});
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.response?.data?.message || error.message || 'No se pudo enviar la apuesta',
                position: 'top',
                topOffset: 60,
              });
            } finally {
              setIsSending(false);
            }
          },
        },
      ]
    );
  };

  // Formatear monto
  const formatAmount = (amount: number): string => {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  // Estado de tirada
  const throwStatus = useMemo(() => {
    const selectedThrow = throws.find((t) => t.id === selectedThrowId);
    if (!selectedThrow) return null;

    const now = currentTime;
    const endTime = new Date(selectedThrow.endTime);

    if (endTime <= now) {
      return { status: 'closed', color: '#ef4444', text: 'Cerrada' };
    }

    const minutesRemaining = Math.floor((endTime.getTime() - now.getTime()) / (1000 * 60));

    if (minutesRemaining <= 30) {
      return { status: 'urgent', color: '#ef4444', text: `Cierra en ${minutesRemaining}min` };
    } else if (minutesRemaining <= 60) {
      return { status: 'warning', color: '#f59e0b', text: `Cierra en ${minutesRemaining}min` };
    }

    return { status: 'normal', color: '#22c55e', text: 'Abierta' };
  }, [throws, selectedThrowId, currentTime]);

  const totalAmount = plays.reduce((sum, play) => sum + play.totalAmount, 0);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        <Card title="Registrar Apuesta" icon="dice-outline">
          {/* Selección de Lotería */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Lotería</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedLotteryId}
                onValueChange={(value) => setSelectedLotteryId(value)}
                style={styles.picker}
                enabled={!isLoadingLotteries && lotteries.length > 0}
              >
                <Picker.Item label="-- Seleccionar lotería --" value="" />
                {isLoadingLotteries && (
                  <Picker.Item label="Cargando loterías..." value="" enabled={false} />
                )}
                {lotteries.map((lottery) => (
                  <Picker.Item key={lottery.id} label={lottery.name} value={lottery.id} />
                ))}
              </Picker>
            </View>
      </View>
      
          {/* Selección de Tirada */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Tirada</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedThrowId}
                onValueChange={(value) => setSelectedThrowId(value)}
                style={styles.picker}
                enabled={!isLoadingThrows && throws.length > 0 && selectedLotteryId !== ''}
              >
                <Picker.Item label="-- Seleccionar tirada --" value="" />
                {isLoadingThrows && (
                  <Picker.Item label="Cargando tiradas..." value="" enabled={false} />
                )}
                {throws.length === 0 && selectedLotteryId && !isLoadingThrows && (
                  <Picker.Item label="No hay tiradas disponibles" value="" enabled={false} />
                )}
                {throws.map((throwItem) => (
                  <Picker.Item key={throwItem.id} label={throwItem.name} value={throwItem.id} />
                ))}
              </Picker>
            </View>
            {throwStatus && (
              <View style={[styles.statusBadge, { backgroundColor: throwStatus.color }]}>
                <Text style={styles.statusText}>{throwStatus.text}</Text>
              </View>
            )}
          </View>

          {/* Input de Números */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Números (2 o 3 dígitos)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 25 o 123"
              placeholderTextColor={colors.subtleGrey}
              value={currentNumbers}
              onChangeText={setCurrentNumbers}
              keyboardType="number-pad"
              maxLength={3}
            />
    </View>

          {/* Selección de Tipos de Juego */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Tipos de Juego</Text>
            {isLoadingPlayTypes ? (
              <ActivityIndicator size="small" color={colors.primaryGold} />
            ) : (
              <View style={styles.typesGrid}>
                {playTypes.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.typeButton,
                      selectedTypes.has(type.id) && styles.typeButtonSelected,
                      selectedTypes.has(type.id) && {
                        backgroundColor: PLAY_TYPE_COLORS[type.code] || colors.primaryGold,
                        borderColor: PLAY_TYPE_COLORS[type.code] || colors.primaryGold,
                      },
                    ]}
                    onPress={() => toggleType(type.id)}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        selectedTypes.has(type.id) && styles.typeButtonTextSelected,
                      ]}
                    >
                          {type.name}
                        </Text>
                  </TouchableOpacity>
                ))}
                      </View>
                      )}
                    </View>
                    
          {/* Inputs de Montos */}
          {Array.from(selectedTypes).map((typeId) => {
            const type = playTypes.find((t) => t.id === typeId);
            if (!type) return null;

            return (
              <View key={typeId} style={styles.formGroup}>
                <Text style={styles.label}>Monto {type.name}</Text>
                        <TextInput
                  style={styles.input}
                  placeholder="0"
                          placeholderTextColor={colors.subtleGrey}
                  value={typeAmounts[typeId] || ''}
                  onChangeText={(text) => updateTypeAmount(typeId, text)}
                  keyboardType="decimal-pad"
                        />
                      </View>
                );
              })}

          {/* Botón Agregar Jugada */}
          <TouchableOpacity style={styles.addButton} onPress={addPlay}>
            <LinearGradient
              colors={['#22c55e', '#16a34a']}
              style={styles.addButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="add-circle-outline" size={20} color="white" />
              <Text style={styles.addButtonText}>Agregar Jugada</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Lista de Jugadas */}
          {plays.length > 0 && (
            <View style={styles.playsSection}>
              <Text style={styles.playsSectionTitle}>
                Jugadas ({plays.length}) - Total: ${formatAmount(totalAmount)}
            </Text>
              {plays.map((play) => (
                <View key={play.id} style={styles.playItem}>
                  <View style={styles.playItemLeft}>
                    <Text style={styles.playNumbers}>{play.numbers}</Text>
                    <View style={styles.playTypes}>
                      {Object.entries(play.types).map(([typeId, amount]) => {
                        const type = playTypes.find((t) => t.id === typeId);
                  return (
                          <View
                            key={typeId}
                            style={[
                              styles.playTypeBadge,
                              { backgroundColor: PLAY_TYPE_COLORS[type?.code || ''] || colors.primaryGold },
                            ]}
                          >
                            <Text style={styles.playTypeBadgeText}>
                              {type?.name}: ${formatAmount(amount)}
                      </Text>
                    </View>
                  );
                })}
              </View>
                  </View>
                  <View style={styles.playItemRight}>
                    <Text style={styles.playTotal}>${formatAmount(play.totalAmount)}</Text>
                    <TouchableOpacity onPress={() => removePlay(play.id)}>
                      <Ionicons name="trash-outline" size={20} color={colors.primaryRed} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              </View>
          )}
              
          {/* Botón Enviar Apuesta */}
          {plays.length > 0 && (
              <TouchableOpacity
              style={styles.sendButton}
              onPress={sendBet}
              disabled={isSending || !throwStatus || throwStatus.status === 'closed'}
              >
                <LinearGradient
                colors={[colors.primaryGold, colors.primaryRed]}
                style={styles.sendButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                {isSending ? (
                  <ActivityIndicator size="small" color={colors.darkBackground} />
                  ) : (
                    <>
                    <Ionicons name="send-outline" size={24} color={colors.darkBackground} />
                    <Text style={styles.sendButtonText}>
                      Enviar Apuesta - ${formatAmount(totalAmount)}
                    </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
          )}
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
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
  pickerContainer: {
    backgroundColor: colors.darkBackground,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    borderRadius: borderRadius.md,
  },
  picker: {
    color: colors.lightText,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginTop: spacing.sm,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: 'white',
  },
  input: {
    backgroundColor: colors.darkBackground,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.lightText,
  },
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  typeButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.darkBackground,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  typeButtonSelected: {
    borderWidth: 2,
  },
  typeButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.lightText,
  },
  typeButtonTextSelected: {
    color: 'white',
  },
  addButton: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  addButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: 'white',
  },
  playsSection: {
    marginTop: spacing.lg,
    backgroundColor: colors.darkBackground,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  playsSectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primaryGold,
    marginBottom: spacing.md,
  },
  playItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primaryGold,
  },
  playItemLeft: {
    flex: 1,
  },
  playNumbers: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.heavy,
    color: colors.lightText,
    marginBottom: spacing.xs,
  },
  playTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  playTypeBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  playTypeBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: 'white',
  },
  playItemRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  playTotal: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primaryGold,
  },
  sendButton: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginTop: spacing.xl,
  },
  sendButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  sendButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.heavy,
    color: colors.darkBackground,
  },
});

export default RegistrarApuesta;
