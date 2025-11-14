import Papa from 'papaparse';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import { zip, unzip } from 'react-native-zip-archive';
import timelineService from './timelineService';
import { getLocalImage, hasLocalImage } from '../assets/images';
import { Platform } from 'react-native';

class CSVService {
  /**
   * Export a timeline to CSV format with all eras, events, and scenes
   * @param {string} timelineId - Timeline ID to export
   * @param {boolean} includeImages - Whether to include images (as base64 or in zip)
   * @returns {Promise<string>} CSV string
   */
  async exportTimelineToCSV(timelineId, includeImages = true) {
    try {
      // Get timeline and all related data
      const timeline = await timelineService.getTimelineById(timelineId);
      if (!timeline) {
        throw new Error('Timeline not found');
      }

      const eras = await timelineService.getErasByTimelineId(timelineId);
      const allEvents = [];
      const allScenes = [];

      // Get all events and scenes
      for (const era of eras) {
        const events = await timelineService.getEventsByEraId(era.id);
        allEvents.push(...events);
        
        for (const event of events) {
          const scenes = await timelineService.getScenesByEventId(event.id);
          allScenes.push(...scenes);
        }
      }

      // Build CSV rows
      const rows = [];

      // Timeline row
      rows.push({
        type: 'timeline',
        id: timeline.id,
        parentId: '',
        parentType: '',
        title: timeline.title || '',
        description: timeline.description || '',
        time: '',
        startTime: '',
        endTime: '',
        imageUrl: timeline.imageUrl || '',
        imageBase64: includeImages && timeline.imageUrl ? await this.getImageBase64(timeline.imageUrl) : '',
        order: 0,
        isFictional: timeline.isFictional ? 'true' : 'false',
        positionRelativeTo: '',
        positionType: '',
        userId: timeline.userId || '',
      });

      // Era rows
      for (const era of eras) {
        rows.push({
          type: 'era',
          id: era.id,
          parentId: timeline.id,
          parentType: 'timeline',
          title: era.title || '',
          description: era.description || '',
          time: '',
          startTime: era.startTime || '',
          endTime: era.endTime || '',
          imageUrl: era.imageUrl || '',
          imageBase64: includeImages && era.imageUrl ? await this.getImageBase64(era.imageUrl) : '',
          order: era.order || 0,
          isFictional: '',
          positionRelativeTo: era.positionRelativeTo || '',
          positionType: era.positionType || '',
          userId: '',
        });
      }

      // Event rows
      for (const event of allEvents) {
        rows.push({
          type: 'event',
          id: event.id,
          parentId: event.eraId,
          parentType: 'era',
          title: event.title || '',
          description: event.description || '',
          time: event.time || '',
          startTime: '',
          endTime: '',
          imageUrl: event.imageUrl || '',
          imageBase64: includeImages && event.imageUrl ? await this.getImageBase64(event.imageUrl) : '',
          order: event.order || 0,
          isFictional: '',
          positionRelativeTo: event.positionRelativeTo || '',
          positionType: event.positionType || '',
          userId: '',
        });
      }

      // Scene rows
      for (const scene of allScenes) {
        rows.push({
          type: 'scene',
          id: scene.id,
          parentId: scene.eventId,
          parentType: 'event',
          title: scene.title || '',
          description: scene.description || '',
          time: scene.time || '',
          startTime: '',
          endTime: '',
          imageUrl: scene.imageUrl || '',
          imageBase64: includeImages && scene.imageUrl ? await this.getImageBase64(scene.imageUrl) : '',
          order: scene.order || 0,
          isFictional: '',
          positionRelativeTo: scene.positionRelativeTo || '',
          positionType: scene.positionType || '',
          userId: '',
        });
      }

      // Convert to CSV
      const csv = Papa.unparse(rows, {
        header: true,
        skipEmptyLines: true,
      });

      return csv;
    } catch (error) {
      console.error('Error exporting timeline to CSV:', error);
      throw error;
    }
  }

