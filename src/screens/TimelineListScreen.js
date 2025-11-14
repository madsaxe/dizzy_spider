import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Alert,
  Animated,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Button, Card, FAB, useTheme, IconButton } from 'react-native-paper';
import { useApp } from '../context/AppContext';
import { useNavigation } from '@react-navigation/native';
import seedDataService from '../services/seedDataService';
import csvService from '../services/csvService';
import { useAuth } from '../context/AuthContext';

const TimelineListScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { timelines, loading, refreshTimelines, deleteTimeline, userProgress } = useApp();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const swipeableRefs = useRef({});

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refreshTimelines();
    });
    return unsubscribe;
  }, [navigation]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshTimelines();
    setRefreshing(false);
  };

  const handleDelete = (timeline) => {
    Alert.alert(
      'Delete Timeline',
      `Are you sure you want to delete "${timeline.title}"? This will delete all eras, events, and scenes.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // Close the swipeable if it's open
            if (swipeableRefs.current[timeline.id]) {
              swipeableRefs.current[timeline.id].close();
            }
            await deleteTimeline(timeline.id);
            await refreshTimelines();
          },
        },
      ]
    );
  };

  const handleDeleteAll = () => {
    if (timelines.length === 0) {
      Alert.alert('No Timelines', 'There are no timelines to delete.');
      return;
    }

    Alert.alert(
      'Delete All Timelines',
      `⚠️ TEMPORARY FEATURE ⚠️\n\nAre you sure you want to delete ALL ${timelines.length} timeline(s)? This will permanently delete all eras, events, and scenes. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            // Close all open swipeables
            Object.values(swipeableRefs.current).forEach(ref => {
              if (ref) ref.close();
            });
            
            // Delete all timelines
            for (const timeline of timelines) {
              await deleteTimeline(timeline.id);
            }
            
            await refreshTimelines();
            Alert.alert('Success', 'All timelines have been deleted.');
          },
        },
      ]
    );
  };

  const renderRightActions = (progress, dragX, timeline) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.rightAction}>
        <Animated.View style={[styles.actionContent, { transform: [{ scale }] }]}>
          <IconButton
            icon="delete"
            iconColor="#FFFFFF"
            size={24}
            onPress={() => handleDelete(timeline)}
            style={styles.deleteIcon}
          />
          <Text style={styles.actionText}>Delete</Text>
        </Animated.View>
      </View>
    );
  };

  const handlePopulateExamples = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create example timelines');
      return;
    }

    Alert.alert(
      'Populate Example Timelines',
      'This will create two example timelines: one historical (World War II) and one fictional (The Chronicles of Eldoria). Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create Examples',
          onPress: async () => {
            try {
              await seedDataService.populateAllExamples(user.uid);
              await refreshTimelines();
              Alert.alert('Success', 'Example timelines created successfully!');
            } catch (error) {
              console.error('Error populating examples:', error);
              Alert.alert('Error', 'Failed to create example timelines');
            }
          },
        },
      ]
    );
  };

  const handleExportTimeline = async (timelineId) => {
    try {
      await csvService.exportAndShareTimeline(timelineId);
    } catch (error) {
      console.error('Error exporting timeline:', error);
      Alert.alert('Export Failed', error.message || 'Failed to export timeline');
    }
  };

  const handleImportTimeline = () => {
    navigation.navigate('ImportTimeline');
  };

  const renderTimelineItem = ({ item }) => {
    const closeOtherSwipeables = () => {
      Object.keys(swipeableRefs.current).forEach((key) => {
        if (key !== item.id && swipeableRefs.current[key]) {
          swipeableRefs.current[key].close();
        }
      });
    };

    return (
      <Swipeable
        ref={(ref) => {
          if (ref) {
            swipeableRefs.current[item.id] = ref;
          } else {
            delete swipeableRefs.current[item.id];
          }
        }}
        renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item)}
        rightThreshold={40}
        onSwipeableWillOpen={closeOtherSwipeables}
      >
        <Card
          style={styles.timelineItem}
          onPress={() => {
            // Close any open swipeables before navigating
            Object.values(swipeableRefs.current).forEach((ref) => {
              if (ref) ref.close();
            });
            navigation.navigate('TimelineDetail', { timelineId: item.id });
          }}
        >
        <Card.Content style={styles.timelineContent}>
          <Text variant="titleMedium" style={styles.timelineTitle}>{item.title}</Text>
          {item.description && (
            <Text variant="bodySmall" style={styles.timelineDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          <View style={styles.timelineMeta}>
            <Text variant="labelSmall" style={styles.timelineType}>
              {item.isFictional ? '📚 Fictional' : '📅 Historical'}
            </Text>
            <Text variant="labelSmall" style={styles.timelineDate}>
              Created {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </Card.Content>
        <Card.Actions>
          <Button
            mode="text"
            onPress={() => {
              // Close any open swipeables before exporting
              Object.values(swipeableRefs.current).forEach((ref) => {
                if (ref) ref.close();
              });
              handleExportTimeline(item.id);
            }}
            textColor={theme.colors.primary}
            icon="export"
          >
            Export
          </Button>
          <Button
            mode="text"
            onPress={() => {
              // Close any open swipeables before deleting
              Object.values(swipeableRefs.current).forEach((ref) => {
                if (ref) ref.close();
              });
              handleDelete(item);
            }}
            textColor="#EF4444"
          >
            Delete
          </Button>
        </Card.Actions>
      </Card>
    </Swipeable>
    );
  };

  if (loading && timelines.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text variant="bodyLarge">Loading timelines...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <View style={styles.headerTop}>
          <Text variant="headlineSmall" style={styles.headerTitle}>My Timelines</Text>
          <View style={styles.headerButtons}>
            <Button
              mode="outlined"
              onPress={handleImportTimeline}
              style={styles.importButton}
              icon="upload"
              compact
            >
              Import
            </Button>
          <Button
            mode="contained"
            onPress={handlePopulateExamples}
            style={styles.exampleButton}
          >
            📚 Examples
          </Button>
          </View>
        </View>
        <View style={styles.progressContainer}>
          <Text variant="bodySmall" style={styles.pointsText}>⭐ {userProgress.points} points</Text>
          <Text variant="bodySmall" style={styles.achievementsText}>
            🏆 {userProgress.achievements.length} achievements
          </Text>
        </View>
      </View>
      <FlatList
        data={timelines}
        renderItem={renderTimelineItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]} // Add padding to avoid FAB overlap
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="titleLarge" style={styles.emptyText}>No timelines yet</Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              Create your first timeline to get started!
            </Text>
            <View style={styles.emptyButtons}>
              <Button
                mode="contained"
                onPress={() => navigation.navigate('CreateTimeline')}
                style={[styles.createButton, { marginRight: 6 }]}
              >
                Create Timeline
              </Button>
              <Button
                mode="contained"
                onPress={handlePopulateExamples}
                style={[styles.exampleButtonEmpty, { marginLeft: 6 }]}
              >
                📚 Load Examples
              </Button>
            </View>
          </View>
        }
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />
      {/* Temporary Delete All Button */}
      <View style={[styles.deleteAllContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <Button
          mode="text"
          textColor="#9CA3AF"
          onPress={handleDeleteAll}
          style={styles.deleteAllButton}
          labelStyle={styles.deleteAllButtonLabel}
        >
          Delete All
        </Button>
      </View>
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('CreateTimeline')}
        label="Create"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitle: {
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  importButton: {
    marginRight: 4,
  },
  exampleButton: {
    marginLeft: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  pointsText: {
    opacity: 0.7,
  },
  achievementsText: {
    opacity: 0.7,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  timelineItem: {
    marginBottom: 10,
  },
  timelineContent: {
    paddingBottom: 0,
  },
  timelineTitle: {
    marginBottom: 6,
  },
  timelineDescription: {
    marginBottom: 8,
    opacity: 0.7,
  },
  timelineMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timelineType: {
    color: '#8B5CF6',
  },
  timelineDate: {
    opacity: 0.6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.7,
  },
  emptyButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButton: {
    // Paper Button handles styling
  },
  exampleButtonEmpty: {
    // Paper Button handles styling
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 80, // Move up to avoid overlap with Delete All button
    zIndex: 1000, // Ensure FAB is above other elements
    elevation: 8, // Android elevation
  },
  rightAction: {
    flex: 1,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'flex-end',
    borderRadius: 10,
    marginBottom: 10,
    marginRight: 0,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    height: '100%',
  },
  deleteIcon: {
    margin: 0,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  deleteAllContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    alignItems: 'flex-start',
  },
  deleteAllButton: {
    alignSelf: 'flex-start',
  },
  deleteAllButtonLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
});

export default TimelineListScreen;

