import Timeline from '../models/Timeline';
import Era from '../models/Era';
import Event from '../models/Event';
import Scene from '../models/Scene';
import storageService from './storageService';
import { compareTimes } from '../utils/timeUtils';
import firestore from '@react-native-firebase/firestore';

class TimelineService {
  // ============ Timeline CRUD ============

  /**
   * Get all timelines for the current user
   * @param {string} userId - User ID to filter timelines
   * @param {boolean} syncFromCloud - Whether to sync from Firestore if user is logged in
   * @returns {Promise<Array<Timeline>>}
   */
  async getAllTimelines(userId = null, syncFromCloud = false) {
    // If user is logged in and sync is requested, try to sync from Firestore first
    if (userId && syncFromCloud) {
      try {
        await this.syncTimelinesFromCloud(userId);
      } catch (error) {
        console.error('Error syncing timelines from cloud:', error);
        // Continue with local data if sync fails
      }
    }
    
    const timelines = await storageService.getTimelines();
    const allTimelines = timelines.map(t => Timeline.fromJSON(t));
    
    // If userId is provided, filter by userId
    // If userId is null, return timelines without userId (for migration)
    if (userId !== null) {
      return allTimelines.filter(t => t.userId === userId);
    }
    return allTimelines;
  }

  /**
   * Get a timeline by ID
   * @param {string} timelineId - Timeline ID
   * @returns {Promise<Timeline|null>}
   */
  async getTimelineById(timelineId) {
    const timelines = await this.getAllTimelines();
    return timelines.find(t => t.id === timelineId) || null;
  }

  /**
   * Create a new timeline
   * @param {object} timelineData - Timeline data
   * @param {string} userId - User ID for cloud sync
   * @returns {Promise<Timeline>}
   */
  async createTimeline(timelineData, userId = null) {
    const timeline = new Timeline(timelineData);
    if (userId) {
      timeline.userId = userId;
    }
    const timelines = await this.getAllTimelines();
    timelines.push(timeline);
    await storageService.saveTimelines(timelines.map(t => t.toJSON()));
    
    // Sync to Firestore if user is logged in
    if (userId) {
      try {
        await this.syncTimelineToCloud(timeline, userId);
      } catch (error) {
        console.error('Error syncing timeline to cloud:', error);
        // Continue even if sync fails
      }
    }
    
    return timeline;
  }

  /**
   * Update a timeline
   * @param {string} timelineId - Timeline ID
   * @param {object} updates - Updates to apply
   * @param {string} userId - User ID for cloud sync
   * @returns {Promise<Timeline|null>}
   */
  async updateTimeline(timelineId, updates, userId = null) {
    const timelines = await this.getAllTimelines();
    const index = timelines.findIndex(t => t.id === timelineId);
    
    if (index === -1) return null;
    
    // Update the timeline instance
    const timeline = timelines[index];
    Object.assign(timeline, updates);
    await storageService.saveTimelines(timelines.map(t => t.toJSON()));
    
    // Sync to Firestore if user is logged in
    if (userId || timeline.userId) {
      try {
        await this.syncTimelineToCloud(timeline, userId || timeline.userId);
      } catch (error) {
        console.error('Error syncing timeline to cloud:', error);
        // Continue even if sync fails
      }
    }
    
    return timeline;
  }

  /**
   * Delete a timeline and all its related data
   * @param {string} timelineId - Timeline ID
   * @returns {Promise<boolean>}
   */
  async deleteTimeline(timelineId) {
    const timelines = await this.getAllTimelines();
    const timeline = timelines.find(t => t.id === timelineId);
    
    // Delete from cloud if user is logged in
    if (timeline?.userId) {
      try {
        await firestore()
          .collection('userTimelines')
          .doc(timeline.userId)
          .collection('timelines')
          .doc(timelineId)
          .delete();
      } catch (error) {
        console.error('Error deleting timeline from cloud:', error);
        // Continue with local deletion even if cloud deletion fails
      }
    }
    
    // Delete all related eras, events, and scenes locally first
    const eras = await this.getErasByTimelineId(timelineId);
    for (const era of eras) {
      await this.deleteEra(era.id);
    }
    
    // Delete timeline from local storage
    const filtered = timelines.filter(t => t.id !== timelineId);
    await storageService.saveTimelines(filtered.map(t => t.toJSON()));
    
    return true;
  }

