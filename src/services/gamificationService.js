import storageService from './storageService';

const ACHIEVEMENTS = {
  FIRST_TIMELINE: {
    id: 'first_timeline',
    name: 'First Timeline',
    description: 'Create your first timeline',
    points: 10,
  },
  FIRST_ERA: {
    id: 'first_era',
    name: 'Era Creator',
    description: 'Add your first era to a timeline',
    points: 5,
  },
  FIRST_EVENT: {
    id: 'first_event',
    name: 'Event Planner',
    description: 'Add your first event',
    points: 5,
  },
  FIRST_SCENE: {
    id: 'first_scene',
    name: 'Scene Setter',
    description: 'Add your first scene',
    points: 3,
  },
  TEN_EVENTS: {
    id: 'ten_events',
    name: 'Eventful',
    description: 'Add 10 events across all timelines',
    points: 25,
  },
  HUNDRED_EVENTS: {
    id: 'hundred_events',
    name: 'Timeline Master',
    description: 'Add 100 events across all timelines',
    points: 100,
  },
  FIVE_TIMELINES: {
    id: 'five_timelines',
    name: 'Multi-Timeline',
    description: 'Create 5 timelines',
    points: 50,
  },
  COMPLETE_TIMELINE: {
    id: 'complete_timeline',
    name: 'Completionist',
    description: 'Create a timeline with at least 3 eras, 10 events, and 20 scenes',
    points: 75,
  },
};

class GamificationService {
  /**
   * Award points to the user
   * @param {number} points - Points to award
   * @returns {Promise<number>} - New total points
   */
  async awardPoints(points) {
    const userData = await storageService.getUserData();
    userData.points = (userData.points || 0) + points;
    await storageService.saveUserData(userData);
    return userData.points;
  }

  /**
   * Check and unlock achievements
   * @param {string} achievementId - Achievement ID to check
   * @returns {Promise<Object|null>} - Achievement object if unlocked, null otherwise
   */
  async unlockAchievement(achievementId) {
    const userData = await storageService.getUserData();
    const achievements = userData.achievements || [];
    
    // Check if already unlocked
    if (achievements.includes(achievementId)) {
      return null;
    }
    
    // Unlock achievement
    achievements.push(achievementId);
    userData.achievements = achievements;
    
    // Award points for achievement
    const achievement = ACHIEVEMENTS[achievementId.toUpperCase()] || 
                       Object.values(ACHIEVEMENTS).find(a => a.id === achievementId);
    
    if (achievement) {
      await this.awardPoints(achievement.points);
    }
    
    await storageService.saveUserData(userData);
    return achievement;
  }

  /**
   * Get all available achievements
   * @returns {Object} - Object with all achievements
   */
  getAllAchievements() {
    return ACHIEVEMENTS;
  }

  /**
   * Get user's unlocked achievements
   * @returns {Promise<Array>} - Array of achievement objects
   */
  async getUserAchievements() {
    const userData = await storageService.getUserData();
    const unlockedIds = userData.achievements || [];
    return Object.values(ACHIEVEMENTS)
      .filter(achievement => unlockedIds.includes(achievement.id))
      .map(achievement => ({
        ...achievement,
        unlocked: true,
      }));
  }

  /**
   * Get user's progress
   * @returns {Promise<Object>} - User progress data
   */
  async getUserProgress() {
    const userData = await storageService.getUserData();
    return {
      points: userData.points || 0,
      achievements: userData.achievements || [],
      totalAchievements: Object.keys(ACHIEVEMENTS).length,
    };
  }

  /**
   * Check achievements based on user actions
   * @param {string} action - Action type (e.g., 'create_timeline', 'add_event')
   * @param {Object} context - Additional context data
   * @returns {Promise<Array>} - Array of newly unlocked achievements
   */
  async checkAchievements(action, context = {}) {
    const unlocked = [];
    
    switch (action) {
      case 'create_timeline':
        await this.awardPoints(5);
        const firstTimeline = await this.unlockAchievement('first_timeline');
        if (firstTimeline) unlocked.push(firstTimeline);
        
        // Check for 5 timelines achievement
        const timelines = await context.timelineService?.getAllTimelines();
        if (timelines && timelines.length >= 5) {
          const fiveTimelines = await this.unlockAchievement('five_timelines');
          if (fiveTimelines) unlocked.push(fiveTimelines);
        }
        break;
        
      case 'add_era':
        await this.awardPoints(3);
        const firstEra = await this.unlockAchievement('first_era');
        if (firstEra) unlocked.push(firstEra);
        break;
        
      case 'add_event':
        await this.awardPoints(2);
        const firstEvent = await this.unlockAchievement('first_event');
        if (firstEvent) unlocked.push(firstEvent);
        
        // Check for event count achievements
        if (context.timelineService) {
          const eventCount = await this.getAllEventsCount(context.timelineService);
          if (eventCount >= 10) {
            const tenEvents = await this.unlockAchievement('ten_events');
            if (tenEvents) unlocked.push(tenEvents);
          }
          if (eventCount >= 100) {
            const hundredEvents = await this.unlockAchievement('hundred_events');
            if (hundredEvents) unlocked.push(hundredEvents);
          }
        }
        break;
        
      case 'add_scene':
        await this.awardPoints(1);
        const firstScene = await this.unlockAchievement('first_scene');
        if (firstScene) unlocked.push(firstScene);
        break;
    }
    
    return unlocked;
  }

  /**
   * Get all events count (helper for achievement checking)
   * @param {Object} timelineService - Timeline service instance
   * @returns {Promise<number>}
   */
  async getAllEventsCount(timelineService) {
    const timelines = await timelineService.getAllTimelines();
    let totalEvents = 0;
    
    for (const timeline of timelines) {
      const eras = await timelineService.getErasByTimelineId(timeline.id);
      for (const era of eras) {
        const events = await timelineService.getEventsByEraId(era.id);
        totalEvents += events.length;
      }
    }
    
    return totalEvents;
  }
}

export default new GamificationService();

