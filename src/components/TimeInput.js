import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState('start'); // 'start' or 'end'
  
  // Always use text input for fictional timelines or relational items
  const useTextInput = isFictional || isRelational;

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

  if (mode === 'range') {
    return (
      <View style={styles.container}>
        {label && <Text style={styles.label}>{label}</Text>}
        <View style={styles.rangeContainer}>
          <View style={styles.rangeInput}>
            <Text style={styles.rangeLabel}>Start</Text>
            {useTextInput ? (
              <TextInput
                style={styles.textInput}
                value={startValue || ''}
                onChangeText={handleTextChangeStart}
                placeholder="Enter start time"
                placeholderTextColor="#999"
              />
            ) : (
              <>
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
                <DatePicker
                  modal
                  open={showDatePicker && datePickerMode === 'start'}
                  date={startValue ? new Date(startValue) : new Date()}
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
            <Text style={styles.rangeLabel}>End</Text>
            {useTextInput ? (
              <TextInput
                style={styles.textInput}
                value={endValue || ''}
                onChangeText={handleTextChangeEnd}
                placeholder="Enter end time"
                placeholderTextColor="#999"
              />
            ) : (
              <>
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
                <DatePicker
                  modal
                  open={showDatePicker && datePickerMode === 'end'}
                  date={endValue ? new Date(endValue) : new Date()}
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
      {label && <Text style={styles.label}>{label}</Text>}
      {useTextInput ? (
        <TextInput
          style={styles.textInput}
          value={value || ''}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor="#999"
        />
      ) : (
        <>
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
          <DatePicker
            modal
            open={showDatePicker}
            date={value ? new Date(value) : new Date()}
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
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  dateButton: {
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

