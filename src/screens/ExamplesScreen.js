import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { SearchBar, Divider, Pagination } from '../components/UIComponents';

export default function ExamplesScreen() {
  const {
    theme,
    sentences,
    getSentenceDisplay,
    ITEMS_PER_PAGE,
    t,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredSentences = useMemo(() => {
    if (!searchQuery) return sentences;
    const query = searchQuery.toLowerCase();
    return sentences.filter(
      (sentence) =>
        sentence.sentence_primary?.toLowerCase().includes(query) ||
        sentence.sentence_secondary?.toLowerCase().includes(query) ||
        sentence.translation?.toLowerCase().includes(query)
    );
  }, [sentences, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredSentences.length / ITEMS_PER_PAGE));
  const paginatedSentences = filteredSentences.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSearchChange = (text) => {
    setSearchQuery(text);
    setCurrentPage(1);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={[]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.searchWrapper}>
            <SearchBar
              value={searchQuery}
              onChangeText={handleSearchChange}
              placeholder={t('searchExamplesPlaceholder')}
            />
          </View>

          <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>
            {searchQuery ? `${t('examplesSearchResults')} (${filteredSentences.length})` : `${t('allExamples')} (${sentences.length})`}
          </Text>

          {paginatedSentences.length === 0 && searchQuery ? (
            <Text style={[styles.noResults, { color: theme.textSecondary }]}>
              {t('noExamplesMatch', { query: searchQuery })}
            </Text>
          ) : (
            paginatedSentences.map((sentence, index) => (
              <View key={sentence.id}>
                <View style={styles.sentenceCard}>
                  <Text style={[styles.sentenceText, { color: theme.text }]}>
                    {getSentenceDisplay(sentence)}
                  </Text>
                  <Text style={[styles.translation, { color: theme.textSecondary }]}>
                    {sentence.translation}
                  </Text>
                  {sentence.source && (
                    <Text style={[styles.source, { color: theme.textTertiary }]}>
                      {sentence.source}
                    </Text>
                  )}
                </View>
                {index < paginatedSentences.length - 1 && <Divider marginY={4} />}
              </View>
            ))
          )}

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredSentences.length}
          />
        </View>
      </ScrollView>
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
  noResults: {
    textAlign: 'center',
    padding: 40,
    fontSize: 15,
  },
  sentenceCard: {
    paddingVertical: 8,
  },
  sentenceText: {
    fontSize: 15,
    marginBottom: 6,
  },
  translation: {
    fontSize: 14,
    marginBottom: 4,
  },
  source: {
    fontSize: 12,
    textAlign: 'right',
  },
});
