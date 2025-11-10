import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  TIMELINES: 'timelines',
  ERAS: 'eras',
  EVENTS: 'events',
  SCENES: 'scenes',
  USER_DATA: 'user_data',
};

class StorageService {
  /**
   * Get all timelines
   * @returns {Promise<Array>}
   */
  async getTimelines() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.TIMELINES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting timelines:', error);
      return [];
    }
  }

  /**
   * Save timelines
   * @param {Array} timelines - Array of timeline objects
   * @returns {Promise<void>}
   */
  async saveTimelines(timelines) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TIMELINES, JSON.stringify(timelines));
    } catch (error) {
      console.error('Error saving timelines:', error);
      throw error;
    }
  }

  /**
   * Get all eras
   * @returns {Promise<Array>}
   */
  async getEras() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ERAS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting eras:', error);
      return [];
    }
  }

  /**
   * Save eras
   * @param {Array} eras - Array of era objects
   * @returns {Promise<void>}
   */
  async saveEras(eras) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ERAS, JSON.stringify(eras));
    } catch (error) {
      console.error('Error saving eras:', error);
      throw error;
    }
  }

  /**
   * Get all events
   * @returns {Promise<Array>}
   */
  async getEvents() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.EVENTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting events:', error);
      return [];
    }
  }

  /**
   * Save events
   * @param {Array} events - Array of event objects
   * @returns {Promise<void>}
   */
  async saveEvents(events) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    } catch (error) {
      console.error('Error saving events:', error);
      throw error;
    }
  }

  /**
   * Get all scenes
   * @returns {Promise<Array>}
   */
  async getScenes() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SCENES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting scenes:', error);
      return [];
    }
  }

  /**
   * Save scenes
   * @param {Array} scenes - Array of scene objects
   * @returns {Promise<void>}
   */
  async saveScenes(scenes) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SCENES, JSON.stringify(scenes));
    } catch (error) {
      console.error('Error saving scenes:', error);
      throw error;
    }
  }

  /**
   * Get user data (points, achievements, etc.)
   * @returns {Promise<Object>}
   */
  async getUserData() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return data ? JSON.parse(data) : { points: 0, achievements: [] };
    } catch (error) {
      console.error('Error getting user data:', error);
      return { points: 0, achievements: [] };
    }
  }

  /**
   * Save user data
   * @param {Object} userData - User data object
   * @returns {Promise<void>}
   */
  async saveUserData(userData) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user data:', error);
      throw error;
    }
  }

  /**
   * Clear all data (for testing/reset)
   * @returns {Promise<void>}
   */
  async clearAll() {
    try {
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }
}

export default new StorageService();

