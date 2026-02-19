import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { Divider, FavoriteButton, POSBadge } from '../components/UIComponents';
import { ChevronLeftIcon, SentenceExampleIcon, PlugConnectionIcon, ConjugationIcon } from '../components/Icons';

export default function DetailScreen({ entry, onClose, onSelectRelated }) {
  const {
    theme,
    isFavorite,
    toggleFavorite,
    getWordDisplay,
    getSentenceDisplay,
    getExamplesForWord,
    getEntryById,
    t,
  } = useApp();

  const examples = getExamplesForWord(entry);
  const hasDeclension = entry.declension && Object.keys(entry.declension).length > 0;
  const hasConjugation = entry.conjugation && Object.keys(entry.conjugation).length > 0;
  const hasWordFormation = entry.word_formation;
  const hasExamples = examples.length > 0;
  const hasRelatedWords = entry.related_words && entry.related_words.length > 0;

  const localizedKey = (key) => {
    const translationKey = {
      singular: 'singular',
      plural: 'plural',
      possessive: 'possessive',
    }[key];
    return translationKey ? t(translationKey) : key;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <ChevronLeftIcon color={theme.accent} size={20} />
          <Text style={[styles.backText, { color: theme.accent }]}>{t('back')}</Text>
        </TouchableOpacity>
        <FavoriteButton
          isFavorite={isFavorite(entry.id)}
          onPress={() => toggleFavorite(entry.id)}
          size={28}
        />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.titleSection}>
            <Text style={[styles.title, { color: theme.text }]}>
              {getWordDisplay(entry)}
            </Text>
            {entry.pronunciation && (
              <Text style={[styles.pronunciation, { color: theme.textSecondary }]}>
                /{entry.pronunciation}/
              </Text>
            )}
            <Divider marginY={16} />
          </View>

          {/* POS + Meaning */}
          <View style={styles.section}>
            <View style={[styles.posBadgeLarge, { backgroundColor: theme.accentLight }]}>
              <Text style={[styles.posBadgeLargeText, { color: theme.accentText }]}>
                {entry.pos}
              </Text>
            </View>
            <Text style={[styles.meaning, { color: theme.text }]}>{entry.meaning}</Text>
          </View>

          {/* Declension */}
          {hasDeclension && (
            <View style={styles.section}>
              <View style={styles.sectionTitleContainer}>
                <ConjugationIcon color={theme.textSecondary} size={16} />
                <Text style={[styles.sectionTitle, { color: theme.textSecondary, marginBottom: 0 }]}>{t('declension')}</Text>
              </View>
              {Object.entries(entry.declension).map(([key, value]) => (
                <View key={key} style={styles.keyValueRow}>
                  <Text style={[styles.keyText, { color: theme.textTertiary }]}>
                    {localizedKey(key)}
                  </Text>
                  <Text style={[styles.valueText, { color: theme.text }]}>{value}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Conjugation */}
          {hasConjugation && (
            <View style={styles.section}>
              <View style={styles.sectionTitleContainer}>
                <ConjugationIcon color={theme.textSecondary} size={16} />
                <Text style={[styles.sectionTitle, { color: theme.textSecondary, marginBottom: 0 }]}>{t('conjugation')}</Text>
              </View>
              {Object.entries(entry.conjugation).map(([key, value]) => (
                <View key={key} style={styles.keyValueRow}>
                  <Text style={[styles.keyText, { color: theme.textTertiary }]}>
                    {localizedKey(key)}
                  </Text>
                  <Text style={[styles.valueText, { color: theme.text }]}>{value}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Word Formation */}
          {hasWordFormation && (
            <View style={styles.section}>
              <View style={styles.sectionTitleContainer}>
                <PlugConnectionIcon color={theme.textSecondary} size={16} />
                <Text style={[styles.sectionTitle, { color: theme.textSecondary, marginBottom: 0 }]}>{t('wordFormation')}</Text>
              </View>
              <Text style={[styles.valueText, { color: theme.text }]}>{entry.word_formation}</Text>
            </View>
          )}

          {/* Examples */}
          {hasExamples && (
            <View style={styles.section}>
              <View style={styles.sectionTitleContainer}>
                <SentenceExampleIcon color={theme.textSecondary} size={16} />
                <Text style={[styles.sectionTitle, { color: theme.textSecondary, marginBottom: 0 }]}>
                  {t('examplesCount', { count: examples.length })}
                </Text>
              </View>
              {examples.map((sentence, index) => (
                <View key={sentence.id}>
                  <View style={styles.exampleItem}>
                    <Text style={[styles.exampleSentence, { color: theme.text }]}>
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
                  {index < examples.length - 1 && <Divider marginY={4} />}
                </View>
              ))}
            </View>
          )}

          {/* Related Words */}
          {hasRelatedWords && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t('seeAlso')}</Text>
              <View style={styles.relatedContainer}>
                {entry.related_words.map(relId => {
                  const relEntry = getEntryById(relId);
                  if (!relEntry) return null;
                  return (
                    <TouchableOpacity
                      key={relId}
                      onPress={() => onSelectRelated(relEntry)}
                      style={[styles.relatedButton, { backgroundColor: theme.accentLight }]}
                    >
                      <Text style={[styles.relatedText, { color: theme.accentText }]}>
                        {getWordDisplay(relEntry)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Source */}
          {entry.source && (
            <View style={[styles.sourceSection, { borderTopColor: theme.border }]}>
              <Text style={[styles.sourceText, { color: theme.textTertiary }]}>
                {t('sourceLabel')} {entry.source}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  backText: {
    fontSize: 15,
    marginLeft: 4,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  titleSection: {
    marginBottom: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
  },
  pronunciation: {
    fontSize: 16,
    fontStyle: 'italic',
    marginTop: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    marginBottom: 8,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  posBadgeLarge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  posBadgeLargeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  meaning: {
    fontSize: 15,
  },
  keyValueRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  keyText: {
    fontSize: 15,
    marginRight: 12,
  },
  valueText: {
    fontSize: 15,
  },
  exampleItem: {
    paddingVertical: 8,
  },
  exampleSentence: {
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
  relatedContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  relatedButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  relatedText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sourceSection: {
    borderTopWidth: 1,
    paddingTop: 16,
    marginTop: 8,
  },
  sourceText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});
