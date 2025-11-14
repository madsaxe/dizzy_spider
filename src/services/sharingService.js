import firestore from '@react-native-firebase/firestore';
import timelineService from './timelineService';

class SharingService {
  /**
   * Share a timeline with a shareable link
   * @param {string} timelineId - Timeline ID to share
   * @param {string} userId - User ID of the timeline owner
   * @param {Object} options - Sharing options
   * @param {boolean} options.viewOnly - Whether the shared timeline is view-only (default: true)
   * @param {boolean} options.editable - Whether the shared timeline is editable (default: false)
   * @returns {Promise<Object>} Share object with shareId and shareUrl
   */
  async shareTimeline(timelineId, userId, options = {}) {
    try {
      const timeline = await timelineService.getTimelineById(timelineId);
      if (!timeline) {
        throw new Error('Timeline not found');
      }

      if (timeline.userId !== userId) {
        throw new Error('You can only share timelines you own');
      }

      const viewOnly = options.viewOnly !== undefined ? options.viewOnly : true;
      const editable = options.editable || false;

      // Generate a unique share ID
      const shareId = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create share document in Firestore
      const shareData = {
        shareId,
        timelineId,
        ownerId: userId,
        viewOnly,
        editable,
        createdAt: firestore.FieldValue.serverTimestamp(),
        expiresAt: null, // Can be set for temporary shares
        accessCount: 0,
        lastAccessedAt: null,
      };

      await firestore().collection('sharedTimelines').doc(shareId).set(shareData);

      // Generate share URL (in a real app, this would be a deep link or web URL)
      const shareUrl = `timelineapp://shared/${shareId}`;

      return {
        shareId,
        shareUrl,
        viewOnly,
        editable,
      };
    } catch (error) {
      console.error('Error sharing timeline:', error);
      throw error;
    }
  }

  /**
   * Get a shared timeline by share ID
   * @param {string} shareId - Share ID
   * @returns {Promise<Object>} Shared timeline data
   */
  async getSharedTimeline(shareId) {
    try {
      const shareDoc = await firestore().collection('sharedTimelines').doc(shareId).get();
      
      if (!shareDoc.exists) {
        throw new Error('Shared timeline not found');
      }

      const shareData = shareDoc.data();
      
      // Update access count and last accessed
      await firestore().collection('sharedTimelines').doc(shareId).update({
        accessCount: firestore.FieldValue.increment(1),
        lastAccessedAt: firestore.FieldValue.serverTimestamp(),
      });

      // Get the actual timeline data
      const timeline = await timelineService.getTimelineById(shareData.timelineId);
      if (!timeline) {
        throw new Error('Timeline not found');
      }

      // Get all related data
      const eras = await timelineService.getErasByTimelineId(timeline.id);
      const allEvents = [];
      const allScenes = [];

      for (const era of eras) {
        const events = await timelineService.getEventsByEraId(era.id);
        allEvents.push(...events);
        
        for (const event of events) {
          const scenes = await timelineService.getScenesByEventId(event.id);
          allScenes.push(...scenes);
        }
      }

      return {
        timeline,
        eras,
        events: allEvents,
        scenes: allScenes,
        shareInfo: {
          shareId: shareData.shareId,
          viewOnly: shareData.viewOnly,
          editable: shareData.editable,
          ownerId: shareData.ownerId,
        },
      };
    } catch (error) {
      console.error('Error getting shared timeline:', error);
      throw error;
    }
  }

  /**
   * Get all timelines shared by the current user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of share objects
   */
  async getMySharedTimelines(userId) {
    try {
      const snapshot = await firestore()
        .collection('sharedTimelines')
        .where('ownerId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      const shares = [];
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const timeline = await timelineService.getTimelineById(data.timelineId);
        
        shares.push({
          shareId: data.shareId,
          timelineId: data.timelineId,
          timelineTitle: timeline?.title || 'Unknown Timeline',
          viewOnly: data.viewOnly,
          editable: data.editable,
          createdAt: data.createdAt?.toDate() || new Date(),
          accessCount: data.accessCount || 0,
          shareUrl: `timelineapp://shared/${data.shareId}`,
        });
      }

      return shares;
    } catch (error) {
      console.error('Error getting my shared timelines:', error);
      throw error;
    }
  }

  /**
   * Revoke access to a shared timeline
   * @param {string} shareId - Share ID
   * @param {string} userId - User ID (must be the owner)
   * @returns {Promise<void>}
   */
  async revokeShare(shareId, userId) {
    try {
      const shareDoc = await firestore().collection('sharedTimelines').doc(shareId).get();
      
      if (!shareDoc.exists) {
        throw new Error('Shared timeline not found');
      }

      const shareData = shareDoc.data();
      if (shareData.ownerId !== userId) {
        throw new Error('You can only revoke shares you own');
      }

      await firestore().collection('sharedTimelines').doc(shareId).delete();
    } catch (error) {
      console.error('Error revoking share:', error);
      throw error;
    }
  }

  /**
   * Update share settings (view-only/editable)
   * @param {string} shareId - Share ID
   * @param {string} userId - User ID (must be the owner)
   * @param {Object} options - New sharing options
   * @param {boolean} options.viewOnly - Whether the shared timeline is view-only
   * @param {boolean} options.editable - Whether the shared timeline is editable
   * @returns {Promise<void>}
   */
  async updateShareSettings(shareId, userId, options) {
    try {
      const shareDoc = await firestore().collection('sharedTimelines').doc(shareId).get();
      
      if (!shareDoc.exists) {
        throw new Error('Shared timeline not found');
      }

      const shareData = shareDoc.data();
      if (shareData.ownerId !== userId) {
        throw new Error('You can only update shares you own');
      }

      const updates = {};
      if (options.viewOnly !== undefined) {
        updates.viewOnly = options.viewOnly;
      }
      if (options.editable !== undefined) {
        updates.editable = options.editable;
      }

      await firestore().collection('sharedTimelines').doc(shareId).update(updates);
    } catch (error) {
      console.error('Error updating share settings:', error);
      throw error;
    }
  }
}

export default new SharingService();

