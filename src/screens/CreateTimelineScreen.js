import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { useNavigation } from '@react-navigation/native';
import { validateTimeline } from '../utils/validation';

const CreateTimelineScreen = () => {
  const navigation = useNavigation();
  const { createTimeline } = useApp();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isFictional, setIsFictional] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    const timelineData = {
      title: title.trim(),
      description: description.trim(),
      isFictional,
    };

    const validation = validateTimeline(timelineData);
    if (!validation.valid) {
      Alert.alert('Validation Error', validation.errors.join('\n'));
      return;
    }

    setLoading(true);
    try {
      const { timeline, unlockedAchievements } = await createTimeline(timelineData);
      
      if (unlockedAchievements && unlockedAchievements.length > 0) {
        const achievementNames = unlockedAchievements.map(a => a.name).join(', ');
        Alert.alert(
          'Achievement Unlocked! 🎉',
          `You've unlocked: ${achievementNames}`,
          [
            {
              text: 'Awesome!',
              onPress: () => navigation.navigate('TimelineDetail', { timelineId: timeline.id }),
            },
          ]
        );
      } else {
        navigation.navigate('TimelineDetail', { timelineId: timeline.id });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create timeline. Please try again.');
      console.error('Error creating timeline:', error);
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
          placeholder="Enter timeline title"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Enter timeline description (optional)"
          placeholderTextColor="#999"
          multiline
          numberOfLines={4}
        />

        <View style={styles.switchContainer}>
          <Text style={styles.label}>Fictional Timeline</Text>
          <Switch
            value={isFictional}
            onValueChange={setIsFictional}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={isFictional ? '#007AFF' : '#f4f3f4'}
          />
        </View>
        <Text style={styles.hint}>
          {isFictional
            ? 'This timeline uses fictional time (e.g., "Year 3000", "Before the Great War")'
            : 'This timeline uses real dates (e.g., "January 1, 2024")'}
        </Text>

        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={loading}
        >
          <Text style={styles.createButtonText}>
            {loading ? 'Creating...' : 'Create Timeline'}
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
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
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

export default CreateTimelineScreen;

