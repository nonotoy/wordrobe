import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseCSV, parseEntriesFromCSV, parseSentencesFromCSV } from '../utils/csvParser';
import { getTranslation } from '../i18n/translations';

const AppContext = createContext();

// Calculate items per page based on screen height
const calculateItemsPerPage = () => {
  const { height } = Dimensions.get('window');
  // Estimated fixed heights:
  // - Navigation header: ~44px
  // - Header divider: ~1px
  // - Search bar with padding: ~80px
  // - Section header: ~48px
  // - Pagination: ~60px
  // - Tab bar: ~84px (64px + average safe area bottom ~20px)
  // - List content padding: ~16px
  // Total: ~333px
  const fixedHeight = 333;
  const itemHeight = 70; // Card (paddingVertical 24 + content ~40) + divider (~8)
  const availableHeight = height - fixedHeight;
  const itemsPerPage = Math.floor(availableHeight / itemHeight);
  return Math.max(5, Math.min(itemsPerPage, 20)); // Between 5 and 20 items
};

const ITEMS_PER_PAGE = calculateItemsPerPage();

const lightTheme = {
  bg: '#ffffff',
  bgSecondary: '#f8f9fa',
  text: '#1a1a1b',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',
  border: '#e5e7eb',
  accent: '#FF6600',
  accentLight: '#fff3e6',
  accentText: '#FF6600',
  star: '#f59e0b',
  starInactive: '#d1d5db',
  disabled: '#d1d5db',
  successLight: '#dcfce7',
  successText: '#166534',
  warningLight: '#fef9c3',
  warningText: '#854d0e',
};

const darkTheme = {
  bg: '#0a0a0b',
  bgSecondary: '#141416',
  text: '#f0f0f2',
  textSecondary: '#8e8e93',
  textTertiary: '#5c5c63',
  border: '#2c2c2e',
  accent: '#FF6600',
  accentLight: '#4d2200',
  accentText: '#ffcc99',
  star: '#f59e0b',
  starInactive: '#3f3f46',
  disabled: '#3f3f46',
  successLight: '#14532d',
  successText: '#bbf7d0',
  warningLight: '#713f12',
  warningText: '#fef08a',
};

// デフォルトの辞書テンプレート
const createEmptyDictionary = (id, options) => {
  const name = typeof options === 'string' ? options : options.name;
  const language1 = typeof options === 'object' ? options.language1 : null;
  const language2 = typeof options === 'object' ? options.language2 : null;
  const language1Code = typeof options === 'object' ? options.language1Code : null;
  const language2Code = typeof options === 'object' ? options.language2Code : null;

  return {
    id,
    name,
    language1,
    language2,
    language1Code,
    language2Code,
    iconImage: null,
    entries: [],
    sentences: [],
    favorites: [],
    dataSources: [],
  };
};

