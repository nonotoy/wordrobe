import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { SearchBar, Divider, POSBadge, DialectBadge } from '../components/UIComponents';
import DetailScreen from './DetailScreen';

const SEARCH_MODES = ['exact', 'partial', 'prefix', 'suffix'];

export default function DictionaryScreen() {
  const {
    theme,
    searchQuery,
    setSearchQuery,
    searchMode,
    setSearchMode,
    filteredEntries,
    t,
  } = useApp();

  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const handleSelectEntry = (entry) => {
    setSelectedEntry(entry);
    setShowDetail(true);
  };

  const handleSelectRelated = (entry) => {
    setSelectedEntry(entry);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={[]}>
      <View style={[styles.headerDivider, { backgroundColor: theme.border }]} />

      <View style={styles.searchWrapper}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('searchPlaceholder')}
        />
        <View style={styles.modeRow}>
          {SEARCH_MODES.map((mode) => (
            <TouchableOpacity
              key={mode}
              onPress={() => setSearchMode(mode)}
              style={[
                styles.modeButton,
                {
                  backgroundColor: searchMode === mode ? theme.accent : theme.bgSecondary,
                },
              ]}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  { color: searchMode === mode ? '#fff' : theme.textSecondary },
                ]}
              >
                {t(`searchMode_${mode}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {searchQuery ? (
        <>
          <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>
            {`${t('searchResults')} (${filteredEntries.length})`}
          </Text>

          {filteredEntries.length === 0 ? (
            <Text style={[styles.noResults, { color: theme.textSecondary }]}>
              {t('noResults', { query: searchQuery })}
            </Text>
          ) : (
            <FlatList
              data={filteredEntries}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => (
                <View>
                  <WordCard entry={item} onPress={() => handleSelectEntry(item)} />
                  {index < filteredEntries.length - 1 && <Divider marginY={4} />}
                </View>
              )}
              style={styles.listContainer}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </>
      ) : null}

      <Modal
        visible={showDetail}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetail(false)}
      >
        {selectedEntry && (
          <DetailScreen
            entry={selectedEntry}
            onClose={() => setShowDetail(false)}
            onSelectRelated={handleSelectRelated}
          />
        )}
      </Modal>
    </SafeAreaView>
  );
}

function WordCard({ entry, onPress }) {
  const { theme, getWordDisplay } = useApp();

  return (
    <TouchableOpacity onPress={onPress} style={styles.wordCard}>
      <View style={styles.wordRow}>
        <Text style={[styles.wordText, { color: theme.text }]}>
          {getWordDisplay(entry)}
        </Text>
        <DialectBadge text={entry.dialect} />
      </View>
      <View style={styles.wordMeta}>
        <POSBadge text={entry.pos} />
        <Text style={[styles.meaningText, { color: theme.textSecondary }]}>
          {entry.meaning}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerDivider: {
    height: 1,
  },
  searchWrapper: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  modeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  modeButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  modeButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  noResults: {
    textAlign: 'center',
    padding: 40,
    fontSize: 15,
  },
  wordCard: {
    paddingVertical: 12,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  wordText: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  wordMeta: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  meaningText: {
    fontSize: 15,
    flex: 1,
    flexShrink: 1,
  },
});
