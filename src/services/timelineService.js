import Timeline from '../models/Timeline';
import Era from '../models/Era';
import Event from '../models/Event';
import Scene from '../models/Scene';
import storageService from './storageService';
import { compareTimes } from '../utils/timeUtils';

class TimelineService {
  // ============ Timeline CRUD ============

  /**
   * Get all timelines
   * @returns {Promise<Array<Timeline>>}
   */
  async getAllTimelines() {
    const timelines = await storageService.getTimelines();
    return timelines.map(t => Timeline.fromJSON(t));
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
    
    timelines[index] = { ...timelines[index], ...updates };
    await storageService.saveTimelines(timelines.map(t => t.toJSON()));
    return timelines[index];
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
    return eras
      .filter(e => e.timelineId === timelineId)
      .map(e => Era.fromJSON(e))
      .sort((a, b) => {
        // Sort by order, then by start time
        if (a.order !== b.order) return a.order - b.order;
        if (!a.startTime && !b.startTime) return 0;
        if (!a.startTime) return 1;
        if (!b.startTime) return -1;
        return compareTimes(a.startTime, b.startTime);
      });
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
    eras.push(era);
    await storageService.saveEras(eras.map(e => e.toJSON()));
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
    await storageService.saveEras(eras.map(e => e.toJSON()));
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
    await storageService.saveEras(filtered.map(e => e.toJSON()));
    
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
    events.push(event);
    await storageService.saveEvents(events.map(e => e.toJSON()));
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
    await storageService.saveEvents(events.map(e => e.toJSON()));
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
    await storageService.saveEvents(filtered.map(e => e.toJSON()));
    
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
    scenes.push(scene);
    await storageService.saveScenes(scenes.map(s => s.toJSON()));
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
    await storageService.saveScenes(scenes.map(s => s.toJSON()));
    return Scene.fromJSON(scenes[index]);
  }

  /**
   * Delete a scene
   * @param {string} sceneId - Scene ID
   * @returns {Promise<boolean>}
   */
  async deleteScene(sceneId) {
    const scenes = await storageService.getScenes();
    const filtered = scenes.filter(s => s.id !== sceneId);
    await storageService.saveScenes(filtered.map(s => s.toJSON()));
    return true;
  }

  // ============ Helper Methods ============

  /**
   * Sort items considering relative positioning
   * @param {Array} items - Array of items with time and relative positioning
   * @returns {Array} - Sorted array
   */
  sortItemsWithRelativePositioning(items) {
    // Separate items with times and items with relative positioning
    const itemsWithTime = items.filter(item => item.time);
    const itemsWithRelative = items.filter(item => !item.time && item.positionRelativeTo);
    
    // Sort items with time
    itemsWithTime.sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return compareTimes(a.time, b.time);
    });
    
    // Insert items with relative positioning
    for (const relativeItem of itemsWithRelative) {
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
      item => !item.time && !item.positionRelativeTo
    );
    itemsWithoutPositioning.sort((a, b) => a.order - b.order);
    
    return [...itemsWithTime, ...itemsWithoutPositioning];
  }
}

export default new TimelineService();

