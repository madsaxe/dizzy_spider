import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import TimelineItem from './TimelineItem';
import timelineService from '../services/timelineService';

const TimelineVisualization = ({
  timelineId,
  isFictional = false,
  onEraPress,
  onEventPress,
  onScenePress,
  onEraEdit,
  onEventEdit,
  onSceneEdit,
  onEraDelete,
  onEventDelete,
  onSceneDelete,
  onAddEra,
  onAddEvent,
  onAddScene,
}) => {
  const [eras, setEras] = useState([]);
  const [events, setEvents] = useState({});
  const [scenes, setScenes] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedEras, setExpandedEras] = useState(new Set());
  const [expandedEvents, setExpandedEvents] = useState(new Set());

  useEffect(() => {
    loadTimelineData();
  }, [timelineId]);

  const loadTimelineData = async () => {
    try {
      setLoading(true);
      const timelineEras = await timelineService.getErasByTimelineId(timelineId);
      setEras(timelineEras);

      // Load events for each era
      const eventsMap = {};
      for (const era of timelineEras) {
        const eraEvents = await timelineService.getEventsByEraId(era.id);
        eventsMap[era.id] = eraEvents;

        // Load scenes for each event
        const scenesMap = {};
        for (const event of eraEvents) {
          const eventScenes = await timelineService.getScenesByEventId(event.id);
          scenesMap[event.id] = eventScenes;
        }
        setScenes(prev => ({ ...prev, ...scenesMap }));
      }
      setEvents(eventsMap);
    } catch (error) {
      console.error('Error loading timeline data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleEra = (eraId) => {
    setExpandedEras((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(eraId)) {
        newSet.delete(eraId);
      } else {
        newSet.add(eraId);
      }
      return newSet;
    });
  };

  const toggleEvent = (eventId) => {
    setExpandedEvents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  const handleEraPress = (era) => {
    if (onEraPress) {
      onEraPress(era);
    } else {
      toggleEra(era.id);
    }
  };

  const handleEventPress = (event) => {
    if (onEventPress) {
      onEventPress(event);
    } else {
      toggleEvent(event.id);
    }
  };

  const handleEraDelete = async (era) => {
    if (onEraDelete) {
      await onEraDelete(era);
      await loadTimelineData();
    }
  };

  const handleEventDelete = async (event) => {
    if (onEventDelete) {
      await onEventDelete(event);
      await loadTimelineData();
    }
  };

  const handleSceneDelete = async (scene) => {
    if (onSceneDelete) {
      await onSceneDelete(scene);
      await loadTimelineData();
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading timeline...</Text>
      </View>
    );
  }

  if (eras.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No eras yet. Add your first era to get started!</Text>
        {onAddEra && (
          <TouchableOpacity style={styles.addButton} onPress={onAddEra}>
            <Text style={styles.addButtonText}>Add Era</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={loadTimelineData} />
      }
    >
      {eras.map((era) => {
        const isEraExpanded = expandedEras.has(era.id);
        const eraEvents = events[era.id] || [];

        return (
          <View key={era.id} style={styles.eraContainer}>
            <TimelineItem
              item={era}
              type="era"
              isFictional={isFictional}
              onPress={() => handleEraPress(era)}
              onEdit={() => onEraEdit && onEraEdit(era)}
              onDelete={() => handleEraDelete(era)}
              level={0}
            />
            {isEraExpanded && (
              <View style={styles.childrenContainer}>
                {eraEvents.length === 0 ? (
                  <View style={styles.emptyChildren}>
                    <Text style={styles.emptyChildrenText}>No events yet</Text>
                    {onAddEvent && (
                      <TouchableOpacity
                        style={styles.addChildButton}
                        onPress={() => onAddEvent(era.id)}
                      >
                        <Text style={styles.addChildButtonText}>Add Event</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  eraEvents.map((event) => {
                    const isEventExpanded = expandedEvents.has(event.id);
                    const eventScenes = scenes[event.id] || [];

                    return (
                      <View key={event.id} style={styles.eventContainer}>
                        <TimelineItem
                          item={event}
                          type="event"
                          isFictional={isFictional}
                          onPress={() => handleEventPress(event)}
                          onEdit={() => onEventEdit && onEventEdit(event)}
                          onDelete={() => handleEventDelete(event)}
                          level={1}
                        />
                        {isEventExpanded && (
                          <View style={styles.childrenContainer}>
                            {eventScenes.length === 0 ? (
                              <View style={styles.emptyChildren}>
                                <Text style={styles.emptyChildrenText}>No scenes yet</Text>
                                {onAddScene && (
                                  <TouchableOpacity
                                    style={styles.addChildButton}
                                    onPress={() => onAddScene(event.id)}
                                  >
                                    <Text style={styles.addChildButtonText}>Add Scene</Text>
                                  </TouchableOpacity>
                                )}
                              </View>
                            ) : (
                              eventScenes.map((scene) => (
                                <TimelineItem
                                  key={scene.id}
                                  item={scene}
                                  type="scene"
                                  isFictional={isFictional}
                                  onPress={() => onScenePress && onScenePress(scene)}
                                  onEdit={() => onSceneEdit && onSceneEdit(scene)}
                                  onDelete={() => handleSceneDelete(scene)}
                                  level={2}
                                />
                              ))
                            )}
                          </View>
                        )}
                      </View>
                    );
                  })
                )}
                {onAddEvent && (
                  <TouchableOpacity
                    style={styles.addChildButton}
                    onPress={() => onAddEvent(era.id)}
                  >
                    <Text style={styles.addChildButtonText}>+ Add Event</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        );
      })}
      {onAddEra && (
        <TouchableOpacity style={styles.addButton} onPress={onAddEra}>
          <Text style={styles.addButtonText}>+ Add Era</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  eraContainer: {
    marginBottom: 12,
  },
  eventContainer: {
    marginBottom: 8,
  },
  childrenContainer: {
    marginLeft: 20,
    marginTop: 8,
  },
  emptyChildren: {
    padding: 12,
    alignItems: 'center',
  },
  emptyChildrenText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  addChildButton: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  addChildButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default TimelineVisualization;

