/**
 * Local image assets mapping
 * These images are bundled with the app and don't require network access
 */

const images = {
  // Era images
  'pre-war-era': require('../../assets/images/pre-war-era.jpg'),
  'early-war-era': require('../../assets/images/early-war-era.jpg'),
  'global-war-era': require('../../assets/images/global-war-era.jpg'),
  'allied-advance-era': require('../../assets/images/allied-advance-era.jpg'),
  'end-war-era': require('../../assets/images/end-war-era.jpg'),
  'post-war-era': require('../../assets/images/post-war-era.jpg'),
  
  // Event images
  'hitler-chancellor': require('../../assets/images/hitler-chancellor.jpg'),
  'reichstag-fire': require('../../assets/images/reichstag-fire.jpg'),
  'poland-invasion': require('../../assets/images/poland-invasion.jpg'),
  'stalingrad': require('../../assets/images/stalingrad.jpg'),
  'd-day': require('../../assets/images/d-day.jpg'),
  'victory-europe': require('../../assets/images/victory-europe.jpg'),
};

/**
 * Get local image source by key
 * @param {string} imageKey - The key for the image
 * @returns {object|null} - Image source object or null if not found
 */
export const getLocalImage = (imageKey) => {
  return images[imageKey] || null;
};

/**
 * Check if an image key exists in local assets
 * @param {string} imageKey - The key for the image
 * @returns {boolean} - True if image exists locally
 */
export const hasLocalImage = (imageKey) => {
  return imageKey && images.hasOwnProperty(imageKey);
};

export default images;

