import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { SearchBar, Divider, POSBadge, DialectBadge, Pagination } from '../components/UIComponents';
import DetailScreen from './DetailScreen';

// Card height = paddingVertical 12*2 + wordText ~20 + wordRow marginBottom 4 + wordMeta ~20 = 68
// Divider height = marginVertical 4*2 + height 1 = 9
const CARD_HEIGHT = 68;
const DIVIDER_HEIGHT = 9;

export default function DictionaryScreen() {
  const {
    theme,
    searchQuery,
    setSearchQuery,
    filteredEntries,
    t,
  } = useApp();

  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [listHeight, setListHeight] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = listHeight > 0
    ? Math.max(1, Math.floor((listHeight + DIVIDER_HEIGHT) / (CARD_HEIGHT + DIVIDER_HEIGHT)))
    : 5;

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedEntries = filteredEntries.slice(
    (safeCurrentPage - 1) * itemsPerPage,
    safeCurrentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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
      </View>

      <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>
        {searchQuery
          ? `${t('searchResults')} (${Math.max(0, filteredEntries.length - 1)})`
          : `${t('recent')} (${Math.max(0, filteredEntries.length - 1)})`}
      </Text>

      <View
        style={styles.listContainer}
        onLayout={(e) => setListHeight(e.nativeEvent.layout.height)}
      >
        {paginatedEntries.length === 0 && searchQuery ? (
          <Text style={[styles.noResults, { color: theme.textSecondary }]}>
            {t('noResults', { query: searchQuery })}
          </Text>
        ) : (
          <FlatList
            data={paginatedEntries}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <View>
                <WordCard entry={item} onPress={() => handleSelectEntry(item)} />
                {index < paginatedEntries.length - 1 && <Divider marginY={4} />}
              </View>
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
          />
        )}
      </View>

      <Pagination
        currentPage={safeCurrentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredEntries.length}
      />

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
