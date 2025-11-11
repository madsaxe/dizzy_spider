import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { TimelineZoomProvider } from '../context/TimelineZoomContext';
import TimelineVisualization from '../components/TimelineVisualization';
import timelineService from '../services/timelineService';

const TimelineDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { timelineId } = route.params;
  const { createEra, createEvent, createScene, deleteEra, deleteEvent, deleteScene } = useApp();
  const [timeline, setTimeline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadTimeline = async () => {
    try {
      const timelineData = await timelineService.getTimelineById(timelineId);
      setTimeline(timelineData);
    } catch (error) {
      console.error('Error loading timeline:', error);
      Alert.alert('Error', 'Failed to load timeline');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEra = useCallback(() => {
    navigation.navigate('CreateEra', { timelineId });
  }, [navigation, timelineId]);

  useEffect(() => {
    loadTimeline();
    
    // Add header buttons
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerButtons}>
          <TouchableOpacity
            onPress={() => navigation.navigate('TimelineSettings')}
            style={[styles.headerButton, styles.settingsButton]}
          >
            <Text style={styles.settingsButtonText}>⚙️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleAddEra}
            style={styles.headerButton}
          >
            <Text style={styles.headerButtonText}>+ Add Era</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [timelineId, navigation, handleAddEra]);

  // Refresh when screen comes into focus (e.g., after creating an era)
  useFocusEffect(
    React.useCallback(() => {
      loadTimeline();
      setRefreshKey(prev => prev + 1); // Trigger TimelineVisualization refresh
    }, [timelineId])
  );

  const handleAddEvent = (eraId) => {
    navigation.navigate('CreateEvent', { eraId });
  };

  const handleAddScene = (eventId) => {
    navigation.navigate('CreateScene', { eventId });
  };

  const handleEraEdit = (era) => {
    navigation.navigate('EditEra', { era });
  };

  const handleEventEdit = (event) => {
    navigation.navigate('EditEvent', { event });
  };

  const handleSceneEdit = (scene) => {
    navigation.navigate('EditScene', { scene });
  };

  const handleEraDelete = async (era) => {
    Alert.alert(
      'Delete Era',
      `Are you sure you want to delete "${era.title}"? This will delete all events and scenes within it.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteEra(era.id);
          },
        },
      ]
    );
  };

  const handleEventDelete = async (event) => {
    Alert.alert(
      'Delete Event',
      `Are you sure you want to delete "${event.title}"? This will delete all scenes within it.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteEvent(event.id);
          },
        },
      ]
    );
  };

  const handleSceneDelete = async (scene) => {
    Alert.alert(
      'Delete Scene',
      `Are you sure you want to delete "${scene.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteScene(scene.id);
          },
        },
      ]
    );
  };

  if (loading || !timeline) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading timeline...</Text>
      </View>
    );
  }

  return (
    <TimelineZoomProvider>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{timeline.title}</Text>
          {timeline.description && (
            <Text style={styles.description}>{timeline.description}</Text>
          )}
          <Text style={styles.type}>
            {timeline.isFictional ? '📚 Fictional Timeline' : '📅 Historical Timeline'}
          </Text>
        </View>
        <TimelineVisualization
          key={`timeline-${timelineId}-${refreshKey}`}
          timelineId={timelineId}
          isFictional={timeline.isFictional}
          onAddEra={handleAddEra}
          onAddEvent={handleAddEvent}
          onAddScene={handleAddScene}
          onEraEdit={handleEraEdit}
          onEventEdit={handleEventEdit}
          onSceneEdit={handleSceneEdit}
          onEraDelete={handleEraDelete}
          onEventDelete={handleEventDelete}
          onSceneDelete={handleSceneDelete}
        />
      </View>
    </TimelineZoomProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  type: {
    fontSize: 14,
    color: '#999',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 16,
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  settingsButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  settingsButtonText: {
    color: '#333',
    fontSize: 18,
  },
});

export default TimelineDetailScreen;

