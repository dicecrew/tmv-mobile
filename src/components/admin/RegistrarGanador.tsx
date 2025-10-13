import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../styles/GlobalStyles';
import Card from '../common/Card';
import Toast from 'react-native-toast-message';
import { throwService, adminService } from '../../api/services';

interface Throw {
  id: string;
  name: string;
  lotteryName: string;
}

interface ProgressData {
  stepIndex: number;
  percent: number;
  message: string;
  state: string;
  steps: string[];
}

const RegistrarGanador: React.FC = () => {
  const [inactiveThrows, setInactiveThrows] = useState<Throw[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedThrowId, setSelectedThrowId] = useState('');
  const [winningNumber1, setWinningNumber1] = useState(''); // Centena (3 dígitos)
  const [winningNumber2, setWinningNumber2] = useState(''); // Corrido 1 (2 dígitos)
  const [winningNumber3, setWinningNumber3] = useState(''); // Corrido 2 (2 dígitos)

  // Estados de polling
  const [operationId, setOperationId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cargar tiradas inactivas
  const loadInactiveThrows = async () => {
    setIsLoading(true);
    try {
      const response = await throwService.getInactiveThrows();
      
      let throwsArray: any[] = [];
      if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
        throwsArray = Object.values(response.data);
      } else if (Array.isArray(response.data)) {
        throwsArray = response.data;
      }
      
      setInactiveThrows(throwsArray);
    } catch (error) {
      console.error('Error loading inactive throws:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudieron cargar las tiradas',
        position: 'top',
        topOffset: 60,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInactiveThrows();
  }, []);

  // Polling de estado
  const checkOperationStatus = async () => {
    if (!operationId) return;

    try {
      const response = await adminService.getRegisterWinningNumbersStatus(operationId);
      const progress = response.data;
      
      console.log('📊 Progress update:', progress);
      setProgressData(progress);

      // Verificar si terminó
      const isCompleted = progress.percent === 100 && progress.stepIndex === 5 && progress.state === 2;
      
      if (progress.state === 'Succeeded' || progress.state === 'Failed' || isCompleted) {
        console.log('🏁 Operación terminada:', progress.state);
        setIsProcessing(false);
        
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }

        setTimeout(() => {
          setShowProgressModal(false);
          resetForm();
          
          if (progress.state === 'Succeeded' || isCompleted) {
            Toast.show({
              type: 'success',
              text1: '¡Éxito!',
              text2: 'Números ganadores registrados y cuadratura completada',
              position: 'top',
              topOffset: 60,
              visibilityTime: 6000,
            });
          } else if (progress.state === 'Failed') {
            Toast.show({
              type: 'error',
              text1: 'Error',
              text2: 'Error al registrar números ganadores',
              position: 'top',
              topOffset: 60,
              visibilityTime: 6000,
            });
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Error checking status:', error);
    }
  };

  // Iniciar polling cuando hay operationId
  useEffect(() => {
    if (operationId && isProcessing) {
      console.log('🔄 Iniciando polling para:', operationId);
      
      // Primer check inmediato
      setTimeout(() => checkOperationStatus(), 1000);
      
      // Polling cada 2 segundos
      pollingIntervalRef.current = setInterval(() => {
        checkOperationStatus();
      }, 2000);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      };
    }
  }, [operationId, isProcessing]);

  // Resetear formulario
  const resetForm = () => {
    setSelectedThrowId('');
    setWinningNumber1('');
    setWinningNumber2('');
    setWinningNumber3('');
    setOperationId(null);
    setIsProcessing(false);
    setProgressData(null);
  };

  // Registrar números ganadores
  const handleSetWinningNumbers = () => {
    if (!selectedThrowId || (!winningNumber1 && !winningNumber2 && !winningNumber3)) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Seleccione una tirada y al menos un número ganador',
        position: 'top',
        topOffset: 60,
      });
      return;
    }

    const selectedThrow = inactiveThrows.find((t) => t.id === selectedThrowId);
    if (!selectedThrow) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'La tirada seleccionada no es válida',
        position: 'top',
        topOffset: 60,
      });
      return;
    }

    const numbersDisplay = [];
    if (winningNumber1) numbersDisplay.push(`Centena: ${winningNumber1.padStart(3, '0')}`);
    if (winningNumber2) numbersDisplay.push(`Corrido 1: ${winningNumber2.padStart(2, '0')}`);
    if (winningNumber3) numbersDisplay.push(`Corrido 2: ${winningNumber3.padStart(2, '0')}`);

    Alert.alert(
      '🏆 CONFIRMAR NÚMEROS GANADORES',
      `${selectedThrow.lotteryName?.toUpperCase()} - ${selectedThrow.name}\n\n` +
      `Números a registrar:\n${numbersDisplay.join('\n')}\n\n` +
      `⚠️ ADVERTENCIA IMPORTANTE\n\n` +
      `Esta publicación es IRREVERSIBLE. El sistema realizará automáticamente la cuadratura de todos los listeros.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar',
          style: 'destructive',
          onPress: async () => {
            const requestData = {
              throwId: selectedThrowId,
              date: new Date().toISOString(),
              centena: parseInt(winningNumber1) || 0,
              corrido1: parseInt(winningNumber2) || 0,
              corrido2: parseInt(winningNumber3) || 0,
            };

            console.log('Registrando Números Ganadores:', requestData);

            try {
              setIsProcessing(true);
              const response = await adminService.registerWinningNumbers(requestData);

              console.log('Response:', response);

              if (response?.data?.operationId) {
                const receivedOperationId = String(response.data.operationId).trim();
                
                if (!receivedOperationId || receivedOperationId.length === 0) {
                  throw new Error('OperationId inválido recibido del servidor');
                }

                console.log('✅ Operation ID recibido:', receivedOperationId);
                setOperationId(receivedOperationId);
                
                setTimeout(() => {
                  setShowProgressModal(true);
                }, 1000);
              } else {
                throw new Error('No se recibió operationId del servidor');
              }
            } catch (error: any) {
              console.error('Error al registrar números ganadores:', error);
              setIsProcessing(false);

              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'Error al iniciar el proceso de registro',
                position: 'top',
                topOffset: 60,
              });
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Card title="Registrar Ganador" icon="trophy-outline" style={styles.card}>
        <Text style={styles.description}>
          Registra los números ganadores para las tiradas de las loterías activas.
        </Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>
            <Ionicons name="megaphone-outline" size={16} color={colors.lightText} />  Seleccionar Tirada *
          </Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedThrowId}
              onValueChange={(value) => setSelectedThrowId(value)}
              style={styles.picker}
              enabled={!isLoading && !isProcessing && inactiveThrows.length > 0}
            >
              <Picker.Item label="-- Seleccione una tirada --" value="" />
              {isLoading && (
                <Picker.Item label="Cargando tiradas..." value="" enabled={false} />
              )}
              {!isLoading && inactiveThrows.length === 0 && (
                <Picker.Item label="No hay tiradas inactivas" value="" enabled={false} />
              )}
              {inactiveThrows.map((throwItem) => (
                <Picker.Item
                  key={throwItem.id}
                  label={`${throwItem.lotteryName?.toUpperCase()} - ${throwItem.name}`}
                  value={throwItem.id}
                />
              ))}
            </Picker>
          </View>
        </View>

        {selectedThrowId && (
          <>
            <View style={styles.numbersGrid}>
              <View style={styles.numberInputGroup}>
                <Text style={styles.numberLabel}>
                  <Ionicons name="trophy-outline" size={14} color={colors.primaryGold} /> Centena (3 dig.)
                </Text>
                <TextInput
                  style={styles.numberInput}
                  placeholder="000"
                  placeholderTextColor={colors.subtleGrey}
                  maxLength={3}
                  value={winningNumber1}
                  onChangeText={(text) => setWinningNumber1(text.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                  editable={!isProcessing}
                />
              </View>

              <View style={styles.numberInputGroup}>
                <Text style={styles.numberLabel}>
                  <Ionicons name="trophy-outline" size={14} color={colors.primaryGold} /> Corrido 1 (2 dig.)
                </Text>
                <TextInput
                  style={styles.numberInput}
                  placeholder="00"
                  placeholderTextColor={colors.subtleGrey}
                  maxLength={2}
                  value={winningNumber2}
                  onChangeText={(text) => setWinningNumber2(text.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                  editable={!isProcessing}
                />
              </View>

              <View style={styles.numberInputGroup}>
                <Text style={styles.numberLabel}>
                  <Ionicons name="trophy-outline" size={14} color={colors.primaryGold} /> Corrido 2 (2 dig.)
                </Text>
                <TextInput
                  style={styles.numberInput}
                  placeholder="00"
                  placeholderTextColor={colors.subtleGrey}
                  maxLength={2}
                  value={winningNumber3}
                  onChangeText={(text) => setWinningNumber3(text.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                  editable={!isProcessing}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSetWinningNumbers}
              disabled={loading || isProcessing}
            >
              <LinearGradient
                colors={[colors.primaryGold, colors.primaryRed]}
                style={styles.submitButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {isProcessing ? (
                  <>
                    <ActivityIndicator size="small" color={colors.darkBackground} />
                    <Text style={styles.submitButtonText}>Procesando...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="trophy-outline" size={20} color={colors.darkBackground} />
                    <Text style={styles.submitButtonText}>Publicar Números Ganadores</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.warningBox}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primaryGold} />
          <Text style={styles.warningText}>
            Al publicar los números ganadores, el sistema realizará la "cuadratura" de los listeros, calculando ganancias y deudas.
          </Text>
        </View>
      </Card>

      {/* Modal de Progreso */}
      <Modal
        visible={showProgressModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          if (!isProcessing) {
            setShowProgressModal(false);
          }
        }}
      >
        <View style={styles.progressModalOverlay}>
          <View style={styles.progressModalContent}>
            <View style={styles.progressHeader}>
              <Ionicons name="trophy" size={24} color={colors.primaryGold} />
              <Text style={styles.progressTitle}>Registrando Números Ganadores</Text>
            </View>

            {operationId && (
              <Text style={styles.operationId}>ID: {operationId.substring(0, 8)}...</Text>
            )}

            {progressData && (
              <>
                {/* Barra de progreso */}
                <View style={styles.progressSection}>
                  <View style={styles.progressInfo}>
                    <Text style={styles.progressPercent}>{progressData.percent}%</Text>
                    <Text style={styles.progressMessage}>
                      {progressData.message || 'Iniciando proceso...'}
                    </Text>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <View 
                      style={[styles.progressBar, { width: `${progressData.percent}%` }]} 
                    />
                  </View>
                </View>

                {/* Pasos */}
                <View style={styles.stepsSection}>
                  <Text style={styles.stepsTitle}>Progreso del Proceso</Text>
                  {progressData.steps && progressData.steps.map((step, index) => (
                    <View key={index} style={styles.stepItem}>
                      <View
                        style={[
                          styles.stepIcon,
                          index < progressData.stepIndex && styles.stepIconCompleted,
                          index === progressData.stepIndex && styles.stepIconCurrent,
                          index > progressData.stepIndex && styles.stepIconPending,
                        ]}
                      >
                        {index < progressData.stepIndex && (
                          <Ionicons name="checkmark" size={14} color="white" />
                        )}
                        {index === progressData.stepIndex && (
                          <ActivityIndicator size="small" color={colors.darkBackground} />
                        )}
                        {index > progressData.stepIndex && (
                          <Ionicons name="time-outline" size={14} color={colors.subtleGrey} />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.stepText,
                          index < progressData.stepIndex && styles.stepTextCompleted,
                          index === progressData.stepIndex && styles.stepTextCurrent,
                          index > progressData.stepIndex && styles.stepTextPending,
                        ]}
                      >
                        {step}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Footer */}
                <View style={styles.progressFooter}>
                  <View style={styles.statusIndicator}>
                    {isProcessing && (
                      <>
                        <ActivityIndicator size="small" color={colors.primaryGold} />
                        <Text style={[styles.statusText, styles.statusProcessing]}>Procesando...</Text>
                      </>
                    )}
                    {!isProcessing && progressData.state === 'Succeeded' && (
                      <>
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                        <Text style={[styles.statusText, styles.statusSuccess]}>Completado</Text>
                      </>
                    )}
                    {!isProcessing && progressData.state === 'Failed' && (
                      <>
                        <Ionicons name="close-circle" size={16} color="#EF4444" />
                        <Text style={[styles.statusText, styles.statusError]}>Error</Text>
                      </>
                    )}
                  </View>
                  {isProcessing && (
                    <TouchableOpacity
                      style={styles.cancelProcessButton}
                      onPress={() => {
                        setIsProcessing(false);
                        setShowProgressModal(false);
                        resetForm();
                        Toast.show({
                          type: 'info',
                          text1: 'Proceso Cancelado',
                          text2: 'Cancelado por el usuario',
                          position: 'top',
                          topOffset: 60,
                        });
                      }}
                    >
                      <Text style={styles.cancelProcessButtonText}>Cancelar Proceso</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  description: {
    fontSize: fontSize.sm,
    color: colors.subtleGrey,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  formGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.lightText,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
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
  numbersGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginVertical: spacing.lg,
  },
  numberInputGroup: {
    flex: 1,
    backgroundColor: colors.darkBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
  },
  numberLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.subtleGrey,
    textAlign: 'center',
  },
  numberInput: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: fontWeight.heavy,
    color: colors.primaryGold,
    backgroundColor: colors.inputBackground,
    borderWidth: 2,
    borderColor: colors.primaryGold,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    width: 80,
  },
  submitButton: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginTop: spacing.lg,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  submitButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.darkBackground,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: `${colors.primaryGold}1A`,
    borderWidth: 2,
    borderColor: `${colors.primaryGold}33`,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  warningText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.primaryGold,
    lineHeight: 18,
  },
  // Modal de Progreso
  progressModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  progressModalContent: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 500,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  progressTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primaryGold,
  },
  operationId: {
    fontSize: fontSize.xs,
    color: colors.subtleGrey,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    backgroundColor: colors.darkBackground,
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.lg,
  },
  progressSection: {
    marginBottom: spacing.xl,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  progressPercent: {
    fontSize: 28,
    fontWeight: fontWeight.heavy,
    color: colors.primaryGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  progressMessage: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.lightText,
    textAlign: 'right',
    marginLeft: spacing.md,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.inputBorder,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primaryGold,
    borderRadius: 4,
  },
  stepsSection: {
    marginBottom: spacing.xl,
  },
  stepsTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.lightText,
    marginBottom: spacing.md,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  stepIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIconCompleted: {
    backgroundColor: '#10B981',
  },
  stepIconCurrent: {
    backgroundColor: colors.primaryGold,
  },
  stepIconPending: {
    backgroundColor: colors.inputBorder,
  },
  stepText: {
    flex: 1,
    fontSize: fontSize.sm,
  },
  stepTextCompleted: {
    color: '#10B981',
  },
  stepTextCurrent: {
    color: colors.primaryGold,
    fontWeight: fontWeight.semibold,
  },
  stepTextPending: {
    color: colors.subtleGrey,
  },
  progressFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.inputBorder,
    paddingTop: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  statusProcessing: {
    color: colors.primaryGold,
  },
  statusSuccess: {
    color: '#10B981',
  },
  statusError: {
    color: '#EF4444',
  },
  cancelProcessButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  cancelProcessButtonText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: 'white',
  },
});

export default RegistrarGanador;
