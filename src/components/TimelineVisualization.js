import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import timelineService from '../services/timelineService';
import CardStack from './CardStack';
import { 
  transformToTimelineItems, 
  prepareTimelineData,
  filterByZoomLevel,
  transformForAlternatingTimeline,
} from '../utils/timelineUtils';
import { useTimelineZoom } from '../context/TimelineZoomContext';
import { useTimelineTheme } from '../context/TimelineThemeContext';
import AlternatingTimeline from './AlternatingTimeline';

const TimelineVisualization = forwardRef(({
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
}, ref) => {
  const alternatingTimelineRef = useRef(null);

  useImperativeHandle(ref, () => ({
    scrollToItem: (itemId) => {
      if (alternatingTimelineRef.current) {
        alternatingTimelineRef.current.scrollToItem(itemId);
      }
    },
  }));
  const [eras, setEras] = useState([]);
  const [events, setEvents] = useState({});
  const [scenes, setScenes] = useState({});
  const [loading, setLoading] = useState(true);
  const [timelineData, setTimelineData] = useState([]);
  const [viewMode, setViewMode] = useState('simple'); // 'simple' | 'advanced'
  const [allTimelineItems, setAllTimelineItems] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0); // Used to trigger transition animations
  
  const {
    zoomLevel,
    selectedEraId,
    selectedEraIds,
    selectedEventId,
    selectedEventIds,
    toggleEra,
    toggleEvent,
    zoomIn,
    zoomInEvent,
    zoomOut,
    resetZoom,
    canZoomOut,
    canZoomIn,
  } = useTimelineZoom();

  const { theme, getItemColor, getSymbol } = useTimelineTheme();

  // Animated transition overlay for zoom level changes
  const transitionProgress = useSharedValue(0);
  const transitionColor = useSharedValue(theme.lineColor);
  const previousZoomLevel = useRef(zoomLevel);
  const pendingZoomAction = useRef(null); // Store pending zoom action to execute after animation
  
  // Get screen dimensions and theme values outside of worklet context
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  const centerX = screenWidth / 2;
  const lineWidth = theme.spacing.line || 3;

  // Get color for each zoom level
  const getLevelColor = (level) => {
    switch (level) {
      case 'eras':
        return theme.itemColors.era || theme.lineColor;
      case 'events':
        return theme.itemColors.event || theme.lineColor;
      case 'scenes':
        return theme.itemColors.scene || theme.lineColor;
      default:
        return theme.lineColor;
    }
  };

  // Execute pending zoom action when transition reaches full screen
  const executePendingZoom = useCallback(() => {
    if (pendingZoomAction.current) {
      const action = pendingZoomAction.current;
      pendingZoomAction.current = null;
      
      if (action.type === 'zoomIn') {
        zoomIn(action.eraId);
      } else if (action.type === 'zoomInEvent') {
        zoomInEvent(action.eventId);
      } else if (action.type === 'zoomOut') {
        zoomOut();
      } else if (action.type === 'resetZoom') {
        resetZoom();
      }
    }
  }, [zoomIn, zoomInEvent, zoomOut, resetZoom]);

  // Trigger transition animation when pending zoom action is set (only for advanced view)
  useEffect(() => {
    // Only run transition animation in advanced view mode
    if (viewMode !== 'advanced') {
      // Simple view doesn't use transition animations - zoom is executed directly
      return;
    }

    // If there's a pending zoom action, start the transition (advanced view only)
    if (pendingZoomAction.current) {
      const targetLevel = pendingZoomAction.current.type === 'resetZoom' ? 'eras' :
                          pendingZoomAction.current.type === 'zoomOut' ? 
                            (zoomLevel === 'scenes' ? 'events' : 'eras') :
                          pendingZoomAction.current.type === 'zoomIn' ? 'events' :
                          pendingZoomAction.current.type === 'zoomInEvent' ? 'scenes' : zoomLevel;
      
      const previousColor = getLevelColor(zoomLevel);
      const nextColor = getLevelColor(targetLevel);
      
      transitionColor.value = previousColor;
      transitionProgress.value = 0;
      
      // Animate to full screen (expand) - first 60% of animation
      // Use bounce easing: slow start, speeds up, bounces into position
      // Total duration: 2000ms (2 seconds)
      transitionProgress.value = withTiming(0.6, {
        duration: 1200, // 60% of 2000ms for expansion
        easing: Easing.out(Easing.bounce),
      }, () => {
        // After expansion completes (full screen coverage), execute pending zoom action
        runOnJS(executePendingZoom)();
        
        // Change color to next level
        transitionColor.value = nextColor;
        
        // Then fade out as container background takes over
        transitionProgress.value = withTiming(1, {
          duration: 800, // Remaining 40% of 2000ms for fade out
          easing: Easing.in(Easing.ease),
        }, () => {
          // Reset for next transition
          transitionProgress.value = 0;
        });
      });
    }
  }, [refreshKey, zoomLevel, theme, executePendingZoom, viewMode]);

  // Update previousZoomLevel when zoom level changes (after transition completes)
  useEffect(() => {
    if (previousZoomLevel.current !== zoomLevel && !pendingZoomAction.current) {
      previousZoomLevel.current = zoomLevel;
    }
  }, [zoomLevel]);

  // Animated style for transition overlay
  const transitionOverlayStyle = useAnimatedStyle(() => {
    // Calculate width: starts at line width, expands to full screen
    // Once expanded (progress > 0.6), stay at full width
    const minWidth = lineWidth;
    const maxWidth = screenWidth;
    const expandProgress = Math.min(transitionProgress.value / 0.6, 1); // Clamp to 1.0 at 60% progress
    const width = minWidth + (maxWidth - minWidth) * expandProgress;
    
    // Calculate left position to keep centered
    const left = centerX - width / 2;
    
    // Opacity: full when expanding (0-0.6), fade out after color change (0.6-1.0)
    const expandPhase = transitionProgress.value <= 0.6;
    const opacity = expandPhase ? 1 : 1 - ((transitionProgress.value - 0.6) / 0.4);
    
    return {
      position: 'absolute',
      left,
      top: 0,
      width,
      height: screenHeight,
      backgroundColor: transitionColor.value,
      zIndex: 1000,
      opacity: opacity > 0 ? opacity : 0,
    };
  });
  
  // Container background color based on zoom level (not animated, changes instantly)
  const containerBackgroundColor = getLevelColor(zoomLevel);

  useEffect(() => {
    loadTimelineData();
  }, [timelineId]);

  useEffect(() => {
    // Transform data whenever eras, events, or scenes change
    if (eras.length > 0 || Object.keys(events).length > 0) {
      const items = transformToTimelineItems(eras, events, scenes, isFictional);
      setAllTimelineItems(items);
      
      // Filter based on zoom level
      // For H-shape layout (simple view), include parent items so they remain visible
      let filteredItems;
      if (viewMode === 'simple') {
        // H-shape: show all levels simultaneously
        if (zoomLevel === 'events') {
          // Show all Eras + Events for all selected Eras
          filteredItems = items.filter(item => 
            item.type === 'era' || 
            (item.type === 'event' && selectedEraIds.has(item.eraId))
          );
        } else if (zoomLevel === 'scenes') {
          // Show all Eras + Events for all selected Eras + Scenes for all selected Events
          filteredItems = items.filter(item => 
            item.type === 'era' || 
            (item.type === 'event' && selectedEraIds.has(item.eraId)) ||
            (item.type === 'scene' && selectedEventIds.has(item.eventId))
          );
        } else {
          // Show only Eras
          filteredItems = items.filter(item => item.type === 'era');
        }
      } else {
        // Advanced view: use standard filtering
        filteredItems = filterByZoomLevel(items, zoomLevel, selectedEraId, selectedEventId);
      }
      
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

    // Handle toggle behavior for Eras
    if (itemType === 'era') {
      const isCurrentlySelected = selectedEraIds.has(itemData.id);
      
      // If clicking an Era that's already selected, toggle it off
      if (isCurrentlySelected) {
        if (viewMode === 'advanced') {
          // For advanced view, we need to handle zoom out if this was the only selected Era
          if (selectedEraIds.size === 1) {
            pendingZoomAction.current = { type: 'zoomOut' };
            setRefreshKey(prev => prev + 1);
          } else {
            toggleEra(itemData.id);
          }
        } else {
          toggleEra(itemData.id);
        }
        return;
      }
      
      // If clicking a new Era, check for overlap with existing Scenes
      if (zoomLevel === 'scenes' && selectedEventIds.size > 0) {
        // Get all Events for this Era
        const eraEvents = events[itemData.id] || [];
        // Get all Events that have Scenes visible
        const eventsWithScenes = Array.from(selectedEventIds);
        // Check if any of the new Era's Events would overlap with existing Scenes
        // (Events from the same Era would be at the same X positions)
        // For now, we'll remove all Events that have Scenes visible if they're from a different Era
        // This is a simple approach - we could make it more sophisticated later
        const overlappingEventIds = eventsWithScenes.filter(eventId => {
          const event = Object.values(events).flat().find(e => e.id === eventId);
          return event && event.eraId !== itemData.id;
        });
        
        // Remove overlapping Events from selection
        if (overlappingEventIds.length > 0) {
          overlappingEventIds.forEach(eventId => {
            toggleEvent(eventId);
          });
        }
      }
      
      // Toggle the Era (add it to selection)
      if (viewMode === 'advanced') {
        pendingZoomAction.current = { type: 'zoomIn', eraId: itemData.id };
        setRefreshKey(prev => prev + 1);
      } else {
        toggleEra(itemData.id);
      }
      return;
    }
    
    // Handle toggle behavior for Events
    if (itemType === 'event') {
      const isCurrentlySelected = selectedEventIds.has(itemData.id);
      
      // If clicking an Event that's already selected, toggle it off
      if (isCurrentlySelected) {
        if (viewMode === 'advanced') {
          // For advanced view, we need to handle zoom out if this was the only selected Event
          if (selectedEventIds.size === 1) {
            pendingZoomAction.current = { type: 'zoomOut' };
            setRefreshKey(prev => prev + 1);
          } else {
            toggleEvent(itemData.id);
          }
        } else {
          toggleEvent(itemData.id);
        }
        return;
      }
      
      // Toggle the Event (add it to selection)
      if (viewMode === 'advanced') {
        pendingZoomAction.current = { type: 'zoomInEvent', eventId: itemData.id };
        setRefreshKey(prev => prev + 1);
      } else {
        toggleEvent(itemData.id);
      }
      return;
    }

    // Handle regular press callbacks (for scenes or when not zooming)
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

  const handleTimelineEventEdit = (event) => {
    const originalData = event._originalData || event;
    if (!originalData) return;

    const itemData = originalData.data || originalData;
    const itemType = originalData.type || event.type;

    // Handle edit callbacks
    switch (itemType) {
      case 'era':
        if (onEraEdit) {
          onEraEdit(itemData);
        }
        break;
      case 'event':
        if (onEventEdit) {
          onEventEdit(itemData);
        }
        break;
      case 'scene':
        if (onSceneEdit) {
          onSceneEdit(itemData);
        }
        break;
    }
  };

  const getBreadcrumbItems = () => {
    const items = [];
    
    // Always start with "Timeline" - goes back to eras view
    items.push({ 
      label: 'Timeline', 
      onPress: () => {
        if (viewMode === 'advanced') {
          // Advanced view: Store pending zoom action and trigger transition animation
          pendingZoomAction.current = { type: 'resetZoom' };
          setRefreshKey(prev => prev + 1);
        } else {
          // Simple view: Execute zoom immediately without animation
          resetZoom();
        }
      }, 
      isActive: zoomLevel === 'eras' 
    });
    
    if (zoomLevel === 'events' || zoomLevel === 'scenes') {
      const era = eras.find(e => e.id === selectedEraId);
      if (era) {
        items.push({ 
          label: era.title, 
          onPress: zoomLevel === 'scenes' ? () => {
            if (viewMode === 'advanced') {
              // Advanced view: Store pending zoom action and trigger transition animation
              pendingZoomAction.current = { type: 'zoomOut' };
              setRefreshKey(prev => prev + 1);
            } else {
              // Simple view: Execute zoom immediately without animation
              zoomOut();
            }
          } : null, // Go back to events if at scenes
          isActive: zoomLevel === 'events' 
        });
      }
    }
    
    if (zoomLevel === 'scenes') {
      const event = Object.values(events).flat().find(e => e.id === selectedEventId);
      if (event) {
        items.push({ 
          label: event.title, 
          onPress: null, // Current level, no navigation
          isActive: true 
        });
      }
    }
    
    return items;
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

  const breadcrumbItems = getBreadcrumbItems();

  return (
    <View style={[styles.container, { backgroundColor: containerBackgroundColor }]}>
      {/* Breadcrumb Navigation, Add Button, and View Toggle */}
      <View style={styles.controlsBar}>
        <View style={styles.breadcrumbContainer}>
          {breadcrumbItems.map((item, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <Text style={styles.breadcrumbSeparator}> / </Text>
              )}
              <TouchableOpacity
                onPress={item.onPress}
                disabled={!item.onPress || item.isActive}
                style={styles.breadcrumbItem}
              >
                <Text
                  style={[
                    styles.breadcrumbText,
                    item.isActive && styles.breadcrumbTextActive,
                    !item.onPress && styles.breadcrumbTextDisabled
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>
        <View style={styles.controlsRight}>
          {/* Context-aware Add Button */}
          {zoomLevel === 'eras' && onAddEra && (
            <TouchableOpacity
              style={[styles.addButtonNav, styles.addButtonNavMargin]}
              onPress={onAddEra}
            >
              <Text style={styles.addButtonNavText}>+ Add Era</Text>
            </TouchableOpacity>
          )}
          {zoomLevel === 'events' && selectedEraId && onAddEvent && (
            <TouchableOpacity
              style={[styles.addButtonNav, styles.addButtonNavMargin]}
              onPress={() => onAddEvent(selectedEraId)}
            >
              <Text style={styles.addButtonNavText}>+ Add Event</Text>
            </TouchableOpacity>
          )}
          {zoomLevel === 'scenes' && selectedEventId && onAddScene && (
            <TouchableOpacity
              style={[styles.addButtonNav, styles.addButtonNavMargin]}
              onPress={() => onAddScene(selectedEventId)}
            >
              <Text style={styles.addButtonNavText}>+ Add Scene</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.viewToggle}
            onPress={() => setViewMode(viewMode === 'simple' ? 'advanced' : 'simple')}
          >
            <Text style={styles.viewToggleText}>
              {viewMode === 'simple' ? 'Advanced' : 'Simple'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

            {/* Timeline Content */}
            <View style={[styles.timelineContainer, { backgroundColor: viewMode === 'advanced' ? containerBackgroundColor : theme.backgroundColor }]}>
              {/* Transition Overlay - animated background that expands from center timeline (advanced view only) */}
              {viewMode === 'advanced' && (
                <Animated.View style={transitionOverlayStyle} />
              )}
              
              {viewMode === 'advanced' ? (
                <AlternatingTimeline
                  ref={alternatingTimelineRef}
                  data={timelineData}
                  onItemPress={handleTimelineEventPress}
                  onItemEdit={handleTimelineEventEdit}
                  onRefresh={loadTimelineData}
                  refreshing={loading}
                  lineColor={theme.lineColor}
                  lineWidth={theme.spacing.line}
                  colors={theme.itemColors}
                  symbols={theme.symbols}
                  showImages={true}
                  fontSizes={theme.fontSizes}
                  spacing={theme.spacing}
                  isFictional={isFictional}
                  footerComponent={null}
                  />
              ) : (
                <CardStack
                  data={timelineData}
                  onItemPress={handleTimelineEventPress}
                  onItemEdit={handleTimelineEventEdit}
                  colors={theme.itemColors}
                  showImages={true}
                  fontSizes={theme.fontSizes}
                  onRefresh={loadTimelineData}
                  refreshing={loading}
                  events={events}
                  scenes={scenes}
                  zoomLevel={zoomLevel}
                  selectedEraId={selectedEraId}
                  selectedEraIds={selectedEraIds}
                  selectedEventId={selectedEventId}
                  selectedEventIds={selectedEventIds}
                />
              )}
            </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#1A1A2E',
  },
  controlsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#0F0F1E',
    borderBottomWidth: 0.5,
    borderBottomColor: '#2A2A3E',
  },
  breadcrumbContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexWrap: 'wrap',
  },
  breadcrumbItem: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  breadcrumbText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8B5CF6',
    letterSpacing: -0.2,
  },
  breadcrumbTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  breadcrumbTextDisabled: {
    color: '#9CA3AF',
  },
  breadcrumbSeparator: {
    fontSize: 13,
    color: '#6B7280',
    marginHorizontal: 4,
  },
  controlsRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonNavMargin: {
    marginRight: 8,
  },
  addButtonNav: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#8B5CF6',
    borderRadius: 10,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  addButtonNavText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  viewToggle: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#1A1A2E',
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: '#2A2A3E',
  },
  viewToggleText: {
    color: '#8B5CF6',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.1,
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
    color: '#E0E0E0',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#E0E0E0',
    textAlign: 'center',
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#8B5CF6',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    margin: 16,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  addChildButton: {
    backgroundColor: '#1A1A2E',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#8B5CF6',
    borderStyle: 'dashed',
  },
  addChildButtonText: {
    color: '#8B5CF6',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});

export default TimelineVisualization;


