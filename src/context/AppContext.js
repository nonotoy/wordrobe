import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseCSV, parseEntriesFromCSV, parseSentencesFromCSV } from '../utils/csvParser';

const AppContext = createContext();

const ITEMS_PER_PAGE = 20;

const lightTheme = {
  bg: '#ffffff',
  bgSecondary: '#f8f9fa',
  text: '#1a1a1b',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',
  border: '#e5e7eb',
  accent: '#1e3a5f',
  accentLight: '#e8eef5',
  accentText: '#1e3a5f',
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
  accent: '#1e3a5f',
  accentLight: '#2d4a6f',
  accentText: '#e8eef5',
  star: '#f59e0b',
  starInactive: '#3f3f46',
  disabled: '#3f3f46',
  successLight: '#14532d',
  successText: '#bbf7d0',
  warningLight: '#713f12',
  warningText: '#fef08a',
};

// デフォルトの辞書テンプレート
const createEmptyDictionary = (id, name) => ({
  id,
  name,
  iconImage: null,
  entries: [],
  sentences: [],
  favorites: [],
  dataSources: [],
});

export function AppProvider({ children }) {
  // グローバル設定
  const [darkMode, setDarkMode] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('ja');

  // 辞書データ
  const [dictionaries, setDictionaries] = useState([]);
  const [currentDictionaryId, setCurrentDictionaryId] = useState(null);

  // UI状態
  const [searchQuery, setSearchQuery] = useState('');
  const [homePage, setHomePage] = useState(1);
  const [examplesPage, setExamplesPage] = useState(1);
  const [favoritesPage, setFavoritesPage] = useState(1);

  const theme = darkMode ? darkTheme : lightTheme;

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
  const addDictionary = async (name) => {
    const newDictionary = createEmptyDictionary(Date.now().toString(), name);
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
    ? entries.filter(entry =>
        entry.src_primary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (entry.src_secondary && entry.src_secondary.includes(searchQuery)) ||
        entry.meaning.includes(searchQuery)
      )
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
    const word = entry.src_primary.toLowerCase();
    return sentences
      .filter(s => {
        if (!s.sentence_primary.toLowerCase().includes(word)) return false;
        // dataSourceIdがある場合、同じデータソースの例文のみ表示
        if (entry.dataSourceId && s.dataSourceId) {
          return entry.dataSourceId === s.dataSourceId;
        }
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
    theme,
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