  /**
   * Get image as base64 string
   * @param {string} imageUrl - Image URL or local asset key
   * @returns {Promise<string>} Base64 encoded image
   */
  async getImageBase64(imageUrl) {
    try {
      if (!imageUrl) return '';

      // Check if it's a local image
      if (hasLocalImage(imageUrl)) {
        // For local images, we'll just include the key
        // The importer will need to handle this
        return `local:${imageUrl}`;
      }

      // For remote URLs, try to fetch and convert to base64
      // Note: This is a simplified version - in production you might want to
      // download the image first and then convert
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        // For remote images, we'll include the URL
        // The importer can download them if needed
        return `remote:${imageUrl}`;
      }

      // For file paths, read the file
      if (imageUrl.startsWith('file://') || imageUrl.startsWith('/')) {
        try {
          const base64 = await RNFS.readFile(imageUrl, 'base64');
          return `base64:${base64}`;
        } catch (error) {
          console.warn('Could not read image file:', imageUrl);
          return '';
        }
      }

      return '';
    } catch (error) {
      console.error('Error getting image base64:', error);
      return '';
    }
  }

  /**
   * Export timeline and save to file, then share
   * @param {string} timelineId - Timeline ID to export
   * @returns {Promise<void>}
   */
  async exportAndShareTimeline(timelineId) {
    try {
      const csv = await this.exportTimelineToCSV(timelineId, true);
      
      // Get timeline for filename
      const timeline = await timelineService.getTimelineById(timelineId);
      const filename = `${timeline.title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.csv`;
      
      // Save to temporary directory
      const filePath = `${RNFS.CachesDirectoryPath}/${filename}`;
      await RNFS.writeFile(filePath, csv, 'utf8');

      // Share the file
      await Share.open({
        url: Platform.OS === 'ios' ? `file://${filePath}` : `file://${filePath}`,
        type: 'text/csv',
        filename: filename,
        title: 'Export Timeline',
      });

      // Clean up after a delay
      setTimeout(() => {
        RNFS.unlink(filePath).catch(console.error);
      }, 5000);
    } catch (error) {
      console.error('Error exporting and sharing timeline:', error);
      throw error;
    }
  }

  /**
   * Import timeline from CSV data
   * @param {string} csvData - CSV string data
   * @param {string} userId - User ID to assign to imported timeline
   * @returns {Promise<Object>} Imported timeline object
   */
  async importTimelineFromCSV(csvData, userId) {
    try {
      // Parse CSV
      const parseResult = Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
      });

      if (parseResult.errors.length > 0) {
        console.warn('CSV parsing errors:', parseResult.errors);
      }

      const rows = parseResult.data;
      if (rows.length === 0) {
        throw new Error('CSV file is empty');
      }

      // Find timeline row
      const timelineRow = rows.find(row => row.type === 'timeline');
      if (!timelineRow) {
        throw new Error('No timeline found in CSV');
      }

      // Create timeline
      const timelineData = {
        title: timelineRow.title || 'Imported Timeline',
        description: timelineRow.description || '',
        isFictional: timelineRow.isFictional === 'true',
        userId: userId,
      };
      const timeline = await timelineService.createTimeline(timelineData);

      // Process images if present
      if (timelineRow.imageBase64) {
        await this.processImageBase64(timelineRow.imageBase64, timeline.id, 'timeline');
      }

      // Group rows by type and parent
      const eraRows = rows.filter(row => row.type === 'era' && row.parentId === timeline.id);
      const eventRows = rows.filter(row => row.type === 'event');
      const sceneRows = rows.filter(row => row.type === 'scene');

      // Create eras
      const eraMap = {};
      for (const eraRow of eraRows) {
        const eraData = {
          timelineId: timeline.id,
          title: eraRow.title || '',
          description: eraRow.description || '',
          startTime: eraRow.startTime || null,
          endTime: eraRow.endTime || null,
          order: parseInt(eraRow.order) || 0,
          positionRelativeTo: eraRow.positionRelativeTo || null,
          positionType: eraRow.positionType || null,
          imageUrl: eraRow.imageUrl || null,
        };
        const era = await timelineService.createEra(eraData);
        eraMap[eraRow.id] = era;

        // Process image if present
        if (eraRow.imageBase64) {
          await this.processImageBase64(eraRow.imageBase64, era.id, 'era');
        }
      }

      // Create events
      const eventMap = {};
      for (const eventRow of eventRows) {
        const parentEra = eraMap[eventRow.parentId];
        if (!parentEra) {
          console.warn(`Event ${eventRow.id} has invalid parent era ${eventRow.parentId}`);
          continue;
        }

        const eventData = {
          eraId: parentEra.id,
          title: eventRow.title || '',
          description: eventRow.description || '',
          time: eventRow.time || null,
          order: parseInt(eventRow.order) || 0,
          positionRelativeTo: eventRow.positionRelativeTo || null,
          positionType: eventRow.positionType || null,
          imageUrl: eventRow.imageUrl || null,
        };
        const event = await timelineService.createEvent(eventData);
        eventMap[eventRow.id] = event;

        // Process image if present
        if (eventRow.imageBase64) {
          await this.processImageBase64(eventRow.imageBase64, event.id, 'event');
        }
      }

      // Create scenes
      for (const sceneRow of sceneRows) {
        const parentEvent = eventMap[sceneRow.parentId];
        if (!parentEvent) {
          console.warn(`Scene ${sceneRow.id} has invalid parent event ${sceneRow.parentId}`);
          continue;
        }

        const sceneData = {
          eventId: parentEvent.id,
          title: sceneRow.title || '',
          description: sceneRow.description || '',
          time: sceneRow.time || null,
          order: parseInt(sceneRow.order) || 0,
          positionRelativeTo: sceneRow.positionRelativeTo || null,
          positionType: sceneRow.positionType || null,
          imageUrl: sceneRow.imageUrl || null,
        };
        const scene = await timelineService.createScene(sceneData);

        // Process image if present
        if (sceneRow.imageBase64) {
          await this.processImageBase64(sceneRow.imageBase64, scene.id, 'scene');
        }
      }

      return timeline;
    } catch (error) {
      console.error('Error importing timeline from CSV:', error);
      throw error;
    }
  }

  /**
   * Generate a CSV template with sample data from example timelines
   * @returns {string} CSV template string
   */
  generateCSVTemplate() {
    // Sample data based on the World War II example timeline
    const sampleRows = [
      // Timeline
      {
        type: 'timeline',
        id: 'ww2-timeline',
        parentId: '',
        parentType: '',
        title: 'World War II Timeline',
        description: 'A comprehensive timeline of major events during World War II',
        time: '',
        startTime: '',
        endTime: '',
        imageUrl: '',
        imageBase64: '',
        order: '0',
        isFictional: 'false',
        positionRelativeTo: '',
        positionType: '',
        userId: '',
      },
      // Era 1: Pre-War Period
      {
        type: 'era',
        id: 'pre-war-era',
        parentId: 'ww2-timeline',
        parentType: 'timeline',
        title: 'Pre-War Period (1933-1939)',
        description: 'The years leading up to World War II, marked by rising tensions and aggression',
        time: '',
        startTime: '1933-01-01',
        endTime: '1939-08-31',
        imageUrl: 'pre-war-era',
        imageBase64: '',
        order: '0',
        isFictional: '',
        positionRelativeTo: '',
        positionType: '',
        userId: '',
      },
      // Era 2: Early War
      {
        type: 'era',
        id: 'early-war-era',
        parentId: 'ww2-timeline',
        parentType: 'timeline',
        title: 'Early War Years (1939-1941)',
        description: 'The initial phase of World War II with rapid German expansion',
        time: '',
        startTime: '1939-09-01',
        endTime: '1941-12-06',
        imageUrl: 'early-war-era',
        imageBase64: '',
        order: '1',
        isFictional: '',
        positionRelativeTo: '',
        positionType: '',
        userId: '',
      },
      // Event 1: Hitler Becomes Chancellor
      {
        type: 'event',
        id: 'hitler-chancellor',
        parentId: 'pre-war-era',
        parentType: 'era',
        title: 'Hitler Becomes Chancellor',
        description: 'Adolf Hitler is appointed Chancellor of Germany, marking the beginning of Nazi rule',
        time: '1933-01-30',
        startTime: '',
        endTime: '',
        imageUrl: 'hitler-chancellor',
        imageBase64: '',
        order: '0',
        isFictional: '',
        positionRelativeTo: '',
        positionType: '',
        userId: '',
      },
      // Scene 1
      {
        type: 'scene',
        id: 'scene-hitler-1',
        parentId: 'hitler-chancellor',
        parentType: 'event',
        title: 'Appointment Ceremony',
        description: 'Hitler is sworn in as Chancellor in Berlin',
        time: '1933-01-30',
        startTime: '',
        endTime: '',
        imageUrl: '',
        imageBase64: '',
        order: '0',
        isFictional: '',
        positionRelativeTo: '',
        positionType: '',
        userId: '',
      },
      // Scene 2
      {
        type: 'scene',
        id: 'scene-hitler-2',
        parentId: 'hitler-chancellor',
        parentType: 'event',
        title: 'Public Reaction',
        description: 'Mixed reactions from the German public and international community',
        time: '1933-01-30',
        startTime: '',
        endTime: '',
        imageUrl: '',
        imageBase64: '',
        order: '1',
        isFictional: '',
        positionRelativeTo: '',
        positionType: '',
        userId: '',
      },
      // Event 2: Reichstag Fire
      {
        type: 'event',
        id: 'reichstag-fire',
        parentId: 'pre-war-era',
        parentType: 'era',
        title: 'Reichstag Fire',
        description: 'The German parliament building is set on fire, used as pretext for emergency powers',
        time: '1933-02-27',
        startTime: '',
        endTime: '',
        imageUrl: 'reichstag-fire',
        imageBase64: '',
        order: '1',
        isFictional: '',
        positionRelativeTo: '',
        positionType: '',
        userId: '',
      },
      // Event 3: Invasion of Poland
      {
        type: 'event',
        id: 'invasion-poland',
        parentId: 'early-war-era',
        parentType: 'era',
        title: 'Invasion of Poland',
        description: 'Germany invades Poland, marking the start of World War II',
        time: '1939-09-01',
        startTime: '',
        endTime: '',
        imageUrl: 'poland-invasion',
        imageBase64: '',
        order: '0',
        isFictional: '',
        positionRelativeTo: '',
        positionType: '',
        userId: '',
      },
      // Scene for Invasion of Poland
      {
        type: 'scene',
        id: 'scene-poland-1',
        parentId: 'invasion-poland',
        parentType: 'event',
        title: 'Blitzkrieg Begins',
        description: 'German forces launch rapid attack using combined arms',
        time: '1939-09-01',
        startTime: '',
        endTime: '',
        imageUrl: '',
        imageBase64: '',
        order: '0',
        isFictional: '',
        positionRelativeTo: '',
        positionType: '',
        userId: '',
      },
      {
        type: 'scene',
        id: 'scene-poland-2',
        parentId: 'invasion-poland',
        parentType: 'event',
        title: 'Soviet Invasion',
        description: 'Soviet Union invades from the east per Molotov-Ribbentrop Pact',
        time: '1939-09-17',
        startTime: '',
        endTime: '',
        imageUrl: '',
        imageBase64: '',
        order: '1',
        isFictional: '',
        positionRelativeTo: '',
        positionType: '',
        userId: '',
      },
      // Event 4: Battle of Britain
      {
        type: 'event',
        id: 'battle-britain',
        parentId: 'early-war-era',
        parentType: 'era',
        title: 'Battle of Britain',
        description: 'German air campaign against the United Kingdom',
        time: '1940-07-10',
        startTime: '',
        endTime: '',
        imageUrl: '',
        imageBase64: '',
        order: '4',
        isFictional: '',
        positionRelativeTo: '',
        positionType: '',
        userId: '',
      },
      {
        type: 'scene',
        id: 'scene-britain-1',
        parentId: 'battle-britain',
        parentType: 'event',
        title: 'Luftwaffe Attacks',
        description: 'German air force begins bombing British airfields',
        time: '1940-07-10',
        startTime: '',
        endTime: '',
        imageUrl: '',
        imageBase64: '',
        order: '0',
        isFictional: '',
        positionRelativeTo: '',
        positionType: '',
        userId: '',
      },
      {
        type: 'scene',
        id: 'scene-britain-2',
        parentId: 'battle-britain',
        parentType: 'event',
        title: 'RAF Victory',
        description: 'Royal Air Force successfully defends against Luftwaffe',
        time: '1940-10-15',
        startTime: '',
        endTime: '',
        imageUrl: '',
        imageBase64: '',
        order: '2',
        isFictional: '',
        positionRelativeTo: '',
        positionType: '',
        userId: '',
      },
    ];

    const csv = Papa.unparse(sampleRows, {
      header: true,
      skipEmptyLines: false,
    });

    return csv;
  }

  /**
   * Process base64 image data and save if needed
   * @param {string} imageData - Base64 image data with prefix (local:, remote:, base64:)
   * @param {string} itemId - Item ID
   * @param {string} itemType - Item type (timeline, era, event, scene)
   * @returns {Promise<void>}
   */
  async processImageBase64(imageData, itemId, itemType) {
    try {
      if (!imageData) return;

      if (imageData.startsWith('local:')) {
        // Local asset - just use the key
        const localKey = imageData.replace('local:', '');
        // Update the item with the local image key
        // This would need to be handled by the service
        return;
      }

      if (imageData.startsWith('remote:')) {
        // Remote URL - just use the URL
        const url = imageData.replace('remote:', '');
        // Update the item with the URL
        // This would need to be handled by the service
        return;
      }

      if (imageData.startsWith('base64:')) {
        // Base64 image - save to file
        const base64Data = imageData.replace('base64:', '');
        const filename = `${itemType}_${itemId}_${Date.now()}.jpg`;
        const filePath = `${RNFS.DocumentDirectoryPath}/images/${filename}`;
        
        // Ensure directory exists
        const dirPath = `${RNFS.DocumentDirectoryPath}/images`;
        const dirExists = await RNFS.exists(dirPath);
        if (!dirExists) {
          await RNFS.mkdir(dirPath);
        }

        // Write file
        await RNFS.writeFile(filePath, base64Data, 'base64');
        
        // Update the item with the file path
        // This would need to be handled by the service
        return;
      }
    } catch (error) {
      console.error('Error processing image base64:', error);
    }
  }
}

export default new CSVService();

