import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { Text, Button, useTheme, Card, ActivityIndicator, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import csvService from '../services/csvService';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

const ImportTimelineScreen = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  const { user } = useAuth();
  const { refreshTimelines } = useApp();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.csv, DocumentPicker.types.allFiles],
        copyTo: 'cachesDirectory',
      });

      if (result && result.length > 0) {
        const file = result[0];
        await handleImportFile(file);
      }
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        // User cancelled
        return;
      }
      console.error('Error picking file:', error);
      Alert.alert('Error', 'Failed to pick file. Please try again.');
    }
  };

  const handleImportFile = async (file) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to import timelines');
      return;
    }

    setLoading(true);
    try {
      // Read file content
      let filePath = file.uri;
      
      // Handle different file path formats
      if (Platform.OS === 'ios') {
        // iOS returns file:// URL
        filePath = file.uri.replace('file://', '');
      } else {
        // Android
        filePath = file.uri;
      }

      const csvData = await RNFS.readFile(filePath, 'utf8');

      // Validate CSV has content
      if (!csvData || csvData.trim().length === 0) {
        throw new Error('CSV file is empty');
      }

      // Show preview (first few lines)
      const lines = csvData.split('\n').slice(0, 5);
      setPreview({
        filename: file.name || 'timeline.csv',
        preview: lines.join('\n'),
        fullData: csvData,
      });
    } catch (error) {
      console.error('Error reading file:', error);
      Alert.alert('Error', `Failed to read file: ${error.message}`);
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!preview || !user) {
      return;
    }

    setLoading(true);
    try {
      const timeline = await csvService.importTimelineFromCSV(preview.fullData, user.uid);
      
      await refreshTimelines();
      
      Alert.alert(
        'Import Successful',
        `Timeline "${timeline.title}" has been imported successfully!`,
        [
          {
            text: 'View Timeline',
            onPress: () => {
              navigation.navigate('TimelineDetail', { timelineId: timeline.id });
            },
          },
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error importing timeline:', error);
      Alert.alert('Import Failed', error.message || 'Failed to import timeline. Please check the CSV format.');
    } finally {
      setLoading(false);
      setPreview(null);
    }
  };

  const handleCancelPreview = () => {
    setPreview(null);
  };

  const handleOpenCSVFormatDocs = () => {
    // Open CSV format documentation
    Alert.alert(
      'CSV Format Documentation',
      `The CSV file should contain the following columns:
      
Required columns:
- type: timeline, era, event, or scene
- id: Unique identifier
- parentId: ID of parent item (empty for timeline)
- parentType: Type of parent (empty for timeline)
- title: Item title
- description: Item description
- time: Time value (for events/scenes)
- startTime: Start time (for eras)
- endTime: End time (for eras)
- imageUrl: Image URL (optional)
- imageBase64: Base64 encoded image (optional)
- order: Display order
- isFictional: true/false (timeline only)
- positionRelativeTo: Relative position reference
- positionType: Position type
- userId: User ID (timeline only)

The CSV should have one row per item (timeline, era, event, scene).
Download the template to see an example format.`,
      [{ text: 'OK' }]
    );
  };

  const handleDownloadTemplate = async () => {
    try {
      const csvTemplate = csvService.generateCSVTemplate();
      const filename = `timeline_template_${Date.now()}.csv`;
      const filePath = `${RNFS.CachesDirectoryPath}/${filename}`;
      
      // Write file to cache directory
      await RNFS.writeFile(filePath, csvTemplate, 'utf8');

      // Share the file
      await Share.open({
        url: Platform.OS === 'ios' ? `file://${filePath}` : `file://${filePath}`,
        type: 'text/csv',
        filename: filename,
        title: 'Download CSV Template',
      });

      // Clean up after a delay
      setTimeout(() => {
        RNFS.unlink(filePath).catch(console.error);
      }, 5000);
    } catch (error) {
      console.error('Error downloading template:', error);
      if (error.message !== 'User did not share') {
        Alert.alert('Error', 'Failed to download template. Please try again.');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <IconButton
          icon="arrow-left"
          iconColor={theme.colors.onSurface}
          size={24}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
        <View style={styles.topBarTitle}>
          <Text variant="headlineSmall" style={styles.title}>
            Import Timeline
          </Text>
        </View>
        <View style={styles.topBarSpacer} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Select a CSV file to import a timeline
          </Text>
          <View style={styles.docsButtons}>
            <Button
              mode="text"
              onPress={handleDownloadTemplate}
              icon="download"
              textColor={theme.colors.primary}
              style={styles.docsLink}
            >
              Download CSV Template
            </Button>
            <Button
              mode="text"
              onPress={handleOpenCSVFormatDocs}
              icon="information-outline"
              textColor={theme.colors.secondary}
              style={styles.docsLink}
            >
              View Format Documentation
            </Button>
          </View>
        </View>

        {!preview ? (
          <View style={styles.content}>
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.cardTitle}>
                  Select CSV File
                </Text>
                <Text variant="bodySmall" style={styles.cardText}>
                  Choose a CSV file exported from Timeline App to import.
                </Text>
                <Text variant="bodySmall" style={styles.cardText}>
                  The file should contain timeline data with all eras, events, and scenes.
                </Text>
              </Card.Content>
              <Card.Actions>
                <Button
                  mode="contained"
                  onPress={handlePickFile}
                  loading={loading}
                  disabled={loading}
                  style={styles.button}
                >
                  Choose File
                </Button>
              </Card.Actions>
            </Card>
          </View>
        ) : (
          <View style={styles.content}>
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.cardTitle}>
                  Preview
                </Text>
                <Text variant="bodySmall" style={styles.filename}>
                  File: {preview.filename}
                </Text>
                <View style={styles.previewContainer}>
                  <Text variant="bodySmall" style={styles.previewText}>
                    {preview.preview}
                  </Text>
                  <Text variant="bodySmall" style={styles.previewNote}>
                    ... (showing first 5 lines)
                  </Text>
                </View>
              </Card.Content>
              <Card.Actions style={styles.cardActions}>
                <Button
                  mode="outlined"
                  onPress={handleCancelPreview}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleConfirmImport}
                  loading={loading}
                  disabled={loading}
                >
                  Import
                </Button>
              </Card.Actions>
            </Card>
          </View>
        )}

        {loading && !preview && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text variant="bodyMedium" style={styles.loadingText}>
              Processing file...
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: '#1A1A2E',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A3E',
  },
  backButton: {
    margin: 0,
  },
  topBarTitle: {
    flex: 1,
    alignItems: 'center',
  },
  topBarSpacer: {
    width: 48, // Same width as back button to center title
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  subtitle: {
    color: '#9CA3AF',
    opacity: 0.8,
    marginBottom: 16,
    textAlign: 'center',
  },
  docsButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  docsLink: {
    marginTop: 8,
  },
  content: {
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#16213E',
  },
  cardTitle: {
    color: '#FFFFFF',
    marginBottom: 12,
  },
  cardText: {
    color: '#9CA3AF',
    marginBottom: 8,
  },
  filename: {
    color: '#8B5CF6',
    marginBottom: 16,
    fontFamily: 'monospace',
  },
  previewContainer: {
    backgroundColor: '#0F0F1E',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  previewText: {
    color: '#E0E0E0',
    fontFamily: 'monospace',
    fontSize: 12,
  },
  previewNote: {
    color: '#9CA3AF',
    marginTop: 8,
    fontStyle: 'italic',
  },
  cardActions: {
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  button: {
    marginTop: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 12,
  },
});

export default ImportTimelineScreen;

