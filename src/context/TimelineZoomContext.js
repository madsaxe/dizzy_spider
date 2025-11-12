import React, { createContext, useState, useContext, useCallback } from 'react';

const TimelineZoomContext = createContext();

export const useTimelineZoom = () => {
  const context = useContext(TimelineZoomContext);
  if (!context) {
    throw new Error('useTimelineZoom must be used within TimelineZoomProvider');
  }
  return context;
};

export const TimelineZoomProvider = ({ children }) => {
  const [zoomLevel, setZoomLevel] = useState('eras'); // 'eras' | 'events' | 'scenes'
  const [selectedEraIds, setSelectedEraIds] = useState(new Set()); // Set of selected Era IDs
  const [selectedEventIds, setSelectedEventIds] = useState(new Set()); // Set of selected Event IDs
  const [zoomHistory, setZoomHistory] = useState([]);

  // Helper to convert Set to Array for backward compatibility
  const selectedEraId = selectedEraIds.size > 0 ? Array.from(selectedEraIds)[0] : null;
  const selectedEventId = selectedEventIds.size > 0 ? Array.from(selectedEventIds)[0] : null;

  const toggleEra = useCallback((eraId) => {
    setSelectedEraIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(eraId)) {
        newSet.delete(eraId);
      } else {
        newSet.add(eraId);
      }
      // If we have any selected Eras, we're at events level
      if (newSet.size > 0 && zoomLevel === 'eras') {
        setZoomLevel('events');
      } else if (newSet.size === 0 && zoomLevel === 'events') {
        setZoomLevel('eras');
      }
      return newSet;
    });
  }, [zoomLevel]);

  const toggleEvent = useCallback((eventId) => {
    setSelectedEventIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      // If we have any selected Events, we're at scenes level
      if (newSet.size > 0 && zoomLevel === 'events') {
        setZoomLevel('scenes');
      } else if (newSet.size === 0 && zoomLevel === 'scenes') {
        setZoomLevel('events');
      }
      return newSet;
    });
  }, [zoomLevel]);

  const zoomIn = useCallback((eraId) => {
    setZoomHistory((prev) => [...prev, { level: zoomLevel, eraIds: Array.from(selectedEraIds), eventIds: Array.from(selectedEventIds) }]);
    setSelectedEraIds((prev) => {
      const newSet = new Set(prev);
      newSet.add(eraId);
      return newSet;
    });
    setZoomLevel('events');
  }, [zoomLevel, selectedEraIds, selectedEventIds]);

  const zoomInEvent = useCallback((eventId) => {
    setZoomHistory((prev) => [...prev, { level: zoomLevel, eraIds: Array.from(selectedEraIds), eventIds: Array.from(selectedEventIds) }]);
    setSelectedEventIds((prev) => {
      const newSet = new Set(prev);
      newSet.add(eventId);
      return newSet;
    });
    setZoomLevel('scenes');
  }, [zoomLevel, selectedEraIds, selectedEventIds]);

  const zoomOut = useCallback(() => {
    if (zoomHistory.length === 0) {
      resetZoom();
      return;
    }

    const previous = zoomHistory[zoomHistory.length - 1];
    setZoomHistory((prev) => prev.slice(0, -1));
    setZoomLevel(previous.level);
    setSelectedEraIds(new Set(previous.eraIds || []));
    setSelectedEventIds(new Set(previous.eventIds || []));
  }, [zoomHistory]);

  const resetZoom = useCallback(() => {
    setZoomLevel('eras');
    setSelectedEraIds(new Set());
    setSelectedEventIds(new Set());
    setZoomHistory([]);
  }, []);

  const canZoomOut = zoomLevel !== 'eras' || zoomHistory.length > 0;
  const canZoomIn = zoomLevel === 'eras' || zoomLevel === 'events';

  const value = {
    zoomLevel,
    selectedEraId, // Backward compatibility - first selected Era
    selectedEraIds, // Set of all selected Era IDs
    selectedEventId, // Backward compatibility - first selected Event
    selectedEventIds, // Set of all selected Event IDs
    zoomHistory,
    zoomIn,
    zoomInEvent,
    toggleEra,
    toggleEvent,
    zoomOut,
    resetZoom,
    canZoomOut,
    canZoomIn,
  };

  return (
    <TimelineZoomContext.Provider value={value}>
      {children}
    </TimelineZoomContext.Provider>
  );
};

export default TimelineZoomContext;

