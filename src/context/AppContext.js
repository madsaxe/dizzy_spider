import React, { createContext, useState, useEffect, useContext } from 'react';
import timelineService from '../services/timelineService';
import gamificationService from '../services/gamificationService';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [timelines, setTimelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProgress, setUserProgress] = useState({
    points: 0,
    achievements: [],
  });

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [timelinesData, progress] = await Promise.all([
        timelineService.getAllTimelines(),
        gamificationService.getUserProgress(),
      ]);
      setTimelines(timelinesData);
      setUserProgress(progress);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshTimelines = async () => {
    const timelinesData = await timelineService.getAllTimelines();
    setTimelines(timelinesData);
  };

  const refreshProgress = async () => {
    const progress = await gamificationService.getUserProgress();
    setUserProgress(progress);
  };

  const createTimeline = async (timelineData) => {
    const timeline = await timelineService.createTimeline(timelineData);
    await refreshTimelines();
    
    // Check achievements
    const unlocked = await gamificationService.checkAchievements('create_timeline', {
      timelineService,
    });
    await refreshProgress();
    
    return { timeline, unlockedAchievements: unlocked };
  };

  const updateTimeline = async (timelineId, updates) => {
    const timeline = await timelineService.updateTimeline(timelineId, updates);
    await refreshTimelines();
    return timeline;
  };

  const deleteTimeline = async (timelineId) => {
    await timelineService.deleteTimeline(timelineId);
    await refreshTimelines();
  };

  const createEra = async (eraData) => {
    const era = await timelineService.createEra(eraData);
    
    // Check achievements
    const unlocked = await gamificationService.checkAchievements('add_era', {
      timelineService,
    });
    await refreshProgress();
    
    return { era, unlockedAchievements: unlocked };
  };

  const updateEra = async (eraId, updates) => {
    const era = await timelineService.updateEra(eraId, updates);
    return era;
  };

  const deleteEra = async (eraId) => {
    await timelineService.deleteEra(eraId);
  };

  const createEvent = async (eventData) => {
    const event = await timelineService.createEvent(eventData);
    
    // Check achievements
    const allEvents = await timelineService.getEventsByEraId(eventData.eraId);
    const unlocked = await gamificationService.checkAchievements('add_event', {
      timelineService,
      eventCount: allEvents.length,
    });
    await refreshProgress();
    
    return { event, unlockedAchievements: unlocked };
  };

  const updateEvent = async (eventId, updates) => {
    const event = await timelineService.updateEvent(eventId, updates);
    return event;
  };

  const deleteEvent = async (eventId) => {
    await timelineService.deleteEvent(eventId);
  };

  const createScene = async (sceneData) => {
    const scene = await timelineService.createScene(sceneData);
    
    // Check achievements
    const unlocked = await gamificationService.checkAchievements('add_scene', {
      timelineService,
    });
    await refreshProgress();
    
    return { scene, unlockedAchievements: unlocked };
  };

  const updateScene = async (sceneId, updates) => {
    const scene = await timelineService.updateScene(sceneId, updates);
    return scene;
  };

  const deleteScene = async (sceneId) => {
    await timelineService.deleteScene(sceneId);
  };

  const value = {
    timelines,
    loading,
    userProgress,
    refreshTimelines,
    refreshProgress,
    createTimeline,
    updateTimeline,
    deleteTimeline,
    createEra,
    updateEra,
    deleteEra,
    createEvent,
    updateEvent,
    deleteEvent,
    createScene,
    updateScene,
    deleteScene,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContext;

