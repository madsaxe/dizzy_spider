import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { PinchGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Timeline from 'react-native-timeline-flatlist';
import timelineService from '../services/timelineService';
import { 
  transformToTimelineItems, 
  prepareTimelineData,
  filterByZoomLevel,
  transformForAlternatingTimeline,
} from '../utils/timelineUtils';
import { useTimelineZoom } from '../context/TimelineZoomContext';
import { useTimelineTheme } from '../context/TimelineThemeContext';
import AlternatingTimeline from './AlternatingTimeline';

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
  const [timelineData, setTimelineData] = useState([]);
  const [viewMode, setViewMode] = useState('simple'); // 'simple' | 'advanced'
  const [allTimelineItems, setAllTimelineItems] = useState([]);
  
  const {
    zoomLevel,
    selectedEraId,
    selectedEventId,
    zoomIn,
    zoomInEvent,
    zoomOut,
    resetZoom,
    canZoomOut,
    canZoomIn,
  } = useTimelineZoom();

  const { theme, getItemColor, getSymbol } = useTimelineTheme();

  // Pinch gesture for zoom
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  const pinchHandler = useAnimatedGestureHandler({
    onStart: (_, ctx) => {
      ctx.startScale = savedScale.value;
    },
    onActive: (event, ctx) => {
      scale.value = ctx.startScale * event.scale;
    },
    onEnd: () => {
      savedScale.value = scale.value;
      // Reset if scale is too small or too large
      if (scale.value < 0.5) {
        scale.value = withSpring(0.5);
        savedScale.value = 0.5;
      } else if (scale.value > 2) {
        scale.value = withSpring(2);
        savedScale.value = 2;
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  useEffect(() => {
    loadTimelineData();
  }, [timelineId]);

  useEffect(() => {
    // Transform data whenever eras, events, or scenes change
    if (eras.length > 0 || Object.keys(events).length > 0) {
      const items = transformToTimelineItems(eras, events, scenes, isFictional);
      setAllTimelineItems(items);
      
      // Filter based on zoom level
      const filteredItems = filterByZoomLevel(items, zoomLevel, selectedEraId, selectedEventId);
      
      if (viewMode === 'advanced') {
        // Format for alternating timeline
        const alternatingData = transformForAlternatingTimeline(filteredItems);
        setTimelineData(alternatingData);
      } else {
        // Format for simple timeline
        const formattedData = prepareTimelineData(filteredItems);
        setTimelineData(formattedData);
      }
    } else {
      setTimelineData([]);
      setAllTimelineItems([]);
    }
  }, [eras, events, scenes, isFictional, zoomLevel, selectedEraId, selectedEventId, viewMode]);

  const loadTimelineData = async () => {
    try {
      setLoading(true);
      const timelineEras = await timelineService.getErasByTimelineId(timelineId);
      setEras(timelineEras);

      // Load events for each era
      const eventsMap = {};
      const scenesMap = {};
      for (const era of timelineEras) {
        const eraEvents = await timelineService.getEventsByEraId(era.id);
        eventsMap[era.id] = eraEvents;

        // Load scenes for each event
        for (const event of eraEvents) {
          const eventScenes = await timelineService.getScenesByEventId(event.id);
          scenesMap[event.id] = eventScenes;
        }
      }
      setEvents(eventsMap);
      setScenes(scenesMap);
    } catch (error) {
      console.error('Error loading timeline data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTimelineEventPress = (event, index) => {
    const originalData = event._originalData || event;
    if (!originalData) return;

    const itemData = originalData.data || originalData;
    const itemType = originalData.type || event.type;

    // Handle zoom in for eras and events
    if (viewMode === 'advanced') {
      if (itemType === 'era' && zoomLevel === 'eras') {
        zoomIn(itemData.id);
        return;
      } else if (itemType === 'event' && zoomLevel === 'events') {
        zoomInEvent(itemData.id);
        return;
      }
    }

    // Handle regular press callbacks
    switch (itemType) {
      case 'era':
        if (onEraPress) {
          onEraPress(itemData);
        }
        break;
      case 'event':
        if (onEventPress) {
          onEventPress(itemData);
        }
        break;
      case 'scene':
        if (onScenePress) {
          onScenePress(itemData);
        }
        break;
    }
  };

  const getBreadcrumbText = () => {
    if (zoomLevel === 'eras') return 'Eras';
    if (zoomLevel === 'events') {
      const era = eras.find(e => e.id === selectedEraId);
      return era ? `Events: ${era.title}` : 'Events';
    }
    if (zoomLevel === 'scenes') {
      const event = Object.values(events).flat().find(e => e.id === selectedEventId);
      return event ? `Scenes: ${event.title}` : 'Scenes';
    }
    return 'Timeline';
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

  const renderDetail = (rowData, sectionID, rowID) => {
    const originalData = rowData._originalData;
    if (!originalData) return null;

    const item = originalData.data;
    const itemType = originalData.type;

    return (
      <View style={styles.timelineDetail}>
        <View style={styles.timelineDetailHeader}>
          <Text style={styles.timelineDetailTitle}>{rowData.title}</Text>
          <View style={styles.timelineDetailActions}>
            {itemType === 'era' && onEraEdit && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onEraEdit(item)}
              >
                <Text style={styles.actionText}>Edit</Text>
              </TouchableOpacity>
            )}
            {itemType === 'event' && onEventEdit && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onEventEdit(item)}
              >
                <Text style={styles.actionText}>Edit</Text>
              </TouchableOpacity>
            )}
            {itemType === 'scene' && onSceneEdit && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onSceneEdit(item)}
              >
                <Text style={styles.actionText}>Edit</Text>
              </TouchableOpacity>
            )}
            {itemType === 'era' && onEraDelete && (
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleEraDelete(item)}
              >
                <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
              </TouchableOpacity>
            )}
            {itemType === 'event' && onEventDelete && (
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleEventDelete(item)}
              >
                <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
              </TouchableOpacity>
            )}
            {itemType === 'scene' && onSceneDelete && (
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleSceneDelete(item)}
              >
                <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        {rowData.description && (
          <Text style={styles.timelineDetailDescription}>{rowData.description}</Text>
        )}
        <Text style={styles.timelineDetailTime}>{rowData.time}</Text>
        
        {/* Add action buttons for creating child items */}
        {itemType === 'era' && onAddEvent && (
          <TouchableOpacity
            style={styles.addChildButton}
            onPress={() => onAddEvent(item.id)}
          >
            <Text style={styles.addChildButtonText}>+ Add Event to this Era</Text>
          </TouchableOpacity>
        )}
        {itemType === 'event' && onAddScene && (
          <TouchableOpacity
            style={styles.addChildButton}
            onPress={() => onAddScene(item.id)}
          >
            <Text style={styles.addChildButtonText}>+ Add Scene to this Event</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

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
    <View style={styles.container}>
      {/* Zoom Controls and View Toggle */}
      <View style={styles.controlsBar}>
        <View style={styles.zoomControls}>
          <Text style={styles.breadcrumb}>{getBreadcrumbText()}</Text>
          {canZoomOut && (
            <TouchableOpacity style={styles.zoomButton} onPress={zoomOut}>
              <Text style={styles.zoomButtonText}>← Back</Text>
            </TouchableOpacity>
          )}
          {zoomLevel !== 'eras' && (
            <TouchableOpacity style={styles.zoomButton} onPress={resetZoom}>
              <Text style={styles.zoomButtonText}>Reset</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.viewToggle}
          onPress={() => setViewMode(viewMode === 'simple' ? 'advanced' : 'simple')}
        >
          <Text style={styles.viewToggleText}>
            {viewMode === 'simple' ? 'Advanced' : 'Simple'}
          </Text>
        </TouchableOpacity>
      </View>

            {/* Timeline Content */}
            <PinchGestureHandler onGestureEvent={pinchHandler} enabled={viewMode === 'advanced'}>
              <Animated.View style={[styles.timelineContainer, viewMode === 'advanced' && animatedStyle]}>
                {viewMode === 'advanced' ? (
            <AlternatingTimeline
              data={timelineData}
              onItemPress={handleTimelineEventPress}
              onRefresh={loadTimelineData}
              refreshing={loading}
              lineColor={theme.lineColor}
              lineWidth={theme.spacing.line}
              colors={theme.itemColors}
              symbols={theme.symbols}
              showImages={true}
              fontSizes={theme.fontSizes}
              spacing={theme.spacing}
              footerComponent={
                onAddEra ? (
                  <TouchableOpacity style={styles.addButton} onPress={onAddEra}>
                    <Text style={styles.addButtonText}>+ Add Era</Text>
                  </TouchableOpacity>
                ) : null
              }
            />
          ) : (
            <Timeline
              data={timelineData}
              circleSize={20}
              timeContainerStyle={{ minWidth: 100, maxWidth: 100 }}
              timeStyle={[styles.timeStyle, { backgroundColor: theme.lineColor }]}
              descriptionStyle={[styles.descriptionStyle, { fontSize: theme.fontSizes.description }]}
              titleStyle={[styles.titleStyle, { fontSize: theme.fontSizes.title }]}
              detailContainerStyle={styles.detailContainer}
              onEventPress={handleTimelineEventPress}
              renderDetail={renderDetail}
              refreshControl={
                <RefreshControl refreshing={loading} onRefresh={loadTimelineData} />
              }
              ListFooterComponent={
                onAddEra ? (
                  <TouchableOpacity style={styles.addButton} onPress={onAddEra}>
                    <Text style={styles.addButtonText}>+ Add Era</Text>
                  </TouchableOpacity>
                ) : null
              }
              options={{
                style: { paddingTop: 5, paddingLeft: 5, paddingRight: 5 },
              }}
                  />
                )}
              </Animated.View>
            </PinchGestureHandler>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  controlsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  zoomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  breadcrumb: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 12,
  },
  zoomButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#007AFF',
    borderRadius: 6,
    marginRight: 8,
  },
  zoomButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  viewToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
  },
  viewToggleText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
  },
  timelineContainer: {
    flex: 1,
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
  timeStyle: {
    textAlign: 'center',
    color: 'white',
    padding: 5,
    borderRadius: 13,
  },
  descriptionStyle: {
    color: '#666',
    fontSize: 14,
  },
  titleStyle: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  detailContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  timelineDetail: {
    padding: 8,
  },
  timelineDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timelineDetailTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    flex: 1,
  },
  timelineDetailActions: {
    flexDirection: 'row',
  },
  actionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
  },
  deleteButton: {
    backgroundColor: '#ffebee',
  },
  actionText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  deleteText: {
    color: '#FF3B30',
  },
  timelineDetailDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  timelineDetailTime: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    margin: 16,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  addChildButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  addChildButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default TimelineVisualization;

