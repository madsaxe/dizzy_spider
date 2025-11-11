import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import { Text, TextInput, Button, useTheme } from 'react-native-paper';
import DatePicker from 'react-native-date-picker';

const TimeInput = ({
  value,
  onChange,
  isFictional = false,
  isRelational = false, // New prop to indicate relative positioning
  placeholder = 'Enter time',
  label = 'Time',
  mode = 'single', // 'single', 'range'
  onStartTimeChange,
  onEndTimeChange,
  startValue,
  endValue,
}) => {
  const theme = useTheme();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState('start'); // 'start' or 'end'
  
  // For fictional timelines, use manual date entry
  const useManualEntry = isFictional && !isRelational;
  
  // Parse date string to year, month, day
  const parseDate = (dateString) => {
    if (!dateString) return { year: '', month: '', day: '' };
    try {
      const date = new Date(dateString);
      return {
        year: date.getFullYear().toString(),
        month: (date.getMonth() + 1).toString().padStart(2, '0'),
        day: date.getDate().toString().padStart(2, '0'),
      };
    } catch {
      return { year: '', month: '', day: '' };
    }
  };

  // Format year, month, day to ISO date string
  const formatDate = (year, month, day) => {
    if (!year || !month || !day) return null;
    try {
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (isNaN(date.getTime())) return null;
      return date.toISOString();
    } catch {
      return null;
    }
  };

  // Manual entry state for fictional timelines
  const [startYear, setStartYear] = useState('');
  const [startMonth, setStartMonth] = useState('');
  const [startDay, setStartDay] = useState('');
  const [endYear, setEndYear] = useState('');
  const [endMonth, setEndMonth] = useState('');
  const [endDay, setEndDay] = useState('');

  useEffect(() => {
    if (mode === 'range' && useManualEntry) {
      const start = parseDate(startValue);
      setStartYear(start.year);
      setStartMonth(start.month);
      setStartDay(start.day);
      const end = parseDate(endValue);
      setEndYear(end.year);
      setEndMonth(end.month);
      setEndDay(end.day);
    } else if (mode === 'single' && useManualEntry) {
      const parsed = parseDate(value);
      setStartYear(parsed.year);
      setStartMonth(parsed.month);
      setStartDay(parsed.day);
    }
  }, [startValue, endValue, value, mode, useManualEntry]);

  const handleTextChange = (text) => {
    if (mode === 'single') {
      onChange(text);
    }
  };

  const handleTextChangeStart = (text) => {
    if (onStartTimeChange) {
      onStartTimeChange(text);
    }
  };

  const handleTextChangeEnd = (text) => {
    if (onEndTimeChange) {
      onEndTimeChange(text);
    }
  };

  const handleDateChange = (date) => {
    if (mode === 'single') {
      // Set time to midnight for date-only
      const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      onChange(dateOnly.toISOString());
      setShowDatePicker(false);
    }
  };

  const handleStartDateChange = (date) => {
    if (onStartTimeChange) {
      // Set time to midnight for date-only
      const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      onStartTimeChange(dateOnly.toISOString());
    }
  };

  const handleEndDateChange = (date) => {
    if (onEndTimeChange) {
      // Set time to midnight for date-only
      const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      onEndTimeChange(dateOnly.toISOString());
    }
  };

  // Manual entry handlers for fictional timelines
  const handleManualStartChange = (field, text) => {
    let newYear = startYear;
    let newMonth = startMonth;
    let newDay = startDay;
    
    if (field === 'year') {
      newYear = text.replace(/[^0-9]/g, '').slice(0, 4);
      setStartYear(newYear);
    } else if (field === 'month') {
      newMonth = text.replace(/[^0-9]/g, '').slice(0, 2);
      if (parseInt(newMonth) > 12) newMonth = '12';
      setStartMonth(newMonth);
    } else if (field === 'day') {
      newDay = text.replace(/[^0-9]/g, '').slice(0, 2);
      if (parseInt(newDay) > 31) newDay = '31';
      setStartDay(newDay);
    }
    
    const dateString = formatDate(newYear, newMonth, newDay);
    if (onStartTimeChange && dateString) {
      onStartTimeChange(dateString);
    }
  };

  const handleManualEndChange = (field, text) => {
    let newYear = endYear;
    let newMonth = endMonth;
    let newDay = endDay;
    
    if (field === 'year') {
      newYear = text.replace(/[^0-9]/g, '').slice(0, 4);
      setEndYear(newYear);
    } else if (field === 'month') {
      newMonth = text.replace(/[^0-9]/g, '').slice(0, 2);
      if (parseInt(newMonth) > 12) newMonth = '12';
      setEndMonth(newMonth);
    } else if (field === 'day') {
      newDay = text.replace(/[^0-9]/g, '').slice(0, 2);
      if (parseInt(newDay) > 31) newDay = '31';
      setEndDay(newDay);
    }
    
    const dateString = formatDate(newYear, newMonth, newDay);
    if (onEndTimeChange && dateString) {
      onEndTimeChange(dateString);
    }
  };

  const handleManualSingleChange = (field, text) => {
    let newYear = startYear;
    let newMonth = startMonth;
    let newDay = startDay;
    
    if (field === 'year') {
      newYear = text.replace(/[^0-9]/g, '').slice(0, 4);
      setStartYear(newYear);
    } else if (field === 'month') {
      newMonth = text.replace(/[^0-9]/g, '').slice(0, 2);
      if (parseInt(newMonth) > 12) newMonth = '12';
      setStartMonth(newMonth);
    } else if (field === 'day') {
      newDay = text.replace(/[^0-9]/g, '').slice(0, 2);
      if (parseInt(newDay) > 31) newDay = '31';
      setStartDay(newDay);
    }
    
    const dateString = formatDate(newYear, newMonth, newDay);
    if (onChange && dateString) {
      onChange(dateString);
    }
  };

  if (mode === 'range') {
    return (
      <View style={styles.container}>
        {label && <Text variant="titleMedium" style={styles.label}>{label}</Text>}
        <View style={styles.rangeContainer}>
          <View style={styles.rangeInput}>
            <Text variant="labelLarge" style={styles.rangeLabel}>Start</Text>
            {useManualEntry ? (
              <View style={styles.manualDateContainer}>
                <View style={styles.manualDateField}>
                  <Text variant="labelSmall" style={styles.manualDateLabel}>Year</Text>
                  <TextInput
                    mode="outlined"
                    value={startYear}
                    onChangeText={(text) => handleManualStartChange('year', text)}
                    placeholder="YYYY"
                    keyboardType="numeric"
                    style={styles.manualDateInput}
                    contentStyle={{ textAlign: 'center' }}
                  />
                </View>
                <View style={styles.manualDateField}>
                  <Text variant="labelSmall" style={styles.manualDateLabel}>Month</Text>
                  <TextInput
                    mode="outlined"
                    value={startMonth}
                    onChangeText={(text) => handleManualStartChange('month', text)}
                    placeholder="MM"
                    keyboardType="numeric"
                    style={styles.manualDateInput}
                    contentStyle={{ textAlign: 'center' }}
                  />
                </View>
                <View style={styles.manualDateField}>
                  <Text variant="labelSmall" style={styles.manualDateLabel}>Day</Text>
                  <TextInput
                    mode="outlined"
                    value={startDay}
                    onChangeText={(text) => handleManualStartChange('day', text)}
                    placeholder="DD"
                    keyboardType="numeric"
                    style={styles.manualDateInput}
                    contentStyle={{ textAlign: 'center' }}
                  />
                </View>
              </View>
            ) : isRelational ? (
              <TextInput
                mode="outlined"
                value={startValue || ''}
                onChangeText={handleTextChangeStart}
                placeholder="Enter start time"
                style={styles.textInput}
              />
            ) : (
              <>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setDatePickerMode('start');
                    setShowDatePicker(true);
                  }}
                  style={styles.dateButton}
                >
                  {startValue
                    ? new Date(startValue).toLocaleDateString()
                    : 'Select start date'}
                </Button>
                <DatePicker
                  modal
                  open={showDatePicker && datePickerMode === 'start'}
                  date={startValue ? new Date(startValue) : new Date()}
                  mode="date"
                  onConfirm={(date) => {
                    handleStartDateChange(date);
                    setShowDatePicker(false);
                  }}
                  onCancel={() => setShowDatePicker(false)}
                />
              </>
            )}
          </View>
          <View style={styles.rangeInput}>
            <Text variant="labelLarge" style={styles.rangeLabel}>End</Text>
            {useManualEntry ? (
              <View style={styles.manualDateContainer}>
                <View style={styles.manualDateField}>
                  <Text variant="labelSmall" style={styles.manualDateLabel}>Year</Text>
                  <TextInput
                    mode="outlined"
                    value={endYear}
                    onChangeText={(text) => handleManualEndChange('year', text)}
                    placeholder="YYYY"
                    keyboardType="numeric"
                    style={styles.manualDateInput}
                    contentStyle={{ textAlign: 'center' }}
                  />
                </View>
                <View style={styles.manualDateField}>
                  <Text variant="labelSmall" style={styles.manualDateLabel}>Month</Text>
                  <TextInput
                    mode="outlined"
                    value={endMonth}
                    onChangeText={(text) => handleManualEndChange('month', text)}
                    placeholder="MM"
                    keyboardType="numeric"
                    style={styles.manualDateInput}
                    contentStyle={{ textAlign: 'center' }}
                  />
                </View>
                <View style={styles.manualDateField}>
                  <Text variant="labelSmall" style={styles.manualDateLabel}>Day</Text>
                  <TextInput
                    mode="outlined"
                    value={endDay}
                    onChangeText={(text) => handleManualEndChange('day', text)}
                    placeholder="DD"
                    keyboardType="numeric"
                    style={styles.manualDateInput}
                    contentStyle={{ textAlign: 'center' }}
                  />
                </View>
              </View>
            ) : isRelational ? (
              <TextInput
                mode="outlined"
                value={endValue || ''}
                onChangeText={handleTextChangeEnd}
                placeholder="Enter end time"
                style={styles.textInput}
              />
            ) : (
              <>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setDatePickerMode('end');
                    setShowDatePicker(true);
                  }}
                  style={styles.dateButton}
                >
                  {endValue
                    ? new Date(endValue).toLocaleDateString()
                    : 'Select end date'}
                </Button>
                <DatePicker
                  modal
                  open={showDatePicker && datePickerMode === 'end'}
                  date={endValue ? new Date(endValue) : new Date()}
                  mode="date"
                  onConfirm={(date) => {
                    handleEndDateChange(date);
                    setShowDatePicker(false);
                  }}
                  onCancel={() => setShowDatePicker(false)}
                />
              </>
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {label && <Text variant="titleMedium" style={styles.label}>{label}</Text>}
      {useManualEntry ? (
        <View style={styles.manualDateContainer}>
          <View style={styles.manualDateField}>
            <Text variant="labelSmall" style={styles.manualDateLabel}>Year</Text>
            <TextInput
              mode="outlined"
              value={startYear}
              onChangeText={(text) => handleManualSingleChange('year', text)}
              placeholder="YYYY"
              keyboardType="numeric"
              style={styles.manualDateInput}
              contentStyle={{ textAlign: 'center' }}
            />
          </View>
          <View style={styles.manualDateField}>
            <Text variant="labelSmall" style={styles.manualDateLabel}>Month</Text>
            <TextInput
              mode="outlined"
              value={startMonth}
              onChangeText={(text) => handleManualSingleChange('month', text)}
              placeholder="MM"
              keyboardType="numeric"
              style={styles.manualDateInput}
              contentStyle={{ textAlign: 'center' }}
            />
          </View>
          <View style={styles.manualDateField}>
            <Text variant="labelSmall" style={styles.manualDateLabel}>Day</Text>
            <TextInput
              mode="outlined"
              value={startDay}
              onChangeText={(text) => handleManualSingleChange('day', text)}
              placeholder="DD"
              keyboardType="numeric"
              style={styles.manualDateInput}
              contentStyle={{ textAlign: 'center' }}
            />
          </View>
        </View>
      ) : isRelational ? (
        <TextInput
          mode="outlined"
          value={value || ''}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          style={styles.textInput}
        />
      ) : (
        <>
          <Button
            mode="outlined"
            onPress={() => setShowDatePicker(true)}
            style={styles.dateButton}
          >
            {value
              ? new Date(value).toLocaleDateString()
              : 'Select date'}
          </Button>
          <DatePicker
            modal
            open={showDatePicker}
            date={value ? new Date(value) : new Date()}
            mode="date"
            onConfirm={handleDateChange}
            onCancel={() => setShowDatePicker(false)}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    marginBottom: 8,
  },
  textInput: {
    marginBottom: 8,
  },
  dateButton: {
    marginBottom: 8,
  },
  rangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rangeInput: {
    flex: 1,
    marginHorizontal: 4,
  },
  rangeLabel: {
    marginBottom: 4,
  },
  manualDateContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  manualDateField: {
    flex: 1,
  },
  manualDateLabel: {
    marginBottom: 4,
  },
  manualDateInput: {
    marginBottom: 0,
  },
});

export default TimeInput;