  // ============ Era CRUD ============

  /**
   * Get all eras for a timeline
   * @param {string} timelineId - Timeline ID
   * @returns {Promise<Array<Era>>}
   */
  async getErasByTimelineId(timelineId) {
    const eras = await storageService.getEras();
    const timelineEras = eras
      .filter(e => e.timelineId === timelineId)
      .map(e => Era.fromJSON(e));
    
    // Sort eras considering relative positioning
    return this.sortItemsWithRelativePositioning(timelineEras);
  }

  /**
   * Get an era by ID
   * @param {string} eraId - Era ID
   * @returns {Promise<Era|null>}
   */
  async getEraById(eraId) {
    const eras = await storageService.getEras();
    const era = eras.find(e => e.id === eraId);
    return era ? Era.fromJSON(era) : null;
  }

  /**
   * Create a new era
   * @param {object} eraData - Era data
   * @returns {Promise<Era>}
   */
  async createEra(eraData) {
    const era = new Era(eraData);
    const eras = await storageService.getEras();
    eras.push(era.toJSON());
    await storageService.saveEras(eras);
    return era;
  }

  /**
   * Update an era
   * @param {string} eraId - Era ID
   * @param {object} updates - Updates to apply
   * @returns {Promise<Era|null>}
   */
  async updateEra(eraId, updates) {
    const eras = await storageService.getEras();
    const index = eras.findIndex(e => e.id === eraId);
    
    if (index === -1) return null;
    
    eras[index] = { ...eras[index], ...updates };
    await storageService.saveEras(eras);
    return Era.fromJSON(eras[index]);
  }

  /**
   * Delete an era and all its related events
   * @param {string} eraId - Era ID
   * @returns {Promise<boolean>}
   */
  async deleteEra(eraId) {
    const eras = await storageService.getEras();
    const filtered = eras.filter(e => e.id !== eraId);
    await storageService.saveEras(filtered);
    
    // Delete all related events
    const events = await this.getEventsByEraId(eraId);
    for (const event of events) {
      await this.deleteEvent(event.id);
    }
    
    return true;
  }

  // ============ Event CRUD ============

  /**
   * Get all events for an era
   * @param {string} eraId - Era ID
   * @returns {Promise<Array<Event>>}
   */
  async getEventsByEraId(eraId) {
    const events = await storageService.getEvents();
    const eraEvents = events
      .filter(e => e.eraId === eraId)
      .map(e => Event.fromJSON(e));
    
    // Sort events considering relative positioning
    return this.sortItemsWithRelativePositioning(eraEvents);
  }

  /**
   * Get an event by ID
   * @param {string} eventId - Event ID
   * @returns {Promise<Event|null>}
   */
  async getEventById(eventId) {
    const events = await storageService.getEvents();
    const event = events.find(e => e.id === eventId);
    return event ? Event.fromJSON(event) : null;
  }

  /**
   * Create a new event
   * @param {object} eventData - Event data
   * @returns {Promise<Event>}
   */
  async createEvent(eventData) {
    const event = new Event(eventData);
    const events = await storageService.getEvents();
    events.push(event.toJSON());
    await storageService.saveEvents(events);
    return event;
  }

  /**
   * Update an event
   * @param {string} eventId - Event ID
   * @param {object} updates - Updates to apply
   * @returns {Promise<Event|null>}
   */
  async updateEvent(eventId, updates) {
    const events = await storageService.getEvents();
    const index = events.findIndex(e => e.id === eventId);
    
    if (index === -1) return null;
    
    events[index] = { ...events[index], ...updates };
    await storageService.saveEvents(events);
    return Event.fromJSON(events[index]);
  }

