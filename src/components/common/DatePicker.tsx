import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../styles/GlobalStyles';

const { width: screenWidth } = Dimensions.get('window');

export interface DatePickerProps {
  value: Date;
  onDateChange: (date: Date) => void;
  placeholder?: string;
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  enabled?: boolean;
  disabled?: boolean;
  style?: any;
  maximumDate?: Date;
  minimumDate?: Date;
  mode?: 'date' | 'time' | 'datetime';
  dateFormat?: 'short' | 'medium' | 'long';
  showIcon?: boolean;
  required?: boolean;
  error?: string;
  helpText?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onDateChange,
  placeholder = 'Seleccionar fecha',
  label,
  icon = 'calendar-outline',
  enabled = true,
  disabled = false,
  style,
  maximumDate,
  minimumDate,
  mode = 'date',
  dateFormat = 'short',
  showIcon = true,
  required = false,
  error,
  helpText,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(value);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (selectedDate) {
        onDateChange(selectedDate);
      }
    } else {
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  };

  const handleConfirm = () => {
    onDateChange(tempDate);
    setShowPicker(false);
  };

  const handleCancel = () => {
    setTempDate(value);
    setShowPicker(false);
  };

  const formatDate = (date: Date): string => {
    if (!date) return placeholder;

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    switch (dateFormat) {
      case 'short':
        return `${day}/${month}/${year}`;
      case 'medium':
        return `${day} ${getMonthName(date.getMonth())} ${year}`;
      case 'long':
        return `${getDayName(date.getDay())}, ${day} ${getMonthName(date.getMonth())} ${year}`;
      default:
        return `${day}/${month}/${year}`;
    }
  };

  const getMonthName = (month: number): string => {
    const months = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];
    return months[month];
  };

  const getDayName = (day: number): string => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return days[day];
  };

  const isDisabled = disabled || !enabled;
  const hasError = !!error;

  const renderPicker = () => {
    if (Platform.OS === 'android') {
      return (
        <DateTimePicker
          value={value}
          mode={mode}
          display="default"
          onChange={handleDateChange}
          maximumDate={maximumDate}
          minimumDate={minimumDate}
        />
      );
    }

    return (
      <Modal
        visible={showPicker}
        transparent
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={handleCancel} style={styles.modalButton}>
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {mode === 'date' ? 'Seleccionar Fecha' : 
                 mode === 'time' ? 'Seleccionar Hora' : 'Seleccionar Fecha y Hora'}
              </Text>
              <TouchableOpacity onPress={handleConfirm} style={styles.modalButton}>
                <Text style={[styles.modalButtonText, styles.modalConfirmText]}>Confirmar</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.pickerContainer}>
              <DateTimePicker
                value={tempDate}
                mode={mode}
                display="spinner"
                onChange={(event, selectedDate) => {
                  if (selectedDate) {
                    setTempDate(selectedDate);
                  }
                }}
                maximumDate={maximumDate}
                minimumDate={minimumDate}
                style={styles.picker}
              />
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.inputContainer,
          isDisabled && styles.inputDisabled,
          hasError && styles.inputError,
        ]}
        onPress={() => !isDisabled && setShowPicker(true)}
        disabled={isDisabled}
      >
        {showIcon && (
          <View style={styles.iconContainer}>
            <Ionicons
              name={icon}
              size={16}
              color={isDisabled ? colors.subtleGrey : colors.primaryGold}
            />
          </View>
        )}

        <View style={styles.textContainer}>
          <Text
            style={[
              styles.inputText,
              isDisabled && styles.inputTextDisabled,
              hasError && styles.inputTextError,
              !value && styles.placeholderText,
            ]}
          >
            {formatDate(value)}
          </Text>
        </View>

        <View style={styles.arrowContainer}>
          <Ionicons
            name="chevron-down"
            size={16}
            color={isDisabled ? colors.subtleGrey : colors.lightText}
          />
        </View>
      </TouchableOpacity>

      {helpText && !hasError && (
        <Text style={styles.helpText}>{helpText}</Text>
      )}

      {hasError && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={14} color={colors.primaryRed} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {showPicker && renderPicker()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  labelContainer: {
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.lightText,
  },
  required: {
    color: colors.primaryRed,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minHeight: 40,
  },
  inputDisabled: {
    backgroundColor: colors.darkBackground,
    borderColor: colors.subtleGrey,
    opacity: 0.6,
  },
  inputError: {
    borderColor: colors.primaryRed,
    borderWidth: 2,
  },
  iconContainer: {
    marginRight: spacing.xs,
  },
  textContainer: {
    flex: 1,
  },
  inputText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.lightText,
  },
  inputTextDisabled: {
    color: colors.subtleGrey,
  },
  inputTextError: {
    color: colors.primaryRed,
  },
  placeholderText: {
    color: colors.subtleGrey,
    fontWeight: fontWeight.normal,
  },
  arrowContainer: {
    marginLeft: spacing.xs,
  },
  helpText: {
    fontSize: fontSize.xs,
    color: colors.subtleGrey,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  errorText: {
    fontSize: fontSize.xs,
    color: colors.primaryRed,
    fontWeight: fontWeight.medium,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.darkBackground,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    paddingTop: spacing.md,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.inputBorder,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.lightText,
    flex: 1,
    textAlign: 'center',
  },
  modalButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  modalButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.subtleGrey,
  },
  modalConfirmText: {
    color: colors.primaryGold,
  },
  pickerContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  picker: {
    width: '100%',
  },
});

export default DatePicker;
