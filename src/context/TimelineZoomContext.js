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
  const [selectedEraId, setSelectedEraId] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [zoomHistory, setZoomHistory] = useState([]);

  const zoomIn = useCallback((eraId) => {
    setZoomHistory((prev) => [...prev, { level: zoomLevel, eraId: selectedEraId, eventId: selectedEventId }]);
    setSelectedEraId(eraId);
    setZoomLevel('events');
  }, [zoomLevel, selectedEraId, selectedEventId]);

  const zoomInEvent = useCallback((eventId) => {
    setZoomHistory((prev) => [...prev, { level: zoomLevel, eraId: selectedEraId, eventId: selectedEventId }]);
    setSelectedEventId(eventId);
    setZoomLevel('scenes');
  }, [zoomLevel, selectedEraId, selectedEventId]);

  const zoomOut = useCallback(() => {
    if (zoomHistory.length === 0) {
      resetZoom();
      return;
    }

    const previous = zoomHistory[zoomHistory.length - 1];
    setZoomHistory((prev) => prev.slice(0, -1));
    setZoomLevel(previous.level);
    setSelectedEraId(previous.eraId || null);
    setSelectedEventId(previous.eventId || null);
  }, [zoomHistory]);

  const resetZoom = useCallback(() => {
    setZoomLevel('eras');
    setSelectedEraId(null);
    setSelectedEventId(null);
    setZoomHistory([]);
  }, []);

  const canZoomOut = zoomLevel !== 'eras' || zoomHistory.length > 0;
  const canZoomIn = zoomLevel === 'eras' || zoomLevel === 'events';

  const value = {
    zoomLevel,
    selectedEraId,
    selectedEventId,
    zoomHistory,
    zoomIn,
    zoomInEvent,
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

