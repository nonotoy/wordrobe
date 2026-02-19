import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { SearchBar, Divider, POSBadge, DialectBadge, Pagination } from '../components/UIComponents';
import DetailScreen from './DetailScreen';

export default function FavoritesScreen() {
  const {
    theme,
    favoriteEntries,
    getWordDisplay,
    ITEMS_PER_PAGE,
    t,
  } = useApp();

  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredFavorites = useMemo(() => {
    if (!searchQuery) return favoriteEntries;
    const query = searchQuery.toLowerCase();
    return favoriteEntries.filter(
      (entry) =>
        entry.src_primary?.toLowerCase().includes(query) ||
        entry.src_secondary?.toLowerCase().includes(query) ||
        entry.meaning?.toLowerCase().includes(query)
    );
  }, [favoriteEntries, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredFavorites.length / ITEMS_PER_PAGE));
  const paginatedFavorites = filteredFavorites.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSearchChange = (text) => {
    setSearchQuery(text);
    setCurrentPage(1);
  };

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
          onChangeText={handleSearchChange}
          placeholder={t('searchFavoritesPlaceholder')}
        />
      </View>

      <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>
        {searchQuery ? `${t('favoritesSearchResults')} (${filteredFavorites.length})` : `${t('allFavorites')} (${favoriteEntries.length})`}
      </Text>

      {favoriteEntries.length === 0 ? (
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          {t('noFavorites')}
        </Text>
      ) : paginatedFavorites.length === 0 && searchQuery ? (
        <Text style={[styles.noResults, { color: theme.textSecondary }]}>
          {t('noFavoritesMatch', { query: searchQuery })}
        </Text>
      ) : (
        <FlatList
          data={paginatedFavorites}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <View>
              <TouchableOpacity
                onPress={() => handleSelectEntry(item)}
                style={styles.wordCard}
              >
                <View style={styles.wordRow}>
                  <Text style={[styles.wordText, { color: theme.text }]}>
                    {getWordDisplay(item)}
                  </Text>
                  <DialectBadge text={item.dialect} />
                </View>
                <View style={styles.wordMeta}>
                  <POSBadge text={item.pos} />
                  <Text style={[styles.meaningText, { color: theme.textSecondary }]}>
                    {item.meaning}
                  </Text>
                </View>
              </TouchableOpacity>
              {index < paginatedFavorites.length - 1 && <Divider marginY={4} />}
            </View>
          )}
          style={styles.listContainer}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredFavorites.length}
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
    paddingBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    padding: 60,
    fontSize: 15,
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
    alignItems: 'center',
    gap: 8,
  },
  meaningText: {
    fontSize: 15,
  },
});
