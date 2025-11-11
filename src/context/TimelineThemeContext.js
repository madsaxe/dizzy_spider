import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TimelineThemeContext = createContext();

const THEME_STORAGE_KEY = 'timeline_theme';

const defaultTheme = {
  lineColor: '#8B5CF6', // Vibrant purple
  itemColors: {
    era: '#06B6D4', // Electric cyan
    event: '#F59E0B', // Vibrant amber
    scene: '#EC4899', // Hot pink
    default: '#8B5CF6', // Purple
  },
  symbols: {
    era: '📅',
    event: '⭐',
    scene: '🎬',
    default: '•',
  },
  fontSizes: {
    title: 16,
    description: 12,
    time: 12,
  },
  spacing: {
    item: 12,
    line: 3,
  },
  backgroundColor: '#1A1A2E', // Dark background
  cardBackground: '#16213E', // Darker card background
  textColor: '#E0E0E0', // Light text
};

export const useTimelineTheme = () => {
  const context = useContext(TimelineThemeContext);
  if (!context) {
    throw new Error('useTimelineTheme must be used within TimelineThemeProvider');
  }
  return context;
};

export const TimelineThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(defaultTheme);
  const [loading, setLoading] = useState(true);

  // Load theme from storage on mount
  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (storedTheme) {
        const parsedTheme = JSON.parse(storedTheme);
        setTheme({ ...defaultTheme, ...parsedTheme });
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveTheme = async (newTheme) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(newTheme));
      setTheme(newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
      throw error;
    }
  };

  const updateTheme = useCallback(async (updates) => {
    const newTheme = { ...theme, ...updates };
    await saveTheme(newTheme);
  }, [theme]);

  const resetTheme = useCallback(async () => {
    await saveTheme(defaultTheme);
  }, []);

  const getItemColor = useCallback((type) => {
    return theme.itemColors[type] || theme.itemColors.default;
  }, [theme]);

  const getSymbol = useCallback((type) => {
    return theme.symbols[type] || theme.symbols.default;
  }, [theme]);

  const value = {
    theme,
    loading,
    updateTheme,
    resetTheme,
    getItemColor,
    getSymbol,
  };

  return (
    <TimelineThemeContext.Provider value={value}>
      {children}
    </TimelineThemeContext.Provider>
  );
};

export default TimelineThemeContext;