  /**
   * Delete an event and all its related scenes
   * @param {string} eventId - Event ID
   * @returns {Promise<boolean>}
   */
  async deleteEvent(eventId) {
    const events = await storageService.getEvents();
    const filtered = events.filter(e => e.id !== eventId);
    await storageService.saveEvents(filtered);
    
    // Delete all related scenes
    const scenes = await this.getScenesByEventId(eventId);
    for (const scene of scenes) {
      await this.deleteScene(scene.id);
    }
    
    return true;
  }

  // ============ Scene CRUD ============

  /**
   * Get all scenes for an event
   * @param {string} eventId - Event ID
   * @returns {Promise<Array<Scene>>}
   */
  async getScenesByEventId(eventId) {
    const scenes = await storageService.getScenes();
    const eventScenes = scenes
      .filter(s => s.eventId === eventId)
      .map(s => Scene.fromJSON(s));
    
    // Sort scenes considering relative positioning
    return this.sortItemsWithRelativePositioning(eventScenes);
  }

  /**
   * Get a scene by ID
   * @param {string} sceneId - Scene ID
   * @returns {Promise<Scene|null>}
   */
  async getSceneById(sceneId) {
    const scenes = await storageService.getScenes();
    const scene = scenes.find(s => s.id === sceneId);
    return scene ? Scene.fromJSON(scene) : null;
  }

  /**
   * Create a new scene
   * @param {object} sceneData - Scene data
   * @returns {Promise<Scene>}
   */
  async createScene(sceneData) {
    const scene = new Scene(sceneData);
    const scenes = await storageService.getScenes();
    scenes.push(scene.toJSON());
    await storageService.saveScenes(scenes);
    return scene;
  }

  /**
   * Update a scene
   * @param {string} sceneId - Scene ID
   * @param {object} updates - Updates to apply
   * @returns {Promise<Scene|null>}
   */
  async updateScene(sceneId, updates) {
    const scenes = await storageService.getScenes();
    const index = scenes.findIndex(s => s.id === sceneId);
    
    if (index === -1) return null;
    
    scenes[index] = { ...scenes[index], ...updates };
    await storageService.saveScenes(scenes);
    return Scene.fromJSON(scenes[index]);
  }

  /**
   * Update era order
   * @param {string} eraId - Era ID
   * @param {number} newOrder - New order value
   * @returns {Promise<Era|null>}
   */
  async updateEraOrder(eraId, newOrder) {
    return this.updateEra(eraId, { order: newOrder });
  }

  /**
   * Update era date
   * @param {string} eraId - Era ID
   * @param {string} newDate - New date (startTime for eras)
   * @param {string} newEndDate - New end date (optional)
   * @returns {Promise<Era|null>}
   */
  async updateEraDate(eraId, newDate, newEndDate = null) {
    const updates = { startTime: newDate };
    if (newEndDate) {
      updates.endTime = newEndDate;
    }
    return this.updateEra(eraId, updates);
  }

  /**
   * Update era relative position
   * @param {string} eraId - Era ID
   * @param {string|null} positionRelativeTo - ID of era to position relative to
   * @param {string|null} positionType - 'before' or 'after'
   * @returns {Promise<Era|null>}
   */
  async updateEraPosition(eraId, positionRelativeTo, positionType) {
    return this.updateEra(eraId, { positionRelativeTo, positionType });
  }

  /**
   * Update event order
   * @param {string} eventId - Event ID
   * @param {number} newOrder - New order value
   * @returns {Promise<Event|null>}
   */
  async updateEventOrder(eventId, newOrder) {
    return this.updateEvent(eventId, { order: newOrder });
  }

  /**
   * Update event date
   * @param {string} eventId - Event ID
   * @param {string} newDate - New date
   * @returns {Promise<Event|null>}
   */
  async updateEventDate(eventId, newDate) {
    return this.updateEvent(eventId, { time: newDate });
  }

