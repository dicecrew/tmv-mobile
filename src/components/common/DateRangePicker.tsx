import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import DatePicker from './DatePicker';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../styles/GlobalStyles';

export interface DateRangePickerProps {
  dateFrom: Date;
  dateTo: Date;
  onDateFromChange: (date: Date) => void;
  onDateToChange: (date: Date) => void;
  onRangeChange?: (dateFrom: Date, dateTo: Date) => void;
  label?: string;
  enabled?: boolean;
  disabled?: boolean;
  style?: any;
  maximumDate?: Date;
  minimumDate?: Date;
  dateFormat?: 'short' | 'medium' | 'long';
  showLabels?: boolean;
  required?: boolean;
  error?: string;
  helpText?: string;
  gap?: 'sm' | 'md' | 'lg';
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onRangeChange,
  label = 'Rango de Fechas',
  enabled = true,
  disabled = false,
  style,
  maximumDate,
  minimumDate,
  dateFormat = 'short',
  showLabels = true,
  required = false,
  error,
  helpText,
  gap = 'md',
}) => {
  const [dateFromError, setDateFromError] = useState<string>('');
  const [dateToError, setDateToError] = useState<string>('');

  // Validar que fecha hasta no sea superior a la fecha actual
  const validateDateTo = (date: Date): string => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Fin del día actual
    
    if (date > today) {
      return 'La fecha hasta no puede ser superior a la fecha actual';
    }
    
    return '';
  };

  // Validar que fecha hasta no sea anterior a fecha desde
  const validateDateRange = (from: Date, to: Date): string => {
    if (to < from) {
      return 'La fecha hasta no puede ser anterior a la fecha desde';
    }
    
    return '';
  };

  const handleDateFromChange = (date: Date) => {
    const toError = validateDateRange(date, dateTo);
    setDateToError(toError);
    setDateFromError('');
    
    onDateFromChange(date);
    
    if (onRangeChange) {
      onRangeChange(date, dateTo);
    }
  };

  const handleDateToChange = (date: Date) => {
    const currentError = validateDateTo(date);
    const rangeError = validateDateRange(dateFrom, date);
    
    setDateToError(currentError || rangeError);
    setDateFromError('');
    
    onDateToChange(date);
    
    if (onRangeChange) {
      onRangeChange(dateFrom, date);
    }
  };

  // Validar fechas al montar el componente
  useEffect(() => {
    const toError = validateDateTo(dateTo);
    const rangeError = validateDateRange(dateFrom, dateTo);
    
    setDateToError(toError || rangeError);
    setDateFromError('');
  }, [dateFrom, dateTo]);

  const isDisabled = disabled || !enabled;
  const hasError = !!error || !!dateFromError || !!dateToError;
  const finalError = error || dateFromError || dateToError;

  const getGapStyle = () => {
    switch (gap) {
      case 'sm':
        return { marginBottom: spacing.sm };
      case 'md':
        return { marginBottom: spacing.md };
      case 'lg':
        return { marginBottom: spacing.lg };
      default:
        return { marginBottom: spacing.md };
    }
  };

  return (
    <View style={[styles.container, style]}>
      {showLabels && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        </View>
      )}

      <View style={styles.dateRangeContainer}>
        <View style={[styles.datePickerContainer, getGapStyle()]}>
          <DatePicker
            value={dateFrom}
            onDateChange={handleDateFromChange}
            placeholder="Fecha desde"
            label={showLabels ? "Fecha Desde" : undefined}
            icon="calendar-outline"
            enabled={enabled}
            disabled={disabled}
            maximumDate={maximumDate}
            minimumDate={minimumDate}
            dateFormat={dateFormat}
            showIcon={true}
            required={required}
            error={dateFromError}
          />
        </View>

        <View style={styles.datePickerContainer}>
          <DatePicker
            value={dateTo}
            onDateChange={handleDateToChange}
            placeholder="Fecha hasta"
            label={showLabels ? "Fecha Hasta" : undefined}
            icon="calendar-outline"
            enabled={enabled}
            disabled={disabled}
            maximumDate={maximumDate}
            minimumDate={minimumDate}
            dateFormat={dateFormat}
            showIcon={true}
            required={required}
            error={dateToError}
          />
        </View>
      </View>

      {helpText && !hasError && (
        <Text style={styles.helpText}>{helpText}</Text>
      )}

      {hasError && finalError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{finalError}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  labelContainer: {
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.lightText,
  },
  required: {
    color: colors.primaryRed,
  },
  dateRangeContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  datePickerContainer: {
    flex: 1,
  },
  helpText: {
    fontSize: fontSize.xs,
    color: colors.subtleGrey,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  errorContainer: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: `${colors.primaryRed}10`,
    borderRadius: borderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primaryRed,
  },
  errorText: {
    fontSize: fontSize.xs,
    color: colors.primaryRed,
    fontWeight: fontWeight.medium,
  },
});

export default DateRangePicker;
