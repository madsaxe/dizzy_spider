/**
 * Utility functions for handling time in timelines
 * Supports both real dates and fictional time strings
 */

/**
 * Check if a time string is a valid date
 * @param {string} timeString - The time string to check
 * @returns {boolean}
 */
export const isValidDate = (timeString) => {
  if (!timeString) return false;
  const date = new Date(timeString);
  return date instanceof Date && !isNaN(date);
};

/**
 * Check if a time string is fictional (not a valid date)
 * @param {string} timeString - The time string to check
 * @returns {boolean}
 */
export const isFictionalTime = (timeString) => {
  if (!timeString) return false;
  return !isValidDate(timeString);
};

/**
 * Format a time string for display
 * @param {string} timeString - The time string to format
 * @param {boolean} isFictional - Whether the timeline is fictional
 * @returns {string}
 */
export const formatTime = (timeString, isFictional = false) => {
  if (!timeString) return 'No time specified';
  
  if (isValidDate(timeString)) {
    const date = new Date(timeString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
  
  // Return fictional time as-is
  return timeString;
};

/**
 * Format a time range for display
 * @param {string} startTime - Start time
 * @param {string} endTime - End time
 * @param {boolean} isFictional - Whether the timeline is fictional
 * @returns {string}
 */
export const formatTimeRange = (startTime, endTime, isFictional = false) => {
  if (!startTime && !endTime) return 'No time specified';
  if (!endTime) return formatTime(startTime, isFictional);
  if (!startTime) return `Until ${formatTime(endTime, isFictional)}`;
  
  return `${formatTime(startTime, isFictional)} - ${formatTime(endTime, isFictional)}`;
};

/**
 * Compare two time strings for sorting
 * @param {string} time1 - First time string
 * @param {string} time2 - Second time string
 * @returns {number} - Negative if time1 < time2, positive if time1 > time2, 0 if equal
 */
export const compareTimes = (time1, time2) => {
  if (!time1 && !time2) return 0;
  if (!time1) return 1;
  if (!time2) return -1;
  
  // If both are valid dates, compare as dates
  if (isValidDate(time1) && isValidDate(time2)) {
    return new Date(time1) - new Date(time2);
  }
  
  // If one is a date and one is fictional, dates come first
  if (isValidDate(time1) && !isValidDate(time2)) return -1;
  if (!isValidDate(time1) && isValidDate(time2)) return 1;
  
  // Both are fictional, compare as strings
  return time1.localeCompare(time2);
};

