/**
 * Utility functions for transforming timeline data for visualization
 * Converts hierarchical structure (Era > Event > Scene) to flat timeline format
 */

import { compareTimes, formatTime, formatTimeRange } from './timeUtils';

/**
 * Transform hierarchical timeline data into flat timeline items
 * @param {Array} eras - Array of Era objects
 * @param {Object} eventsMap - Map of eraId to array of Event objects
 * @param {Object} scenesMap - Map of eventId to array of Scene objects
 * @param {boolean} isFictional - Whether the timeline is fictional
 * @returns {Array} Flat array of timeline items sorted chronologically
 */
export const transformToTimelineItems = (eras, eventsMap, scenesMap, isFictional = false) => {
  const timelineItems = [];
  
  // Create a map of era IDs to era objects for relative positioning lookup
  const eraMap = {};
  eras.forEach(era => {
    eraMap[era.id] = era;
  });

  // Process eras
  eras.forEach((era) => {
    const eraEvents = eventsMap[era.id] || [];
    
    // Determine time display for era
    let timeDisplay;
    if (era.startTime) {
      timeDisplay = formatTimeRange(era.startTime, era.endTime, isFictional);
      // If also positioned relative to another era, append that info
      if (era.positionRelativeTo && eraMap[era.positionRelativeTo]) {
        const relativeEra = eraMap[era.positionRelativeTo];
        timeDisplay += ` (After ${relativeEra.title})`;
      }
    } else if (era.positionRelativeTo && eraMap[era.positionRelativeTo]) {
      // Era is positioned relative to another era but has no custom time
      const relativeEra = eraMap[era.positionRelativeTo];
      timeDisplay = `After ${relativeEra.title}`;
    } else {
      timeDisplay = 'No time specified';
    }
    
    // Add era as timeline item
    timelineItems.push({
      id: era.id,
      type: 'era',
      title: era.title,
      description: era.description || '',
      time: era.startTime,
      timeDisplay: timeDisplay,
      endTime: era.endTime,
      order: era.order,
      positionRelativeTo: era.positionRelativeTo,
      positionType: era.positionType,
      data: era,
    });

    // Process events within this era
    eraEvents.forEach((event) => {
      const eventScenes = scenesMap[event.id] || [];
      
      // Add event as timeline item
      timelineItems.push({
        id: event.id,
        type: 'event',
        title: event.title,
        description: event.description || '',
        time: event.time,
        timeDisplay: formatTime(event.time, isFictional),
        order: event.order,
        positionRelativeTo: event.positionRelativeTo,
        positionType: event.positionType,
        eraId: era.id,
        data: event,
      });

      // Process scenes within this event
      eventScenes.forEach((scene) => {
        timelineItems.push({
          id: scene.id,
          type: 'scene',
          title: scene.title,
          description: scene.description || '',
          time: scene.time,
          timeDisplay: formatTime(scene.time, isFictional),
          order: scene.order,
          positionRelativeTo: scene.positionRelativeTo,
          positionType: scene.positionType,
          eventId: event.id,
          eraId: era.id,
          data: scene,
        });
      });
    });
  });

  // Sort timeline items by time
  timelineItems.sort((a, b) => {
    // First, sort by type (eras first, then events, then scenes)
    const typeOrder = { era: 0, event: 1, scene: 2 };
    const typeDiff = typeOrder[a.type] - typeOrder[b.type];
    if (typeDiff !== 0) return typeDiff;

    // Then sort by time
    return compareTimes(a.time, b.time);
  });

  return timelineItems;
};

/**
 * Format timeline item for react-native-timeline-flatlist
 * @param {Object} item - Timeline item from transformToTimelineItems
 * @returns {Object} Formatted item for timeline component
 */
export const formatForTimelineComponent = (item) => {
  return {
    time: item.timeDisplay || 'No time specified',
    title: item.title,
    description: item.description,
    circleColor: getItemColor(item.type),
    lineColor: getItemColor(item.type),
    // Store original data for callbacks
    _originalData: item,
  };
};

/**
 * Get color for timeline item based on type
 * @param {string} type - 'era', 'event', or 'scene'
 * @returns {string} Color hex code
 */
const getItemColor = (type) => {
  switch (type) {
    case 'era':
      return '#4A90E2'; // Blue
    case 'event':
      return '#50C878'; // Green
    case 'scene':
      return '#FF6B6B'; // Red
    default:
      return '#999'; // Gray
  }
};

/**
 * Transform timeline items for react-native-timeline-flatlist
 * @param {Array} timelineItems - Items from transformToTimelineItems
 * @returns {Array} Formatted items ready for Timeline component
 */
export const prepareTimelineData = (timelineItems) => {
  return timelineItems.map(formatForTimelineComponent);
};

