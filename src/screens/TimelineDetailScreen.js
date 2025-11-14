import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Modal,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Button, IconButton, useTheme } from 'react-native-paper';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { TimelineZoomProvider, useTimelineZoom } from '../context/TimelineZoomContext';
import TimelineVisualization from '../components/TimelineVisualization';
import timelineService from '../services/timelineService';
import { getLocalImage, hasLocalImage } from '../assets/images';
import sharingService from '../services/sharingService';
import { useAuth } from '../context/AuthContext';
import Share from 'react-native-share';

const TimelineDetailScreenContent = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { timelineId } = route.params;
  const { user } = useAuth();
  const { createEra, createEvent, createScene, deleteEra, deleteEvent, deleteScene } = useApp();
  const { zoomLevel, selectedEraId, selectedEventId, zoomIn, zoomInEvent, resetZoom } = useTimelineZoom();
  const [timeline, setTimeline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [menuVisible, setMenuVisible] = useState(false);
  const [navMenuVisible, setNavMenuVisible] = useState(false);
  const [expandedEras, setExpandedEras] = useState({});
  const [expandedEvents, setExpandedEvents] = useState({});
  const [eras, setEras] = useState([]);
  const [events, setEvents] = useState({});
  const [scenes, setScenes] = useState({});
  const timelineVisualizationRef = useRef(null);
  const [headerImageUrl, setHeaderImageUrl] = useState(null);

  // Update header image when drilling into an item
  useEffect(() => {
    const updateHeaderImage = async () => {
      if (zoomLevel === 'events' && selectedEraId) {
        const selectedEra = eras.find(e => e.id === selectedEraId);
        setHeaderImageUrl(selectedEra?.imageUrl || null);
      } else if (zoomLevel === 'scenes' && selectedEventId) {
        const selectedEvent = events[selectedEraId]?.find(e => e.id === selectedEventId);
        setHeaderImageUrl(selectedEvent?.imageUrl || null);
      } else {
        setHeaderImageUrl(null);
      }
    };
    updateHeaderImage();
  }, [zoomLevel, selectedEraId, selectedEventId, eras, events]);

  const loadTimeline = async () => {
    try {
      const timelineData = await timelineService.getTimelineById(timelineId);
      setTimeline(timelineData);
      
      // Load timeline items for menu
      const timelineEras = await timelineService.getErasByTimelineId(timelineId);
      setEras(timelineEras);
      
      const eventsMap = {};
      const scenesMap = {};
      for (const era of timelineEras) {
        const eraEvents = await timelineService.getEventsByEraId(era.id);
        eventsMap[era.id] = eraEvents;
        for (const event of eraEvents) {
          const eventScenes = await timelineService.getScenesByEventId(event.id);
          scenesMap[event.id] = eventScenes;
        }
      }
      setEvents(eventsMap);
      setScenes(scenesMap);
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
  }, [timelineId, navigation]);

  // Refresh when screen comes into focus (e.g., after creating an era)
  useFocusEffect(
    React.useCallback(() => {
      loadTimeline();
      setRefreshKey(prev => prev + 1); // Trigger TimelineVisualization refresh
    }, [timelineId])
  );

  const renderMenuItems = () => {
    if (zoomLevel === 'eras') {
      return eras.map((era) => (
        <TouchableOpacity
          key={era.id}
          style={styles.menuItem}
          onPress={() => {
            zoomIn(era.id);
            setMenuVisible(false);
          }}
        >
          <Text variant="bodyLarge" style={styles.menuItemText}>{era.title}</Text>
        </TouchableOpacity>
      ));
    } else if (zoomLevel === 'events' && selectedEraId) {
      const eraEvents = events[selectedEraId] || [];
      return eraEvents.map((event) => (
        <TouchableOpacity
          key={event.id}
          style={styles.menuItem}
          onPress={() => {
            zoomInEvent(event.id);
            setMenuVisible(false);
          }}
        >
          <Text variant="bodyLarge" style={styles.menuItemText}>{event.title}</Text>
        </TouchableOpacity>
      ));
    } else if (zoomLevel === 'scenes' && selectedEventId) {
      const eventScenes = scenes[selectedEventId] || [];
      return eventScenes.map((scene) => (
        <TouchableOpacity
          key={scene.id}
          style={styles.menuItem}
          onPress={() => {
            setMenuVisible(false);
          }}
        >
          <Text variant="bodyLarge" style={styles.menuItemText}>{scene.title}</Text>
        </TouchableOpacity>
      ));
    }
    return null;
  };

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

  const toggleEraExpanded = (eraId) => {
    setExpandedEras(prev => ({
      ...prev,
      [eraId]: !prev[eraId],
    }));
  };

  const toggleEventExpanded = (eventId) => {
    setExpandedEvents(prev => ({
      ...prev,
      [eventId]: !prev[eventId],
    }));
  };

  const handleNavigateToItem = (itemId, itemType) => {
    setNavMenuVisible(false);
    
    // Navigate to the appropriate zoom level
    if (itemType === 'era') {
      resetZoom();
      setTimeout(() => {
        if (timelineVisualizationRef.current) {
          timelineVisualizationRef.current.scrollToItem(itemId);
        }
      }, 100);
    } else if (itemType === 'event') {
      // Find the era for this event
      const era = eras.find(e => {
        const eraEvents = events[e.id] || [];
        return eraEvents.some(ev => ev.id === itemId);
      });
      if (era) {
        zoomIn(era.id);
        setTimeout(() => {
          if (timelineVisualizationRef.current) {
            timelineVisualizationRef.current.scrollToItem(itemId);
          }
        }, 200);
      }
    } else if (itemType === 'scene') {
      // Find the event for this scene
      let foundEvent = null;
      let foundEra = null;
      for (const era of eras) {
        const eraEvents = events[era.id] || [];
        for (const event of eraEvents) {
          const eventScenes = scenes[event.id] || [];
          if (eventScenes.some(s => s.id === itemId)) {
            foundEvent = event;
            foundEra = era;
            break;
          }
        }
        if (foundEvent) break;
      }
      if (foundEvent && foundEra) {
        zoomIn(foundEra.id);
        setTimeout(() => {
          zoomInEvent(foundEvent.id);
          setTimeout(() => {
            if (timelineVisualizationRef.current) {
              timelineVisualizationRef.current.scrollToItem(itemId);
            }
          }, 200);
        }, 200);
      }
    }
  };

  const renderAccordionMenu = () => {
    return (
      <ScrollView style={styles.accordionScrollView}>
        {/* Home Button */}
        <Button
          mode="outlined"
          style={styles.accordionHomeButton}
          onPress={() => {
            setNavMenuVisible(false);
            navigation.navigate('TimelineList');
          }}
        >
          🏠 Home
        </Button>

        {/* Eras */}
        {eras.map((era) => {
          const isEraExpanded = expandedEras[era.id];
          const eraEvents = events[era.id] || [];

          return (
            <View key={era.id} style={styles.accordionSection}>
              <TouchableOpacity
                style={styles.accordionHeader}
                onPress={() => toggleEraExpanded(era.id)}
              >
                <Text variant="bodyLarge" style={styles.accordionHeaderText}>📅 {era.title}</Text>
                <Text variant="bodySmall" style={styles.accordionExpandIcon}>
                  {isEraExpanded ? '▼' : '▶'}
                </Text>
              </TouchableOpacity>
              
              {isEraExpanded && (
                <View style={styles.accordionContent}>
                  {/* Era itself is clickable */}
                  <TouchableOpacity
                    style={styles.accordionItem}
                    onPress={() => handleNavigateToItem(era.id, 'era')}
                  >
                    <Text variant="bodySmall" style={styles.accordionItemText}>→ View Era</Text>
                  </TouchableOpacity>

                  {/* Events within this era */}
                  {eraEvents.map((event) => {
                    const isEventExpanded = expandedEvents[event.id];
                    const eventScenes = scenes[event.id] || [];

                    return (
                      <View key={event.id} style={styles.accordionSubSection}>
                        <TouchableOpacity
                          style={styles.accordionSubHeader}
                          onPress={() => toggleEventExpanded(event.id)}
                        >
                          <Text variant="bodyMedium" style={styles.accordionSubHeaderText}>⭐ {event.title}</Text>
                          <Text variant="bodySmall" style={styles.accordionExpandIcon}>
                            {isEventExpanded ? '▼' : '▶'}
                          </Text>
                        </TouchableOpacity>

                        {isEventExpanded && (
                          <View style={styles.accordionSubContent}>
                            {/* Event itself is clickable */}
                            <TouchableOpacity
                              style={styles.accordionItem}
                              onPress={() => handleNavigateToItem(event.id, 'event')}
                            >
                              <Text variant="bodySmall" style={styles.accordionItemText}>→ View Event</Text>
                            </TouchableOpacity>

                            {/* Scenes within this event */}
                            {eventScenes.map((scene) => (
                              <TouchableOpacity
                                key={scene.id}
                                style={styles.accordionItem}
                                onPress={() => handleNavigateToItem(scene.id, 'scene')}
                              >
                                <Text variant="bodySmall" style={styles.accordionItemText}>🎬 {scene.title}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    );
  };

  if (loading || !timeline) {
    return (
      <View style={styles.loadingContainer}>
        <Text variant="bodyLarge">Loading timeline...</Text>
      </View>
    );
  }

  const handleCreate = () => {
    if (zoomLevel === 'eras') {
      handleAddEra();
    } else if (zoomLevel === 'events' && selectedEraId) {
      handleAddEvent(selectedEraId);
    } else if (zoomLevel === 'scenes' && selectedEventId) {
      handleAddScene(selectedEventId);
    }
  };

  const handleShare = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to share timelines');
      return;
    }

    if (!timeline || timeline.userId !== user.uid) {
      Alert.alert('Error', 'You can only share timelines you own');
      return;
    }

    // Show sharing options dialog
    Alert.alert(
      'Share Timeline',
      'Choose sharing permissions:',
      [
        {
          text: 'View Only',
          onPress: async () => {
            try {
              const shareResult = await sharingService.shareTimeline(timelineId, user.uid, {
                viewOnly: true,
                editable: false,
              });
              
              const shareUrl = shareResult.shareUrl;
              await Share.open({
                message: `Check out this timeline: ${timeline.title}\n${shareUrl}`,
                url: shareUrl,
                title: 'Share Timeline',
              });
            } catch (error) {
              console.error('Error sharing timeline:', error);
              if (error.message !== 'User did not share') {
                Alert.alert('Share Failed', error.message || 'Failed to share timeline');
              }
            }
          },
        },
        {
          text: 'Editable',
          onPress: async () => {
            try {
              const shareResult = await sharingService.shareTimeline(timelineId, user.uid, {
                viewOnly: false,
                editable: true,
              });
              
              const shareUrl = shareResult.shareUrl;
              await Share.open({
                message: `Check out this timeline: ${timeline.title}\n${shareUrl}`,
                url: shareUrl,
                title: 'Share Timeline',
              });
            } catch (error) {
              console.error('Error sharing timeline:', error);
              if (error.message !== 'User did not share') {
                Alert.alert('Share Failed', error.message || 'Failed to share timeline');
              }
            }
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        {/* Background Image for Header when drilled into an item */}
        {headerImageUrl ? (() => {
          // Determine image source - handle both local assets and remote URLs
          const getHeaderImageSource = () => {
            if (!headerImageUrl) return null;
            
            // Check if it's a local image key
            if (hasLocalImage(headerImageUrl)) {
              return getLocalImage(headerImageUrl);
            }
            
            // Otherwise treat as remote URL
            return { uri: headerImageUrl.trim() };
          };

          const headerImageSource = getHeaderImageSource();
          
          return headerImageSource ? (
            <ImageBackground
              source={headerImageSource}
              style={styles.headerBackgroundImage}
              resizeMode="cover"
              imageStyle={styles.headerBackgroundImageStyle}
            >
              <View style={styles.headerOverlay} />
            </ImageBackground>
          ) : null;
        })() : null}
        
        {/* Navigation Bar */}
        <View style={[styles.navBar, headerImageUrl && styles.navBarWithBackground]}>
          <View style={[styles.navBarButtonContainer, styles.navBarButtonWithBorder]}>
            <IconButton
              icon="chart-timeline-variant"
              size={24}
              iconColor={theme.colors.onSurface}
              onPress={() => navigation.navigate('TimelineList')}
              style={styles.navBarButton}
            />
          </View>
          <View style={[styles.navBarButtonContainer, styles.navBarButtonWithBorder]}>
            <IconButton
              icon="navigation-variant-outline"
              size={24}
              iconColor={theme.colors.onSurface}
              onPress={() => setNavMenuVisible(true)}
              style={styles.navBarButton}
            />
          </View>
          <View style={[styles.navBarButtonContainer, styles.navBarButtonWithBorder]}>
            <IconButton
              icon="cogs"
              size={24}
              iconColor={theme.colors.onSurface}
              onPress={() => navigation.navigate('TimelineSettings')}
              style={styles.navBarButton}
            />
          </View>
          <View style={[styles.navBarButtonContainer, styles.navBarButtonWithBorder]}>
            <IconButton
              icon="export-variant"
              size={24}
              iconColor={theme.colors.onSurface}
              onPress={handleShare}
              style={styles.navBarButton}
            />
          </View>
          <View style={styles.navBarButtonContainer}>
            <IconButton
              icon="timeline-plus-outline"
              size={24}
              iconColor={theme.colors.onSurface}
              onPress={handleCreate}
              style={styles.navBarButton}
            />
          </View>
        </View>
        <View style={headerImageUrl ? styles.headerContentWithBackground : styles.headerContent}>
          <Text variant="titleLarge" style={[styles.title, headerImageUrl && styles.titleWithBackground]}>
            {zoomLevel === 'events' && selectedEraId
              ? eras.find(e => e.id === selectedEraId)?.title || timeline.title
              : zoomLevel === 'scenes' && selectedEventId
              ? events[selectedEraId]?.find(e => e.id === selectedEventId)?.title || timeline.title
              : timeline.title}
          </Text>
          {((zoomLevel === 'events' && selectedEraId && eras.find(e => e.id === selectedEraId)?.description) ||
            (zoomLevel === 'scenes' && selectedEventId && events[selectedEraId]?.find(e => e.id === selectedEventId)?.description) ||
            (zoomLevel === 'eras' && timeline.description)) && (
            <Text variant="bodyMedium" style={[styles.description, headerImageUrl && styles.descriptionWithBackground]}>
              {zoomLevel === 'events' && selectedEraId
                ? eras.find(e => e.id === selectedEraId)?.description
                : zoomLevel === 'scenes' && selectedEventId
                ? events[selectedEraId]?.find(e => e.id === selectedEventId)?.description
                : timeline.description}
            </Text>
          )}
          <Text variant="labelSmall" style={[styles.type, headerImageUrl && styles.typeWithBackground]}>
            {timeline.isFictional ? '📚 Fictional Timeline' : '📅 Historical Timeline'}
          </Text>
        </View>
      </View>
      <TimelineVisualization
        ref={timelineVisualizationRef}
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
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuContainer}>
            <View style={styles.menuHeader}>
              <Text variant="titleLarge" style={styles.menuTitle}>
                {zoomLevel === 'eras' ? 'Eras' : zoomLevel === 'events' ? 'Events' : 'Scenes'}
              </Text>
              <IconButton
                icon="close"
                size={24}
                onPress={() => setMenuVisible(false)}
                iconColor={theme.colors.onSurfaceVariant}
              />
            </View>
            <ScrollView style={styles.menuScrollView}>
              {renderMenuItems()}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Navigation Accordion Menu */}
      <Modal
        visible={navMenuVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setNavMenuVisible(false)}
      >
        <View style={styles.navModalContainer}>
          <TouchableOpacity
            style={styles.navModalOverlay}
            activeOpacity={1}
            onPress={() => setNavMenuVisible(false)}
          />
          <View style={styles.navMenuContainer}>
            <View style={styles.navMenuHeader}>
              <Text variant="titleLarge" style={styles.navMenuTitle}>Navigation</Text>
              <IconButton
                icon="close"
                size={24}
                onPress={() => setNavMenuVisible(false)}
                iconColor={theme.colors.onSurfaceVariant}
              />
            </View>
            {renderAccordionMenu()}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const TimelineDetailScreen = () => {
  const route = useRoute();
  const { timelineId } = route.params;
  
  return (
    <TimelineZoomProvider>
      <TimelineDetailScreenContent />
    </TimelineZoomProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#1A1A2E',
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
    backgroundColor: '#0F0F1E',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#2A2A3E',
    position: 'relative',
    overflow: 'hidden',
  },
  headerBackgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  headerBackgroundImageStyle: {
    opacity: 0.4, // Fade the image
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0F0F1E',
    opacity: 0.6, // Dark overlay for better text readability
  },
  navBarWithBackground: {
    backgroundColor: 'rgba(26, 26, 46, 0.8)', // Semi-transparent for better visibility over image
  },
  headerContent: {
    position: 'relative',
    zIndex: 1,
  },
  headerContentWithBackground: {
    position: 'relative',
    zIndex: 1,
  },
  titleWithBackground: {
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    textAlign: 'center',
  },
  descriptionWithBackground: {
    color: '#E0E0E0',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    textAlign: 'center',
  },
  typeWithBackground: {
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    textAlign: 'center',
  },
  navBar: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2A3E',
    borderRadius: 0,
    overflow: 'hidden',
    backgroundColor: '#1A1A2E',
  },
  navBarButtonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    borderWidth: 0.5,
    borderColor: '#FFFFFF',
  },
  navBarButtonWithBorder: {
    borderRightWidth: 1,
    borderRightColor: '#2A2A3E',
  },
  navBarButton: {
    margin: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  description: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 8,
    lineHeight: 18,
    textAlign: 'center',
  },
  type: {
    fontSize: 11,
    color: '#8B5CF6',
    fontWeight: '500',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: '#16213E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A3E',
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  menuCloseButton: {
    fontSize: 22,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  menuScrollView: {
    maxHeight: 400,
  },
  menuItem: {
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#2A2A3E',
  },
  menuItemText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  navModalContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  navModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  navMenuContainer: {
    backgroundColor: '#16213E',
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    width: '70%',
    maxHeight: '100%',
    paddingBottom: 20,
  },
  navMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A3E',
  },
  navMenuTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  accordionScrollView: {
    maxHeight: 500,
  },
  accordionHomeButton: {
    padding: 16,
    backgroundColor: '#2A2A3E',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  accordionHomeButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  accordionSection: {
    marginTop: 8,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 20,
    backgroundColor: '#1A1A2E',
    borderBottomWidth: 0.5,
    borderBottomColor: '#2A2A3E',
  },
  accordionHeaderText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
    flex: 1,
  },
  accordionExpandIcon: {
    fontSize: 12,
    color: '#8B5CF6',
    marginLeft: 8,
  },
  accordionContent: {
    backgroundColor: '#0F0F1E',
    paddingLeft: 20,
  },
  accordionSubSection: {
    marginTop: 4,
  },
  accordionSubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    paddingLeft: 32,
    backgroundColor: '#1A1A2E',
    borderBottomWidth: 0.5,
    borderBottomColor: '#2A2A3E',
  },
  accordionSubHeaderText: {
    fontSize: 14,
    color: '#E0E0E0',
    fontWeight: '500',
    flex: 1,
  },
  accordionSubContent: {
    backgroundColor: '#0F0F1E',
    paddingLeft: 32,
  },
  accordionItem: {
    padding: 12,
    paddingLeft: 48,
    borderBottomWidth: 0.5,
    borderBottomColor: '#2A2A3E',
  },
  accordionItemText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '400',
  },
});

export default TimelineDetailScreen;