  /**
   * Update event relative position
   * @param {string} eventId - Event ID
   * @param {string|null} positionRelativeTo - ID of event to position relative to
   * @param {string|null} positionType - 'before' or 'after'
   * @returns {Promise<Event|null>}
   */
  async updateEventPosition(eventId, positionRelativeTo, positionType) {
    return this.updateEvent(eventId, { positionRelativeTo, positionType });
  }

  /**
   * Update scene order
   * @param {string} sceneId - Scene ID
   * @param {number} newOrder - New order value
   * @returns {Promise<Scene|null>}
   */
  async updateSceneOrder(sceneId, newOrder) {
    return this.updateScene(sceneId, { order: newOrder });
  }

  /**
   * Update scene date
   * @param {string} sceneId - Scene ID
   * @param {string} newDate - New date
   * @returns {Promise<Scene|null>}
   */
  async updateSceneDate(sceneId, newDate) {
    return this.updateScene(sceneId, { time: newDate });
  }

  /**
   * Update scene relative position
   * @param {string} sceneId - Scene ID
   * @param {string|null} positionRelativeTo - ID of scene to position relative to
   * @param {string|null} positionType - 'before' or 'after'
   * @returns {Promise<Scene|null>}
   */
  async updateScenePosition(sceneId, positionRelativeTo, positionType) {
    return this.updateScene(sceneId, { positionRelativeTo, positionType });
  }

  /**
   * Delete a scene
   * @param {string} sceneId - Scene ID
   * @returns {Promise<boolean>}
   */
  async deleteScene(sceneId) {
    const scenes = await storageService.getScenes();
    const filtered = scenes.filter(s => s.id !== sceneId);
    await storageService.saveScenes(filtered);
    return true;
  }

  // ============ Helper Methods ============

