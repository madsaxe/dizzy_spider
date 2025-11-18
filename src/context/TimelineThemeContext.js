import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TimelineThemeContext = createContext();

const THEME_STORAGE_KEY = 'timeline_theme';
const THEME_TYPE_KEY = 'timeline_theme_type'; // 'classic' | 'custom'

// Classic theme - paper/index card aesthetic with antique map colors
const classicTheme = {
  lineColor: '#8B7355', // Aged sepia brown
  itemColors: {
    era: '#A0826D', // Muted terracotta (aged)
    event: '#B8956A', // Aged gold
    scene: '#7A8B6B', // Muted olive green
    default: '#8B7355', // Aged sepia
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
  backgroundColor: '#F5F5DC', // Beige/cream (paper-like)
  cardBackground: '#FDF6E3', // Light cream (index card)
  textColor: '#3E2723', // Dark brown/sepia
  // Classic theme specific properties
  cardBorder: '#D4C4A8', // Subtle border color
  cardShadow: 'rgba(0, 0, 0, 0.1)', // Soft shadow
  paperTexture: true, // Indicates paper texture should be used
};

// Custom theme (formerly defaultTheme) - customizable theme
const customTheme = {
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

// Default theme is now Classic
const defaultTheme = classicTheme;

export const useTimelineTheme = () => {
  const context = useContext(TimelineThemeContext);
  if (!context) {
    throw new Error('useTimelineTheme must be used within TimelineThemeProvider');
  }
  return context;
};

export const TimelineThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(defaultTheme);
  const [themeType, setThemeType] = useState('classic'); // 'classic' | 'custom'
  const [loading, setLoading] = useState(true);

  // Load theme from storage on mount
  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      // Load theme type first
      const storedThemeType = await AsyncStorage.getItem(THEME_TYPE_KEY);
      const currentThemeType = storedThemeType || 'classic';
      setThemeType(currentThemeType);
      
      // Load theme based on type
      if (currentThemeType === 'classic') {
        setTheme(classicTheme);
      } else {
        const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (storedTheme) {
          const parsedTheme = JSON.parse(storedTheme);
          setTheme({ ...customTheme, ...parsedTheme });
        } else {
          setTheme(customTheme);
        }
      }
    } catch (error) {
      console.error('Error loading theme:', error);
      setTheme(defaultTheme);
    } finally {
      setLoading(false);
    }
  };

  const saveTheme = async (newTheme, type = 'custom') => {
    try {
      if (type === 'classic') {
        await AsyncStorage.setItem(THEME_TYPE_KEY, 'classic');
        setTheme(classicTheme);
        setThemeType('classic');
      } else {
        await AsyncStorage.setItem(THEME_TYPE_KEY, 'custom');
        await AsyncStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(newTheme));
        setTheme(newTheme);
        setThemeType('custom');
      }
    } catch (error) {
      console.error('Error saving theme:', error);
      throw error;
    }
  };

  const switchThemeType = useCallback(async (type) => {
    try {
      await AsyncStorage.setItem(THEME_TYPE_KEY, type);
      setThemeType(type);
      if (type === 'classic') {
        setTheme(classicTheme);
      } else {
        // Load custom theme from storage
        const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (storedTheme) {
          const parsedTheme = JSON.parse(storedTheme);
          setTheme({ ...customTheme, ...parsedTheme });
        } else {
          setTheme(customTheme);
        }
      }
    } catch (error) {
      console.error('Error switching theme type:', error);
    }
  }, []);

  const updateTheme = useCallback(async (updates) => {
    if (themeType === 'classic') {
      // Can't update classic theme, switch to custom first
      await switchThemeType('custom');
      const newTheme = { ...customTheme, ...updates };
      await saveTheme(newTheme, 'custom');
    } else {
      const newTheme = { ...theme, ...updates };
      await saveTheme(newTheme, 'custom');
    }
  }, [theme, themeType, switchThemeType]);

  const resetTheme = useCallback(async () => {
    if (themeType === 'classic') {
      await saveTheme(classicTheme, 'classic');
    } else {
      await saveTheme(customTheme, 'custom');
    }
  }, [themeType]);

  const getItemColor = useCallback((type) => {
    return theme.itemColors[type] || theme.itemColors.default;
  }, [theme]);

  const getSymbol = useCallback((type) => {
    return theme.symbols[type] || theme.symbols.default;
  }, [theme]);

  const value = {
    theme,
    themeType,
    loading,
    updateTheme,
    resetTheme,
    switchThemeType,
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

