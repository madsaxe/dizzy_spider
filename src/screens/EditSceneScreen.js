import React, { useState, useEffect } from 'react';
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
import { validateScene } from '../utils/validation';
import timelineService from '../services/timelineService';

const EditSceneScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { scene } = route.params;
  const { updateScene } = useApp();
  const [title, setTitle] = useState(scene.title || '');
  const [description, setDescription] = useState(scene.description || '');
  const [time, setTime] = useState(scene.time || null);
  const [useRelativePosition, setUseRelativePosition] = useState(!scene.time && scene.positionRelativeTo);
  const [positionRelativeTo, setPositionRelativeTo] = useState(scene.positionRelativeTo || null);
  const [positionType, setPositionType] = useState(scene.positionType || 'after');
  const [availableScenes, setAvailableScenes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFictional, setIsFictional] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const event = await timelineService.getEventById(scene.eventId);
      if (event) {
        const era = await timelineService.getEraById(event.eraId);
        if (era) {
          const timeline = await timelineService.getTimelineById(era.timelineId);
          if (timeline) {
            setIsFictional(timeline.isFictional);
          }
        }
        const scenes = await timelineService.getScenesByEventId(scene.eventId);
        setAvailableScenes(scenes.filter(s => s.id !== scene.id));
      }
    };
    loadData();
  }, [scene.eventId, scene.id]);

  const handleUpdate = async () => {
    const sceneData = {
      title: title.trim(),
      description: description.trim(),
      time: useRelativePosition ? null : (time || null),
      positionRelativeTo: useRelativePosition ? positionRelativeTo : null,
      positionType: useRelativePosition ? positionType : null,
    };

    const validation = validateScene({ ...scene, ...sceneData });
    if (!validation.valid) {
      Alert.alert('Validation Error', validation.errors.join('\n'));
      return;
    }

    setLoading(true);
    try {
      await updateScene(scene.id, sceneData);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to update scene. Please try again.');
      console.error('Error updating scene:', error);
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
          placeholder="Enter scene title"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Enter scene description (optional)"
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
            {availableScenes.length === 0 ? (
              <Text style={styles.hint}>No other scenes in this event</Text>
            ) : (
              <>
                {availableScenes.map((scn) => (
                  <TouchableOpacity
                    key={scn.id}
                    style={[
                      styles.sceneOption,
                      positionRelativeTo === scn.id && styles.sceneOptionSelected,
                    ]}
                    onPress={() => setPositionRelativeTo(scn.id)}
                  >
                    <Text
                      style={[
                        styles.sceneOptionText,
                        positionRelativeTo === scn.id && styles.sceneOptionTextSelected,
                      ]}
                    >
                      {scn.title}
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
          style={[styles.updateButton, loading && styles.updateButtonDisabled]}
          onPress={handleUpdate}
          disabled={loading}
        >
          <Text style={styles.updateButtonText}>
            {loading ? 'Updating...' : 'Update Scene'}
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
  sceneOption: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  sceneOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#e3f2fd',
  },
  sceneOptionText: {
    fontSize: 16,
    color: '#333',
  },
  sceneOptionTextSelected: {
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
  updateButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 32,
  },
  updateButtonDisabled: {
    backgroundColor: '#ccc',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default EditSceneScreen;

