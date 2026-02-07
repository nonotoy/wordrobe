import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { Toggle } from '../components/UIComponents';
import { ArrowLeftIcon, ChevronDownIcon, CheckIcon } from '../components/Icons';

const languages = [
  { code: 'ja', name: '日本語' },
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
  { code: 'fr', name: 'Français' },
];

export default function GlobalSettingsScreen({ navigation }) {
  const {
    theme,
    darkMode,
    setDarkMode,
    selectedLanguage,
    setSelectedLanguage,
  } = useApp();

  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ArrowLeftIcon color={theme.text} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>全体設定</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Language Selector */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              表示言語
            </Text>
            <TouchableOpacity
              onPress={() => setShowLanguageSelector(!showLanguageSelector)}
              style={[styles.optionRow, { backgroundColor: theme.bgSecondary, borderRadius: 12 }]}
            >
              <Text style={[styles.optionText, { color: theme.text }]}>
                {languages.find(l => l.code === selectedLanguage)?.name || '日本語'}
              </Text>
              <View style={{ transform: [{ rotate: showLanguageSelector ? '180deg' : '0deg' }] }}>
                <ChevronDownIcon color={theme.textTertiary} size={20} />
              </View>
            </TouchableOpacity>

            {showLanguageSelector && (
              <View style={[styles.languageList, { backgroundColor: theme.bgSecondary }]}>
                {languages.map((lang, index) => (
                  <TouchableOpacity
                    key={lang.code}
                    onPress={() => {
                      setSelectedLanguage(lang.code);
                      setShowLanguageSelector(false);
                    }}
                    style={[
                      styles.languageOption,
                      index < languages.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
                    ]}
                  >
                    <Text style={[
                      styles.languageText,
                      { color: selectedLanguage === lang.code ? theme.accent : theme.text },
                    ]}>
                      {lang.name}
                    </Text>
                    {selectedLanguage === lang.code && (
                      <CheckIcon color={theme.accent} size={18} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Dark Mode */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              表示
            </Text>
            <View style={[styles.optionRow, { backgroundColor: theme.bgSecondary, borderRadius: 12 }]}>
              <Text style={[styles.optionText, { color: theme.text }]}>
                ダークモード
              </Text>
              <Toggle value={darkMode} onValueChange={setDarkMode} />
            </View>
          </View>

          {/* About */}
          <Text style={[styles.aboutText, { color: theme.textTertiary }]}>
            Wordrobe v0.1.0
          </Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  headerRight: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 12,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  optionText: {
    fontSize: 15,
  },
  languageList: {
    borderRadius: 12,
    marginTop: 8,
    overflow: 'hidden',
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  languageText: {
    fontSize: 15,
  },
  aboutText: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
});
