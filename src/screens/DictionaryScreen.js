import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { SearchBar, Divider, POSBadge, Pagination } from '../components/UIComponents';
import DetailScreen from './DetailScreen';

export default function DictionaryScreen() {
  const {
    theme,
    searchQuery,
    setSearchQuery,
    filteredEntries,
    paginatedHomeEntries,
    homePage,
    setHomePage,
    homeTotalPages,
    getWordDisplay,
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
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.searchWrapper}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="単語を検索..."
            />
          </View>

          <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>
            {searchQuery ? `検索結果 (${filteredEntries.length})` : `最近 (${filteredEntries.length})`}
          </Text>

          {paginatedHomeEntries.length === 0 && searchQuery ? (
            <Text style={[styles.noResults, { color: theme.textSecondary }]}>
              「{searchQuery}」に一致する単語が見つかりません
            </Text>
          ) : (
            paginatedHomeEntries.map((entry, index) => (
              <View key={entry.id}>
                <WordCard entry={entry} onPress={() => handleSelectEntry(entry)} />
                {index < paginatedHomeEntries.length - 1 && <Divider marginY={4} />}
              </View>
            ))
          )}

          <Pagination
            currentPage={homePage}
            totalPages={homeTotalPages}
            onPageChange={setHomePage}
            totalItems={filteredEntries.length}
          />
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

function WordCard({ entry, onPress }) {
  const { theme, getWordDisplay } = useApp();

  return (
    <TouchableOpacity onPress={onPress} style={styles.wordCard}>
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