  /**
   * Sort items considering relative positioning
   * @param {Array} items - Array of items with time and relative positioning
   * @returns {Array} - Sorted array
   */
  sortItemsWithRelativePositioning(items) {
    // For eras, check startTime; for events/scenes, check time
    const getTime = (item) => item.startTime !== undefined ? item.startTime : item.time;
    
    // Separate items with times and items with relative positioning (but no time)
    const itemsWithTime = items.filter(item => getTime(item));
    const itemsWithRelativeOnly = items.filter(item => !getTime(item) && item.positionRelativeTo);
    
    // Sort items with time (including those that also have relative positioning)
    itemsWithTime.sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      const timeA = getTime(a);
      const timeB = getTime(b);
      return compareTimes(timeA, timeB);
    });
    
    // Insert items with relative positioning only (no custom time)
    for (const relativeItem of itemsWithRelativeOnly) {
      const targetIndex = itemsWithTime.findIndex(
        item => item.id === relativeItem.positionRelativeTo
      );
      
      if (targetIndex !== -1) {
        if (relativeItem.positionType === 'before') {
          itemsWithTime.splice(targetIndex, 0, relativeItem);
        } else {
          itemsWithTime.splice(targetIndex + 1, 0, relativeItem);
        }
      } else {
        // If target not found, append to end
        itemsWithTime.push(relativeItem);
      }
    }
    
    // Sort by order for items without time or relative positioning
    const itemsWithoutPositioning = items.filter(
      item => !getTime(item) && !item.positionRelativeTo
    );
    itemsWithoutPositioning.sort((a, b) => a.order - b.order);
    
    return [...itemsWithTime, ...itemsWithoutPositioning];
  }

  // ============ Cloud Sync Methods ============

  /**
   * Sync a single timeline to Firestore
   * @param {Timeline} timeline - Timeline to sync
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async syncTimelineToCloud(timeline, userId) {
    if (!userId || !timeline) return;
    
    try {
      const timelineData = timeline.toJSON();
      timelineData.userId = userId;
      timelineData.updatedAt = firestore.FieldValue.serverTimestamp();
      
      // Get all related data
      const eras = await this.getErasByTimelineId(timeline.id);
      const allEvents = [];
      const allScenes = [];
      
      for (const era of eras) {
        const eraEvents = await this.getEventsByEraId(era.id);
        allEvents.push(...eraEvents);
        
        for (const event of eraEvents) {
          const eventScenes = await this.getScenesByEventId(event.id);
          allScenes.push(...eventScenes);
        }
      }
      
      // Store complete timeline data in Firestore
      await firestore()
        .collection('userTimelines')
        .doc(userId)
        .collection('timelines')
        .doc(timeline.id)
        .set({
          ...timelineData,
          eras: eras.map(e => e.toJSON()),
          events: allEvents.map(e => e.toJSON()),
          scenes: allScenes.map(s => s.toJSON()),
          syncedAt: firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
    } catch (error) {
      console.error('Error syncing timeline to cloud:', error);
      throw error;
    }
  }

  /**
   * Sync all timelines to Firestore for a user
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async syncTimelinesToCloud(userId) {
    if (!userId) return;
    
    try {
      const timelines = await this.getAllTimelines(userId, false);
      
      for (const timeline of timelines) {
        await this.syncTimelineToCloud(timeline, userId);
      }
    } catch (error) {
      console.error('Error syncing timelines to cloud:', error);
      throw error;
    }
  }

  /**
   * Sync timelines from Firestore to local storage
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async syncTimelinesFromCloud(userId) {
    if (!userId) return;
    
    try {
      const snapshot = await firestore()
        .collection('userTimelines')
        .doc(userId)
        .collection('timelines')
        .get();
      
      if (snapshot.empty) {
        // No cloud data, sync local to cloud instead
        await this.syncTimelinesToCloud(userId);
        return;
      }
      
      // Get local timelines
      const localTimelines = await storageService.getTimelines();
      const localTimelineMap = new Map(localTimelines.map(t => [t.id, t]));
      
      // Process cloud timelines
      const cloudTimelines = [];
      for (const doc of snapshot.docs) {
        const cloudData = doc.data();
        const timelineId = doc.id;
        
        // Check if local version exists and compare timestamps
        const localTimeline = localTimelineMap.get(timelineId);
        const cloudSyncedAt = cloudData.syncedAt?.toDate?.() || new Date(0);
        const localUpdatedAt = localTimeline?.updatedAt 
          ? new Date(localTimeline.updatedAt) 
          : new Date(0);
        
        // Use cloud version if it's newer, otherwise keep local
        if (!localTimeline || cloudSyncedAt >= localUpdatedAt) {
          // Use cloud data
          const { eras = [], events = [], scenes = [], ...timelineData } = cloudData;
          cloudTimelines.push(timelineData);
          
          // Save related data
          if (eras.length > 0) {
            const existingEras = await storageService.getEras();
            const filteredEras = existingEras.filter(e => e.timelineId !== timelineId);
            await storageService.saveEras([...filteredEras, ...eras]);
          }
          
          if (events.length > 0) {
            const existingEvents = await storageService.getEvents();
            const filteredEvents = existingEvents.filter(e => {
              const eraIds = eras.map(era => era.id);
              return !eraIds.includes(e.eraId);
            });
            await storageService.saveEvents([...filteredEvents, ...events]);
          }
          
          if (scenes.length > 0) {
            const existingScenes = await storageService.getScenes();
            const filteredScenes = existingScenes.filter(s => {
              const eventIds = events.map(event => event.id);
              return !eventIds.includes(s.eventId);
            });
            await storageService.saveScenes([...filteredScenes, ...scenes]);
          }
        } else {
          // Local is newer, sync to cloud
          cloudTimelines.push(localTimeline);
          if (localTimeline.userId === userId) {
            const timeline = Timeline.fromJSON(localTimeline);
            await this.syncTimelineToCloud(timeline, userId);
          }
        }
      }
      
      // Save merged timelines
      const mergedTimelines = [
        ...cloudTimelines,
        ...localTimelines.filter(t => t.userId === userId && !cloudTimelines.find(ct => ct.id === t.id))
      ];
      await storageService.saveTimelines(mergedTimelines);
    } catch (error) {
      console.error('Error syncing timelines from cloud:', error);
      throw error;
    }
  }
}

export default new TimelineService();

