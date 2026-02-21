import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LZString from 'lz-string';
import { parseCSV, parseEntriesFromCSV, parseSentencesFromCSV } from '../utils/csvParser';
import { getTranslation } from '../i18n/translations';

const AppContext = createContext();

const ITEMS_PER_PAGE = 10;

const RTL_LANGUAGES = ['ar', 'fa'];

const META_FIELDS = ['id', 'name', 'language1', 'language2', 'language1Code', 'language2Code', 'iconImage'];

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

const getDictMeta = (dict) => {
  const meta = {};
  META_FIELDS.forEach(f => { if (dict[f] !== undefined) meta[f] = dict[f]; });
  return meta;
};

const EMPTY_DATA = { entries: [], sentences: [], favorites: [], dataSources: [] };

const saveDictData = async (id, data) => {
  const json = JSON.stringify(data);
  const compressed = LZString.compressToUTF16(json);
  await AsyncStorage.setItem(`dict_data_${id}`, compressed);
};

const loadDictData = async (id) => {
  const compressed = await AsyncStorage.getItem(`dict_data_${id}`);
  if (!compressed) return { ...EMPTY_DATA };
  const json = LZString.decompressFromUTF16(compressed);
  return JSON.parse(json);
};

const deleteDictData = async (id) => {
  await AsyncStorage.removeItem(`dict_data_${id}`);
};

const createEmptyMeta = (id, options) => {
  const isObj = typeof options === 'object';
  return {
    id,
    name: isObj ? options.name : options,
    language1: isObj ? options.language1 : null,
    language2: isObj ? options.language2 : null,
    language1Code: isObj ? options.language1Code : null,
    language2Code: isObj ? options.language2Code : null,
    iconImage: null,
  };
};

