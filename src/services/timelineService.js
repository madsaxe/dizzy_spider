import Timeline from '../models/Timeline';
import Era from '../models/Era';
import Event from '../models/Event';
import Scene from '../models/Scene';
import storageService from './storageService';
import { compareTimes } from '../utils/timeUtils';

class TimelineService {
  // ============ Timeline CRUD ============

  /**
   * Get all timelines for the current user
   * @param {string} userId - User ID to filter timelines
   * @returns {Promise<Array<Timeline>>}
   */
  async getAllTimelines(userId = null) {
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
   * @returns {Promise<Timeline>}
   */
  async createTimeline(timelineData) {
    const timeline = new Timeline(timelineData);
    const timelines = await this.getAllTimelines();
    timelines.push(timeline);
    await storageService.saveTimelines(timelines.map(t => t.toJSON()));
    return timeline;
  }

  /**
   * Update a timeline
   * @param {string} timelineId - Timeline ID
   * @param {object} updates - Updates to apply
   * @returns {Promise<Timeline|null>}
   */
  async updateTimeline(timelineId, updates) {
    const timelines = await this.getAllTimelines();
    const index = timelines.findIndex(t => t.id === timelineId);
    
    if (index === -1) return null;
    
    // Update the timeline instance
    const timeline = timelines[index];
    Object.assign(timeline, updates);
    await storageService.saveTimelines(timelines.map(t => t.toJSON()));
    return timeline;
  }

  /**
   * Delete a timeline and all its related data
   * @param {string} timelineId - Timeline ID
   * @returns {Promise<boolean>}
   */
  async deleteTimeline(timelineId) {
    const timelines = await this.getAllTimelines();
    const filtered = timelines.filter(t => t.id !== timelineId);
    await storageService.saveTimelines(filtered.map(t => t.toJSON()));
    
    // Delete all related eras, events, and scenes
    const eras = await this.getErasByTimelineId(timelineId);
    for (const era of eras) {
      await this.deleteEra(era.id);
    }
    
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
}

export default new TimelineService();

