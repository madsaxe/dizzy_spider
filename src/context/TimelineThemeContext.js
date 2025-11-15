import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TimelineThemeContext = createContext();

const THEME_STORAGE_KEY = 'timeline_theme';

const defaultTheme = {
  lineColor: '#8B6F47', // Sepia brown (Roman atlas)
  itemColors: {
    era: '#C17A5F', // Terracotta red
    event: '#D4AF37', // Deep gold
    scene: '#6B8E23', // Olive green
    default: '#8B6F47', // Sepia brown
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
  backgroundColor: '#F4E4BC', // Parchment/cream (Roman atlas)
  cardBackground: '#FAF0E6', // Light parchment
  textColor: '#3E2723', // Dark brown/black
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

