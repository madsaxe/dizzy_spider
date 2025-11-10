import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
} from 'react-native';
import DatePicker from 'react-native-date-picker';
import { isValidDate } from '../utils/timeUtils';

const TimeInput = ({
  value,
  onChange,
  isFictional = false,
  placeholder = 'Enter time',
  label = 'Time',
  mode = 'single', // 'single', 'range'
  onStartTimeChange,
  onEndTimeChange,
  startValue,
  endValue,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState('start'); // 'start' or 'end'
  const [inputMode, setInputMode] = useState('text'); // 'text' or 'date'
  const [isFictionalMode, setIsFictionalMode] = useState(
    isFictional || (value && !isValidDate(value))
  );

  const handleTextChange = (text) => {
    if (mode === 'single') {
      onChange(text);
    }
  };

  const handleDateChange = (date) => {
    if (mode === 'single') {
      onChange(date.toISOString());
      setShowDatePicker(false);
    }
  };

  const handleStartDateChange = (date) => {
    if (onStartTimeChange) {
      onStartTimeChange(date.toISOString());
    }
  };

  const handleEndDateChange = (date) => {
    if (onEndTimeChange) {
      onEndTimeChange(date.toISOString());
    }
  };

  const toggleInputMode = () => {
    setInputMode(inputMode === 'text' ? 'date' : 'text');
    setIsFictionalMode(inputMode === 'date');
  };

  if (mode === 'range') {
    return (
      <View style={styles.container}>
        {label && <Text style={styles.label}>{label}</Text>}
        <View style={styles.rangeContainer}>
          <View style={styles.rangeInput}>
            <Text style={styles.rangeLabel}>Start</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => {
                setDatePickerMode('start');
                setShowDatePicker(true);
              }}
            >
              <Text style={styles.dateButtonText}>
                {startValue
                  ? new Date(startValue).toLocaleDateString()
                  : 'Select start date'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.rangeInput}>
            <Text style={styles.rangeLabel}>End</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => {
                setDatePickerMode('end');
                setShowDatePicker(true);
              }}
            >
              <Text style={styles.dateButtonText}>
                {endValue
                  ? new Date(endValue).toLocaleDateString()
                  : 'Select end date'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <DatePicker
          modal
          open={showDatePicker}
          date={
            datePickerMode === 'start'
              ? (startValue ? new Date(startValue) : new Date())
              : (endValue ? new Date(endValue) : new Date())
          }
          onConfirm={(date) => {
            if (datePickerMode === 'start') {
              handleStartDateChange(date);
            } else {
              handleEndDateChange(date);
            }
            setShowDatePicker(false);
          }}
          onCancel={() => setShowDatePicker(false)}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputContainer}>
        {isFictionalMode ? (
          <TextInput
            style={styles.textInput}
            value={value || ''}
            onChangeText={handleTextChange}
            placeholder={placeholder}
            placeholderTextColor="#999"
          />
        ) : (
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateButtonText}>
              {value
                ? new Date(value).toLocaleDateString()
                : 'Select date'}
            </Text>
          </TouchableOpacity>
        )}
        {!isFictional && (
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={toggleInputMode}
          >
            <Text style={styles.toggleButtonText}>
              {isFictionalMode ? 'Use Date' : 'Use Text'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <DatePicker
        modal
        open={showDatePicker}
        date={value ? new Date(value) : new Date()}
        onConfirm={handleDateChange}
        onCancel={() => setShowDatePicker(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  dateButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  toggleButton: {
    marginLeft: 8,
    padding: 8,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  toggleButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    color: '#666',
  },
});

export default TimeInput;

