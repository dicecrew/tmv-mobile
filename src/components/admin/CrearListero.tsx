import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Combobox, { ComboboxOption } from '../common/Combobox';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../styles/GlobalStyles';
import Card from '../common/Card';
import Toast from 'react-native-toast-message';
import { bookieService, lotteryService } from '../../api/services';

interface CreateFormData {
  firstName: string;
  lastName: string;
  nickName: string;
  phoneNumber: string;
  password: string;
  pool: string;
  throwPercent: string;
  revenuePercent: string;
  defaultLotteryId: string;
}

interface CrearListeroProps {
  onSuccess?: () => void;
}

const CrearListero: React.FC<CrearListeroProps> = ({ onSuccess }) => {
  const [lotteries, setLotteries] = useState<any[]>([]);
  const [isLoadingLotteries, setIsLoadingLotteries] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [createFormData, setCreateFormData] = useState<CreateFormData>({
    firstName: '',
    lastName: '',
    nickName: '',
    phoneNumber: '',
    password: '',
    pool: '',
    throwPercent: '',
    revenuePercent: '',
    defaultLotteryId: '',
  });

  // Cargar loterías
  const loadLotteries = async () => {
    setIsLoadingLotteries(true);
    try {
      const response = await lotteryService.getActiveLotteries();
      let lotteriesArray: any[] = [];
      
      if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
        lotteriesArray = Object.values(response.data);
      } else if (Array.isArray(response.data)) {
        lotteriesArray = response.data;
      }
      
      setLotteries(lotteriesArray);
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

  useEffect(() => {
    loadLotteries();
  }, []);

  // Validar teléfono
  const validatePhone = (phone: string) => {
    const cleanPhone = phone.replace(/[\s\-()]/g, '');
    const internationalPhoneRegex = /^(\+?[1-9]\d{1,4})?[2-9]\d{6,14}$/;
    
    if (!internationalPhoneRegex.test(cleanPhone)) {
      return {
        isValid: false,
        formatted: cleanPhone,
        error: 'Número de teléfono inválido en formato internacional'
      };
    }

    let formattedPhone = cleanPhone;
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = `+1${formattedPhone}`;
    }

    return { isValid: true, formatted: formattedPhone };
  };

  // Convertir lotteries a opciones del combobox
  const lotteryOptions: ComboboxOption[] = lotteries.map(lottery => ({
    id: lottery.id,
    label: lottery.name,
    value: lottery.id,
  }));

  // Crear listero
  const handleCreateListero = async () => {
    // Validaciones
    if (!createFormData.firstName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'El nombre es requerido',
        position: 'top',
        topOffset: 60,
      });
      return;
    }

    if (!createFormData.lastName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'El apellido es requerido',
        position: 'top',
        topOffset: 60,
      });
      return;
    }

    if (!createFormData.phoneNumber.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'El número de teléfono es requerido',
        position: 'top',
        topOffset: 60,
      });
      return;
    }

    const phoneValidation = validatePhone(createFormData.phoneNumber);
    if (!phoneValidation.isValid) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: phoneValidation.error,
        position: 'top',
        topOffset: 60,
      });
      return;
    }

    if (!createFormData.password.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'La contraseña es requerida',
        position: 'top',
        topOffset: 60,
      });
      return;
    }

    if (createFormData.password.length < 6) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'La contraseña debe tener al menos 6 caracteres',
        position: 'top',
        topOffset: 60,
      });
      return;
    }

    // Confirmación
    Alert.alert(
      '🎯 Crear Nuevo Listero',
      `¿Estás seguro de que quieres crear este listero?\n\n` +
      `👤 Nombre: ${createFormData.firstName} ${createFormData.lastName}\n` +
      `🏷️ Apodo: ${createFormData.nickName || 'Sin apodo'}\n` +
      `📱 Teléfono: ${phoneValidation.formatted}\n` +
      `🎯 Lotería por defecto: ${createFormData.defaultLotteryId ? (lotteries.find(l => l.id === createFormData.defaultLotteryId)?.name || 'N/A') : 'Sin lotería por defecto'}\n` +
      `💰 Fondo: $${parseInt(createFormData.pool || '0').toLocaleString()}\n` +
      `🎯 % Tiro: ${parseFloat(createFormData.throwPercent || '0')}%\n` +
      `💵 % Ingresos: ${parseFloat(createFormData.revenuePercent || '0')}%`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Crear',
          onPress: async () => {
            setLoading(true);
            try {
              const bookieData = {
                firstName: createFormData.firstName.trim(),
                lastName: createFormData.lastName.trim(),
                nickName: createFormData.nickName.trim() || null,
                phoneNumber: phoneValidation.formatted,
                password: createFormData.password,
                defaultLotteryId: createFormData.defaultLotteryId || null,
                pool: 0,
                throwPercent: parseFloat(createFormData.throwPercent || '0') / 100,
                revenuePercent: parseFloat(createFormData.revenuePercent || '0') / 100,
              };

              await bookieService.createBookieWithUser(bookieData);

              Toast.show({
                type: 'success',
                text1: '¡Éxito!',
                text2: `Listero ${createFormData.firstName} ${createFormData.lastName} creado exitosamente`,
                position: 'top',
                topOffset: 60,
                visibilityTime: 5000,
              });

              // Limpiar formulario
              setCreateFormData({
                firstName: '',
                lastName: '',
                nickName: '',
                phoneNumber: '',
                password: '',
                pool: '',
                throwPercent: '',
                revenuePercent: '',
                defaultLotteryId: '',
              });

              // Llamar callback de éxito
              if (onSuccess) {
                setTimeout(() => {
                  onSuccess();
                }, 2000);
              }
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.response?.data?.message || error.message || 'No se pudo crear el listero',
                position: 'top',
                topOffset: 60,
              });
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Card title="Crear Nuevo Listero" icon="person-add-outline" style={styles.card}>
        <Text style={styles.description}>
          Permite registrar nuevos listeros con sus configuraciones de porcentajes y pool inicial.
        </Text>

        <ScrollView style={styles.formContainer}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Nombre *</Text>
            <TextInput
              style={styles.input}
              placeholder="Juan"
              placeholderTextColor={colors.subtleGrey}
              value={createFormData.firstName}
              onChangeText={(text) => setCreateFormData({ ...createFormData, firstName: text })}
              editable={!loading}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Apellido *</Text>
            <TextInput
              style={styles.input}
              placeholder="Pérez"
              placeholderTextColor={colors.subtleGrey}
              value={createFormData.lastName}
              onChangeText={(text) => setCreateFormData({ ...createFormData, lastName: text })}
              editable={!loading}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Apodo (opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="JP"
              placeholderTextColor={colors.subtleGrey}
              value={createFormData.nickName}
              onChangeText={(text) => setCreateFormData({ ...createFormData, nickName: text })}
              editable={!loading}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Teléfono *</Text>
            <TextInput
              style={styles.input}
              placeholder="+56912345678"
              placeholderTextColor={colors.subtleGrey}
              value={createFormData.phoneNumber}
              onChangeText={(text) => setCreateFormData({ ...createFormData, phoneNumber: text })}
              keyboardType="phone-pad"
              editable={!loading}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Contraseña *</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="••••••••"
                placeholderTextColor={colors.subtleGrey}
                value={createFormData.password}
                onChangeText={(text) => setCreateFormData({ ...createFormData, password: text })}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.subtleGrey}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Combobox
              options={lotteryOptions}
              selectedValue={createFormData.defaultLotteryId}
              onValueChange={(value) => setCreateFormData({ ...createFormData, defaultLotteryId: value })}
              placeholder="Sin lotería por defecto"
              loading={isLoadingLotteries}
              loadingText="Cargando loterías..."
              enabled={!loading && !isLoadingLotteries}
              label="Lotería por Defecto"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Porcentaje de Tiro (%)</Text>
            <TextInput
              style={styles.input}
              placeholder="10"
              placeholderTextColor={colors.subtleGrey}
              value={createFormData.throwPercent}
              onChangeText={(text) => setCreateFormData({ ...createFormData, throwPercent: text })}
              keyboardType="decimal-pad"
              editable={!loading}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Porcentaje de Ingresos (%)</Text>
            <TextInput
              style={styles.input}
              placeholder="5"
              placeholderTextColor={colors.subtleGrey}
              value={createFormData.revenuePercent}
              onChangeText={(text) => setCreateFormData({ ...createFormData, revenuePercent: text })}
              keyboardType="decimal-pad"
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleCreateListero}
            disabled={loading}
          >
            <LinearGradient
              colors={['#22c55e', '#16a34a']}
              style={styles.submitButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="person-add-outline" size={20} color="white" />
                  <Text style={styles.submitButtonText}>Crear Listero</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.darkBackground,
  },
  card: {
    margin: spacing.lg,
  },
  description: {
    fontSize: fontSize.md,
    color: colors.subtleGrey,
    marginBottom: spacing.lg,
    lineHeight: 24,
  },
  formContainer: {
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
  input: {
    backgroundColor: colors.darkBackground,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.lightText,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 48,
  },
  passwordToggle: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: spacing.xs,
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
    color: 'white',
  },
});

export default CrearListero;

