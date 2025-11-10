import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import TimeInput from '../components/TimeInput';
import { validateEvent } from '../utils/validation';
import timelineService from '../services/timelineService';

const CreateEventScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { eraId } = route.params;
  const { createEvent } = useApp();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState(null);
  const [useRelativePosition, setUseRelativePosition] = useState(false);
  const [positionRelativeTo, setPositionRelativeTo] = useState(null);
  const [positionType, setPositionType] = useState('after');
  const [availableEvents, setAvailableEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFictional, setIsFictional] = useState(false);

  React.useEffect(() => {
    const loadData = async () => {
      const era = await timelineService.getEraById(eraId);
      if (era) {
        const timeline = await timelineService.getTimelineById(era.timelineId);
        if (timeline) {
          setIsFictional(timeline.isFictional);
        }
        const events = await timelineService.getEventsByEraId(eraId);
        setAvailableEvents(events);
      }
    };
    loadData();
  }, [eraId]);

  const handleCreate = async () => {
    const eventData = {
      eraId,
      title: title.trim(),
      description: description.trim(),
      time: useRelativePosition ? null : (time || null),
      order: 0,
      positionRelativeTo: useRelativePosition ? positionRelativeTo : null,
      positionType: useRelativePosition ? positionType : null,
    };

    const validation = validateEvent(eventData);
    if (!validation.valid) {
      Alert.alert('Validation Error', validation.errors.join('\n'));
      return;
    }

    setLoading(true);
    try {
      const { event, unlockedAchievements } = await createEvent(eventData);
      
      if (unlockedAchievements && unlockedAchievements.length > 0) {
        const achievementNames = unlockedAchievements.map(a => a.name).join(', ');
        Alert.alert('Achievement Unlocked! 🎉', `You've unlocked: ${achievementNames}`);
      }
      
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to create event. Please try again.');
      console.error('Error creating event:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Enter event title"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Enter event description (optional)"
          placeholderTextColor="#999"
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setUseRelativePosition(!useRelativePosition)}
        >
          <Text style={styles.toggleButtonText}>
            {useRelativePosition ? 'Using Relative Position' : 'Using Specific Time'}
          </Text>
        </TouchableOpacity>

        {useRelativePosition ? (
          <View>
            <Text style={styles.label}>Position Relative To *</Text>
            {availableEvents.length === 0 ? (
              <Text style={styles.hint}>No other events in this era yet</Text>
            ) : (
              <>
                {availableEvents.map((event) => (
                  <TouchableOpacity
                    key={event.id}
                    style={[
                      styles.eventOption,
                      positionRelativeTo === event.id && styles.eventOptionSelected,
                    ]}
                    onPress={() => setPositionRelativeTo(event.id)}
                  >
                    <Text
                      style={[
                        styles.eventOptionText,
                        positionRelativeTo === event.id && styles.eventOptionTextSelected,
                      ]}
                    >
                      {event.title}
                    </Text>
                  </TouchableOpacity>
                ))}
                <View style={styles.positionTypeContainer}>
                  <TouchableOpacity
                    style={[
                      styles.positionTypeButton,
                      positionType === 'before' && styles.positionTypeButtonSelected,
                    ]}
                    onPress={() => setPositionType('before')}
                  >
                    <Text
                      style={[
                        styles.positionTypeText,
                        positionType === 'before' && styles.positionTypeTextSelected,
                      ]}
                    >
                      Before
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.positionTypeButton,
                      positionType === 'after' && styles.positionTypeButtonSelected,
                    ]}
                    onPress={() => setPositionType('after')}
                  >
                    <Text
                      style={[
                        styles.positionTypeText,
                        positionType === 'after' && styles.positionTypeTextSelected,
                      ]}
                    >
                      After
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        ) : (
          <TimeInput
            label="Time"
            value={time}
            onChange={setTime}
            isFictional={isFictional}
            placeholder="Enter time"
          />
        )}

        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={loading}
        >
          <Text style={styles.createButtonText}>
            {loading ? 'Creating...' : 'Create Event'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  toggleButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  toggleButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  eventOption: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  eventOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#e3f2fd',
  },
  eventOptionText: {
    fontSize: 16,
    color: '#333',
  },
  eventOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  positionTypeContainer: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
  },
  positionTypeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  positionTypeButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  positionTypeText: {
    fontSize: 16,
    color: '#333',
  },
  positionTypeTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  hint: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 8,
  },
  createButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 32,
  },
  createButtonDisabled: {
    backgroundColor: '#ccc',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default CreateEventScreen;

