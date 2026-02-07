import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { SearchBar, Divider, POSBadge, Pagination } from '../components/UIComponents';
import DetailScreen from './DetailScreen';

export default function FavoritesScreen() {
  const {
    theme,
    favoriteEntries,
    getWordDisplay,
    ITEMS_PER_PAGE,
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
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.searchWrapper}>
            <SearchBar
              value={searchQuery}
              onChangeText={handleSearchChange}
              placeholder="お気に入りを検索..."
            />
          </View>

          <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>
            {searchQuery ? `検索結果 (${filteredFavorites.length})` : `お気に入り (${favoriteEntries.length})`}
          </Text>

          {favoriteEntries.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              お気に入りはまだありません
            </Text>
          ) : paginatedFavorites.length === 0 && searchQuery ? (
            <Text style={[styles.noResults, { color: theme.textSecondary }]}>
              「{searchQuery}」に一致するお気に入りが見つかりません
            </Text>
          ) : (
            <>
              {paginatedFavorites.map((entry, index) => (
                <View key={entry.id}>
                  <TouchableOpacity
                    onPress={() => handleSelectEntry(entry)}
                    style={styles.wordCard}
                  >
                    <Text style={[styles.wordText, { color: theme.text }]}>
                      {getWordDisplay(entry)}
                    </Text>
                    <View style={styles.wordMeta}>
                      <POSBadge text={entry.pos} />
                      <Text style={[styles.meaningText, { color: theme.textSecondary }]}>
                        {entry.meaning}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  {index < paginatedFavorites.length - 1 && <Divider marginY={4} />}
                </View>
              ))}

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={filteredFavorites.length}
              />
            </>
          )}
        </View>
      </ScrollView>

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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 24,
  },
  searchWrapper: {
    marginTop: 0,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 12,
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
  wordText: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
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