export function AppProvider({ children }) {
  const [darkMode, setDarkMode] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('ja');
  const [dictionaries, setDictionaries] = useState([]); // metadata only
  const [currentDictionaryId, setCurrentDictionaryId] = useState(null);
  const [currentDictData, setCurrentDictData] = useState({ ...EMPTY_DATA });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState('partial');

  const theme = darkMode ? darkTheme : lightTheme;

  const t = useCallback((key, variables = {}) => {
    return getTranslation(selectedLanguage, key, variables);
  }, [selectedLanguage]);

  const currentMeta = dictionaries.find(d => d.id === currentDictionaryId) || null;

  // Backward-compatible: merge meta + data for components that access currentDictionary
  const currentDictionary = currentMeta
    ? { ...currentMeta, ...currentDictData }
    : null;

  useEffect(() => {
    loadPersistedData();
  }, []);

  // Migration: convert old single-key format to split format
  const migrateOldFormat = async (oldDictionaries, storedCurrentId) => {
    const metas = oldDictionaries.map(d => getDictMeta(d));

    // Save each dictionary's data separately (compressed)
    for (const dict of oldDictionaries) {
      const data = {
        entries: dict.entries || [],
        sentences: dict.sentences || [],
        favorites: dict.favorites || [],
        dataSources: dict.dataSources || [],
      };
      await saveDictData(dict.id, data);
    }

    // Save metadata
    await AsyncStorage.setItem('dictionaries_meta', JSON.stringify(metas));

    // Remove old key
    await AsyncStorage.removeItem('dictionaries');

    setDictionaries(metas);

    // Load current dictionary's data
    if (storedCurrentId) {
      const data = await loadDictData(storedCurrentId);
      setCurrentDictData(data);
    }
  };

  const loadPersistedData = async () => {
    try {
      const [
        storedDarkMode,
        storedLanguage,
        storedCurrentDictionaryId,
        storedOldDictionaries,
        storedNewMeta,
      ] = await Promise.all([
        AsyncStorage.getItem('darkMode'),
        AsyncStorage.getItem('selectedLanguage'),
        AsyncStorage.getItem('currentDictionaryId'),
        AsyncStorage.getItem('dictionaries'),       // old format
        AsyncStorage.getItem('dictionaries_meta'),   // new format
      ]);

      if (storedDarkMode) setDarkMode(JSON.parse(storedDarkMode));
      if (storedLanguage) {
        setSelectedLanguage(storedLanguage);
        const shouldBeRTL = RTL_LANGUAGES.includes(storedLanguage);
        if (I18nManager.isRTL !== shouldBeRTL) {
          I18nManager.allowRTL(shouldBeRTL);
          I18nManager.forceRTL(shouldBeRTL);
        }
      }
      if (storedCurrentDictionaryId) setCurrentDictionaryId(storedCurrentDictionaryId);

      // Check for old format and migrate
      if (storedOldDictionaries) {
        const oldDictionaries = JSON.parse(storedOldDictionaries);
        await migrateOldFormat(oldDictionaries, storedCurrentDictionaryId);
        return;
      }

      // New format
      if (storedNewMeta) {
        setDictionaries(JSON.parse(storedNewMeta));

        // Load current dictionary's data
        if (storedCurrentDictionaryId) {
          const data = await loadDictData(storedCurrentDictionaryId);
          setCurrentDictData(data);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const saveMeta = async (newMetas) => {
    await AsyncStorage.setItem('dictionaries_meta', JSON.stringify(newMetas));
    setDictionaries(newMetas);
  };

  const saveDarkMode = async (value) => {
    setDarkMode(value);
    await AsyncStorage.setItem('darkMode', JSON.stringify(value));
  };

  const saveLanguage = async (value) => {
    const shouldBeRTL = RTL_LANGUAGES.includes(value);
    if (I18nManager.isRTL !== shouldBeRTL) {
      I18nManager.allowRTL(shouldBeRTL);
      I18nManager.forceRTL(shouldBeRTL);
    }
    setSelectedLanguage(value);
    await AsyncStorage.setItem('selectedLanguage', value);
  };

  const saveCurrentDictionaryId = async (id) => {
    setCurrentDictionaryId(id);
    if (id) {
      await AsyncStorage.setItem('currentDictionaryId', id);
    } else {
      await AsyncStorage.removeItem('currentDictionaryId');
    }
  };

  const addDictionary = async (options) => {
    const id = Date.now().toString();
    const meta = createEmptyMeta(id, options);
    await saveMeta([...dictionaries, meta]);
    await saveDictData(id, { ...EMPTY_DATA });
    return { ...meta, ...EMPTY_DATA };
  };

  const deleteDictionary = async (id) => {
    await saveMeta(dictionaries.filter(d => d.id !== id));
    await deleteDictData(id);
    if (currentDictionaryId === id) {
      await saveCurrentDictionaryId(null);
      setCurrentDictData({ ...EMPTY_DATA });
    }
  };

  const updateDictionary = async (id, updates) => {
    // Separate meta updates from data updates
    const metaUpdates = {};
    const dataUpdates = {};
    let hasMetaUpdate = false;
    let hasDataUpdate = false;

    for (const [key, value] of Object.entries(updates)) {
      if (META_FIELDS.includes(key)) {
        metaUpdates[key] = value;
        hasMetaUpdate = true;
      } else {
        dataUpdates[key] = value;
        hasDataUpdate = true;
      }
    }

    // Update metadata if needed
    if (hasMetaUpdate) {
      const newMetas = dictionaries.map(d =>
        d.id === id ? { ...d, ...metaUpdates } : d
      );
      await saveMeta(newMetas);
    }

    // Update data if needed
    if (hasDataUpdate) {
      const isCurrentDict = id === currentDictionaryId;
      const existingData = isCurrentDict ? currentDictData : await loadDictData(id);
      const newData = { ...existingData, ...dataUpdates };
      await saveDictData(id, newData);

      // Update state if it's the current dictionary
      if (isCurrentDict) {
        setCurrentDictData(newData);
      }
    }
  };

  const selectDictionary = async (id) => {
    await saveCurrentDictionaryId(id);
    setSearchQuery('');

    // Load selected dictionary's data
    if (id) {
      const data = await loadDictData(id);
      setCurrentDictData(data);
    } else {
      setCurrentDictData({ ...EMPTY_DATA });
    }
  };

  const updateCurrentDictionary = async (updates) => {
    if (!currentDictionaryId) return;
    await updateDictionary(currentDictionaryId, updates);
  };

  const toggleFavorite = async (entryId) => {
    if (!currentDictionaryId) return;
    const favs = currentDictData.favorites || [];
    const newFavorites = favs.includes(entryId)
      ? favs.filter(id => id !== entryId)
      : [...favs, entryId];
    await updateCurrentDictionary({ favorites: newFavorites });
  };

  const isFavorite = (entryId) => {
    return (currentDictData.favorites || []).includes(entryId);
  };

  const entries = currentDictData.entries || [];
  const sentences = currentDictData.sentences || [];
  const favorites = currentDictData.favorites || [];
  const dataSources = currentDictData.dataSources || [];

  const filteredEntries = searchQuery
    ? (() => {
        const query = searchQuery.trim().toLowerCase();
        const match = (text) => {
          if (!text) return false;
          const lower = text.toLowerCase();
          switch (searchMode) {
            case 'exact': return lower === query;
            case 'prefix': return lower.startsWith(query);
            case 'suffix': return lower.endsWith(query);
            default: return lower.includes(query);
          }
        };
        const results = entries.filter(entry =>
          match(entry.src_primary) ||
          match(entry.src_secondary) ||
          match(entry.meaning)
        );
        return results.sort((a, b) => {
          const aExact = a.src_primary.toLowerCase() === query ? 0 : 1;
          const bExact = b.src_primary.toLowerCase() === query ? 0 : 1;
          return aExact - bExact;
        });
      })()
    : entries;

  const favoriteEntries = entries.filter(entry => favorites.includes(entry.id));

  const getWordDisplay = (entry) => entry.src_primary;
  const getSentenceDisplay = (sentence) => sentence.sentence_primary;

  const getExamplesForWord = (entry) => {
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

    // Tokenize sentence: split by space, then handle = separator
    const tokenizeSentence = (sentence) => {
      const words = sentence.split(/\s+/);
      const tokens = [];

      for (const word of words) {
        if (!word) continue;

        if (word.includes('=')) {
          // Split by = and add = to each part appropriately
          // word1=word2 → [word1=, =word2]
          // word1=word2=word3 → [word1=, =word2=, =word3]
          const parts = word.split('=');
          for (let i = 0; i < parts.length; i++) {
            if (!parts[i]) continue;
            let token = parts[i];
            if (i < parts.length - 1) token += '=';  // Not the last part
            if (i > 0) token = '=' + token;  // Not the first part
            tokens.push(token);
          }
        } else {
          tokens.push(word);
        }
      }

      return tokens;
    };

    // Check if token matches search word
    const matchesSearchWord = (token, searchWord) => {
      // If search word contains =, exact match required
      if (searchWord.includes('=')) {
        return token === searchWord;
      }
      // Otherwise, strip = from token and compare
      const stripped = token.replace(/=/g, '');
      return stripped === searchWord;
    };

    const seen = new Set();
    return sentences
      .filter(s => {
        const sentence = s.sentence_primary?.toLowerCase();
        if (!sentence) return false;

        const tokens = tokenizeSentence(sentence);
        const hasMatch = [...searchWords].some(searchWord =>
          tokens.some(token => matchesSearchWord(token, searchWord))
        );

        if (!hasMatch) return false;
        if (seen.has(s.id)) return false;
        seen.add(s.id);
        return true;
      })
      .slice(0, 15);
  };

  const getEntryById = (id) => entries.find(e => e.id === id);

  const loadData = async (content, fileExtension) => {
    if (!currentDictionaryId) throw new Error('No dictionary selected');

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
        const data = JSON.parse(content);

        if (data.entries) {
          newEntries = data.entries;
          importedType = 'dictionary';
        }

        if (data.sentences) {
          newSentences = data.sentences;
          importedType = importedType ? null : 'sentences';
        }

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

      const updates = {};
      if (newEntries) updates.entries = newEntries;
      if (newSentences) updates.sentences = newSentences;

      const expectedEntriesCount = newEntries?.length || 0;
      const expectedSentencesCount = newSentences?.length || 0;

      if (Object.keys(updates).length > 0) {
        await updateCurrentDictionary(updates);

        // Validate import: verify saved data matches what we tried to save
        const savedData = await loadDictData(currentDictionaryId);

        if (expectedEntriesCount > 0) {
          const actualEntriesCount = savedData.entries?.length || 0;
          if (actualEntriesCount !== expectedEntriesCount) {
            throw new Error(
              `Import incomplete: Expected ${expectedEntriesCount} entries but only ${actualEntriesCount} were saved. Please try importing again.`
            );
          }
        }

        if (expectedSentencesCount > 0) {
          const actualSentencesCount = savedData.sentences?.length || 0;
          if (actualSentencesCount !== expectedSentencesCount) {
            throw new Error(
              `Import incomplete: Expected ${expectedSentencesCount} sentences but only ${actualSentencesCount} were saved. Please try importing again.`
            );
          }
        }
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

  const isRTL = RTL_LANGUAGES.includes(selectedLanguage);

  const value = {
    darkMode,
    selectedLanguage,
    isRTL,
    theme,
    t,
    setDarkMode: saveDarkMode,
    setSelectedLanguage: saveLanguage,

    dictionaries,
    currentDictionary,
    currentDictionaryId,
    addDictionary,
    deleteDictionary,
    updateDictionary,
    selectDictionary,

    entries,
    sentences,
    favorites,
    dataSources,
    searchQuery,
    searchMode,
    setSearchMode,
    filteredEntries,
    favoriteEntries,
    ITEMS_PER_PAGE,

    setSearchQuery,
    toggleFavorite,
    isFavorite,
    setDataSources,
    loadData,

    getWordDisplay,
    getSentenceDisplay,
    getExamplesForWord,
    getEntryById,
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