export function AppProvider({ children }) {
  // グローバル設定
  const [darkMode, setDarkMode] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('ja');
  const [isLoading, setIsLoading] = useState(false);

  // 辞書データ
  const [dictionaries, setDictionaries] = useState([]);
  const [currentDictionaryId, setCurrentDictionaryId] = useState(null);

  // UI状態
  const [searchQuery, setSearchQuery] = useState('');
  const [homePage, setHomePage] = useState(1);
  const [examplesPage, setExamplesPage] = useState(1);
  const [favoritesPage, setFavoritesPage] = useState(1);

  const theme = darkMode ? darkTheme : lightTheme;

  // Translation function
  const t = useCallback((key, variables = {}) => {
    return getTranslation(selectedLanguage, key, variables);
  }, [selectedLanguage]);

  // 現在の辞書を取得
  const currentDictionary = dictionaries.find(d => d.id === currentDictionaryId) || null;

  // Load persisted data on mount
  useEffect(() => {
    loadPersistedData();
  }, []);

  const loadPersistedData = async () => {
    try {
      const [
        storedDarkMode,
        storedLanguage,
        storedDictionaries,
        storedCurrentDictionaryId,
      ] = await Promise.all([
        AsyncStorage.getItem('darkMode'),
        AsyncStorage.getItem('selectedLanguage'),
        AsyncStorage.getItem('dictionaries'),
        AsyncStorage.getItem('currentDictionaryId'),
      ]);

      if (storedDarkMode) setDarkMode(JSON.parse(storedDarkMode));
      if (storedLanguage) setSelectedLanguage(storedLanguage);
      if (storedDictionaries) setDictionaries(JSON.parse(storedDictionaries));
      if (storedCurrentDictionaryId) setCurrentDictionaryId(storedCurrentDictionaryId);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // Save functions
  const saveDarkMode = async (value) => {
    setDarkMode(value);
    await AsyncStorage.setItem('darkMode', JSON.stringify(value));
  };

  const saveLanguage = async (value) => {
    setSelectedLanguage(value);
    await AsyncStorage.setItem('selectedLanguage', value);
  };

  const saveDictionaries = async (newDictionaries) => {
    setDictionaries(newDictionaries);
    await AsyncStorage.setItem('dictionaries', JSON.stringify(newDictionaries));
  };

  const saveCurrentDictionaryId = async (id) => {
    setCurrentDictionaryId(id);
    if (id) {
      await AsyncStorage.setItem('currentDictionaryId', id);
    } else {
      await AsyncStorage.removeItem('currentDictionaryId');
    }
  };

  // 辞書操作
  const addDictionary = async (options) => {
    // options can be a string (name) or an object with name, language1, language2, etc.
    const newDictionary = createEmptyDictionary(Date.now().toString(), options);
    const newDictionaries = [...dictionaries, newDictionary];
    await saveDictionaries(newDictionaries);
    return newDictionary;
  };

  const deleteDictionary = async (id) => {
    const newDictionaries = dictionaries.filter(d => d.id !== id);
    await saveDictionaries(newDictionaries);
    if (currentDictionaryId === id) {
      await saveCurrentDictionaryId(null);
    }
  };

  const updateDictionary = async (id, updates) => {
    const newDictionaries = dictionaries.map(d =>
      d.id === id ? { ...d, ...updates } : d
    );
    await saveDictionaries(newDictionaries);
  };

  const selectDictionary = async (id) => {
    await saveCurrentDictionaryId(id);
    setSearchQuery('');
    setHomePage(1);
    setExamplesPage(1);
    setFavoritesPage(1);
  };

  // 現在の辞書のデータ操作
  const updateCurrentDictionary = async (updates) => {
    if (!currentDictionaryId) return;
    await updateDictionary(currentDictionaryId, updates);
  };

  const toggleFavorite = async (entryId) => {
    if (!currentDictionary) return;
    const favorites = currentDictionary.favorites || [];
    const newFavorites = favorites.includes(entryId)
      ? favorites.filter(id => id !== entryId)
      : [...favorites, entryId];
    await updateCurrentDictionary({ favorites: newFavorites });
  };

  const isFavorite = (entryId) => {
    if (!currentDictionary) return false;
    return (currentDictionary.favorites || []).includes(entryId);
  };

  // Computed values for current dictionary
  const entries = currentDictionary?.entries || [];
  const sentences = currentDictionary?.sentences || [];
  const favorites = currentDictionary?.favorites || [];
  const dataSources = currentDictionary?.dataSources || [];

  const filteredEntries = searchQuery
    ? entries.filter(entry => {
        const query = searchQuery.toLowerCase();
        return (
          entry.src_primary.toLowerCase().includes(query) ||
          (entry.src_secondary && entry.src_secondary.toLowerCase().includes(query)) ||
          entry.meaning.toLowerCase().includes(query)
        );
      })
    : entries;

  const favoriteEntries = entries.filter(entry => favorites.includes(entry.id));

  // Pagination helpers
  const paginate = (items, page) => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return items.slice(start, start + ITEMS_PER_PAGE);
  };

  const getTotalPages = (items) => Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));

  // Display helpers
  const getWordDisplay = (entry) => entry.src_primary;
  const getSentenceDisplay = (sentence) => sentence.sentence_primary;

  const getExamplesForWord = (entry) => {
    // 検索ワードを収集: src_primary + conjugation/declension/allomorphの全値
    const searchWords = new Set();
    searchWords.add(entry.src_primary.toLowerCase());

    const extractValues = (obj) => {
      if (!obj) return;
      if (typeof obj === 'string') {
        searchWords.add(obj.toLowerCase());
      } else if (Array.isArray(obj)) {
        obj.forEach(v => extractValues(v));
      } else if (typeof obj === 'object') {
        Object.values(obj).forEach(v => extractValues(v));
      }
    };

    extractValues(entry.conjugation);
    extractValues(entry.declension);
    extractValues(entry.allomorph);

    // 全辞書の例文を横断検索
    const allSentences = dictionaries.flatMap(d => d.sentences || []);

    // id重複排除しながらマッチする例文を返す
    const seen = new Set();
    return allSentences
      .filter(s => {
        const sentence = s.sentence_primary?.toLowerCase();
        if (!sentence) return false;
        if (![...searchWords].some(word => sentence.includes(word))) return false;
        if (seen.has(s.id)) return false;
        seen.add(s.id);
        return true;
      })
      .slice(0, 15);
  };

  const getEntryById = (id) => entries.find(e => e.id === id);

  // Data loading for current dictionary
  const loadData = async (content, fileExtension) => {
    if (!currentDictionaryId) throw new Error('辞書が選択されていません');

    try {
      let importedType = null;
      let newEntries = null;
      let newSentences = null;

      if (fileExtension === 'csv') {
        const rows = parseCSV(content);
        if (rows.length < 2) throw new Error('Empty data');

        const headers = rows[0].map(h => h.toLowerCase().trim());

        if (headers.includes('src_primary') || headers.includes('srcprimary')) {
          newEntries = parseEntriesFromCSV(rows, headers);
          importedType = 'dictionary';
        } else if (headers.includes('sentence_primary') || headers.includes('sentenceprimary')) {
          newSentences = parseSentencesFromCSV(rows, headers);
          importedType = 'sentences';
        }
      } else {
        // JSON
        const data = JSON.parse(content);

        if (data.entries) {
          newEntries = data.entries;
          importedType = 'dictionary';
        }

        if (data.sentences) {
          newSentences = data.sentences;
          importedType = importedType ? null : 'sentences';
        }

        // Handle arrays directly
        if (Array.isArray(data)) {
          if (data[0]?.src_primary) {
            newEntries = data;
            importedType = 'dictionary';
          } else if (data[0]?.sentence_primary) {
            newSentences = data;
            importedType = 'sentences';
          }
        }
      }

      // Update current dictionary
      const updates = {};
      if (newEntries) updates.entries = newEntries;
      if (newSentences) updates.sentences = newSentences;

      if (Object.keys(updates).length > 0) {
        await updateCurrentDictionary(updates);
      }

      return importedType;
    } catch (error) {
      console.error('Error loading data:', error);
      throw error;
    }
  };

  const setDataSources = async (sources) => {
    await updateCurrentDictionary({ dataSources: sources });
  };

  const value = {
    // Global settings
    darkMode,
    selectedLanguage,
    isLoading,
    theme,
    t,
    setDarkMode: saveDarkMode,
    setSelectedLanguage: saveLanguage,

    // Dictionaries
    dictionaries,
    currentDictionary,
    currentDictionaryId,
    addDictionary,
    deleteDictionary,
    updateDictionary,
    selectDictionary,

    // Current dictionary data
    entries,
    sentences,
    favorites,
    dataSources,
    searchQuery,
    filteredEntries,
    favoriteEntries,

    // Pagination
    homePage,
    examplesPage,
    favoritesPage,
    setHomePage,
    setExamplesPage,
    setFavoritesPage,
    ITEMS_PER_PAGE,
    paginatedHomeEntries: paginate(filteredEntries, homePage),
    paginatedSentences: paginate(sentences, examplesPage),
    paginatedFavorites: paginate(favoriteEntries, favoritesPage),
    homeTotalPages: getTotalPages(filteredEntries),
    examplesTotalPages: getTotalPages(sentences),
    favoritesTotalPages: getTotalPages(favoriteEntries),

    // Actions
    setSearchQuery: (query) => {
      setSearchQuery(query);
      setHomePage(1);
    },
    toggleFavorite,
    isFavorite,
    setDataSources,
    loadData,

    // Helpers
    getWordDisplay,
    getSentenceDisplay,
    getExamplesForWord,
    getEntryById,
    paginate,
    getTotalPages,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
