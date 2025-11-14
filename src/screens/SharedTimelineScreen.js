import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Text, Button, useTheme, Card, ActivityIndicator, IconButton } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Share from 'react-native-share';
import sharingService from '../services/sharingService';
import TimelineVisualization from '../components/TimelineVisualization';

const SharedTimelineScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const theme = useTheme();
  const { shareId } = route.params;
  const [loading, setLoading] = useState(true);
  const [sharedData, setSharedData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSharedTimeline();
  }, [shareId]);

  const loadSharedTimeline = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await sharingService.getSharedTimeline(shareId);
      setSharedData(data);
    } catch (err) {
      console.error('Error loading shared timeline:', err);
      setError(err.message);
      Alert.alert('Error', err.message || 'Failed to load shared timeline');
    } finally {
      setLoading(false);
    }
  };

  const handleShareLink = async () => {
    try {
      const shareUrl = `timelineapp://shared/${shareId}`;
      await Share.open({
        message: `Check out this timeline: ${sharedData.timeline.title}\n${shareUrl}`,
        url: shareUrl,
        title: 'Share Timeline',
      });
    } catch (error) {
      if (error.message !== 'User did not share') {
        console.error('Error sharing link:', error);
      }
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="bodyMedium" style={styles.loadingText}>
            Loading shared timeline...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !sharedData) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.errorContainer}>
          <Text variant="headlineSmall" style={styles.errorTitle}>
            Error
          </Text>
          <Text variant="bodyMedium" style={styles.errorText}>
            {error || 'Failed to load shared timeline'}
          </Text>
          <Button
            mode="contained"
            onPress={() => navigation.goBack()}
            style={styles.button}
          >
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const { timeline, shareInfo } = sharedData;
  const isViewOnly = shareInfo.viewOnly && !shareInfo.editable;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          iconColor={theme.colors.onSurface}
          size={24}
          onPress={() => navigation.goBack()}
        />
        <View style={styles.headerContent}>
          <Text variant="titleLarge" style={styles.title}>
            {timeline.title}
          </Text>
          {isViewOnly && (
            <Text variant="bodySmall" style={styles.viewOnlyBadge}>
              View Only
            </Text>
          )}
        </View>
        <IconButton
          icon="share-variant"
          iconColor={theme.colors.onSurface}
          size={24}
          onPress={handleShareLink}
        />
      </View>

      {timeline.description && (
        <View style={styles.descriptionContainer}>
          <Text variant="bodyMedium" style={styles.description}>
            {timeline.description}
          </Text>
        </View>
      )}

      <View style={styles.timelineContainer}>
        <TimelineVisualization
          timelineId={timeline.id}
          isFictional={timeline.isFictional}
          onAddEra={isViewOnly ? undefined : () => {}}
          onAddEvent={isViewOnly ? undefined : () => {}}
          onAddScene={isViewOnly ? undefined : () => {}}
          onEraEdit={isViewOnly ? undefined : () => {}}
          onEventEdit={isViewOnly ? undefined : () => {}}
          onSceneEdit={isViewOnly ? undefined : () => {}}
          onEraDelete={isViewOnly ? undefined : () => {}}
          onEventDelete={isViewOnly ? undefined : () => {}}
          onSceneDelete={isViewOnly ? undefined : () => {}}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    color: '#FFFFFF',
    marginBottom: 12,
  },
  errorText: {
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A3E',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  viewOnlyBadge: {
    color: '#8B5CF6',
    marginTop: 4,
    fontSize: 11,
    fontWeight: '600',
  },
  descriptionContainer: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A3E',
  },
  description: {
    color: '#9CA3AF',
    textAlign: 'center',
  },
  timelineContainer: {
    flex: 1,
  },
});

export default SharedTimelineScreen;

