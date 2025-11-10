/**
 * Validation utilities for timeline data
 */

/**
 * Validate timeline data
 * @param {object} timeline - Timeline object to validate
 * @returns {object} - { valid: boolean, errors: string[] }
 */
export const validateTimeline = (timeline) => {
  const errors = [];
  
  if (!timeline.title || timeline.title.trim() === '') {
    errors.push('Timeline title is required');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Validate era data
 * @param {object} era - Era object to validate
 * @returns {object} - { valid: boolean, errors: string[] }
 */
export const validateEra = (era) => {
  const errors = [];
  
  if (!era.title || era.title.trim() === '') {
    errors.push('Era title is required');
  }
  
  if (!era.timelineId) {
    errors.push('Era must belong to a timeline');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Validate event data
 * @param {object} event - Event object to validate
 * @returns {object} - { valid: boolean, errors: string[] }
 */
export const validateEvent = (event) => {
  const errors = [];
  
  if (!event.title || event.title.trim() === '') {
    errors.push('Event title is required');
  }
  
  if (!event.eraId) {
    errors.push('Event must belong to an era');
  }
  
  // If using relative positioning, must have positionRelativeTo and positionType
  if (!event.time && (!event.positionRelativeTo || !event.positionType)) {
    errors.push('Event must have either a time or relative positioning');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Validate scene data
 * @param {object} scene - Scene object to validate
 * @returns {object} - { valid: boolean, errors: string[] }
 */
export const validateScene = (scene) => {
  const errors = [];
  
  if (!scene.title || scene.title.trim() === '') {
    errors.push('Scene title is required');
  }
  
  if (!scene.eventId) {
    errors.push('Scene must belong to an event');
  }
  
  // If using relative positioning, must have positionRelativeTo and positionType
  if (!scene.time && (!scene.positionRelativeTo || !scene.positionType)) {
    errors.push('Scene must have either a time or relative positioning');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

