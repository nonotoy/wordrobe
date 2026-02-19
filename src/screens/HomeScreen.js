import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Image,
  Animated,
  PanResponder,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { SettingsIcon2, PlusIcon, XIcon, BooksIcon, SimpleBookIcon, FaviconIcon2 } from '../components/Icons';
import { resolveLanguageName, isValidISO639_3, getLanguageByCode } from '../utils/languages';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DELETE_BUTTON_WIDTH = 64;
const SWIPE_THRESHOLD = DELETE_BUTTON_WIDTH + 10;

function SwipeableDictionaryCard({ dictionary, onPress, onDelete, theme, t }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const isOpen = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 15 && Math.abs(gestureState.dy) < 15,
      onPanResponderGrant: () => {
        translateX.setOffset(isOpen.current ? -DELETE_BUTTON_WIDTH : 0);
        translateX.setValue(0);
      },
      onPanResponderMove: Animated.event(
        [null, { dx: translateX }],
        {
          useNativeDriver: false,
          listener: (_, gestureState) => {
            const currentOffset = isOpen.current ? -DELETE_BUTTON_WIDTH : 0;
            const newValue = currentOffset + gestureState.dx;
            if (newValue > 0) {
              translateX.setOffset(0);
              translateX.setValue(0);
            } else if (newValue < -DELETE_BUTTON_WIDTH) {
              translateX.setOffset(-DELETE_BUTTON_WIDTH);
              translateX.setValue(0);
            }
          },
        }
      ),
      onPanResponderRelease: (_, gestureState) => {
        translateX.flattenOffset();
        const currentPos = isOpen.current ? -DELETE_BUTTON_WIDTH + gestureState.dx : gestureState.dx;

        if (currentPos < -SWIPE_THRESHOLD / 2) {
          Animated.spring(translateX, {
            toValue: -DELETE_BUTTON_WIDTH,
            useNativeDriver: true,
            tension: 100,
            friction: 10,
          }).start();
          isOpen.current = true;
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 10,
          }).start();
          isOpen.current = false;
        }
      },
    })
  ).current;

  const closeSwipe = useCallback(() => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
    isOpen.current = false;
  }, [translateX]);

  const deleteOpacity = translateX.interpolate({
    inputRange: [-DELETE_BUTTON_WIDTH, -1, 0],
    outputRange: [1, 1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.swipeContainer, { marginBottom: 12 }]}>
      <Animated.View style={[styles.deleteAction, { opacity: deleteOpacity, backgroundColor: theme.bgSecondary }]}>
        <TouchableOpacity
          onPress={() => {
            closeSwipe();
            onDelete();
          }}
          style={styles.deleteActionButton}
          activeOpacity={0.8}
        >
          <XIcon color="#dc2626" size={18} />
          <Text style={styles.deleteActionText}>{t('delete')}</Text>
        </TouchableOpacity>
      </Animated.View>
      <Animated.View
        style={{
          transform: [{ translateX: translateX.interpolate({
            inputRange: [-DELETE_BUTTON_WIDTH, 0],
            outputRange: [-DELETE_BUTTON_WIDTH, 0],
            extrapolate: 'clamp',
          }) }],
        }}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          onPress={() => {
            if (isOpen.current) {
              closeSwipe();
            } else {
              onPress();
            }
          }}
          activeOpacity={0.7}
          style={[styles.dictionaryCard, { backgroundColor: theme.bgSecondary }]}
        >
          <View style={styles.dictionaryInfo}>
            {dictionary.iconImage ? (
              <Image
                source={{ uri: dictionary.iconImage }}
                style={styles.dictionaryIconImage}
              />
            ) : (
              <SimpleBookIcon color={theme.textSecondary} size={28} />
            )}
            <View style={styles.dictionaryMeta}>
              <Text style={[styles.dictionaryName, { color: theme.text }]}>
                {dictionary.name}
              </Text>
              {(dictionary.language1 || dictionary.language2) && (
                <Text style={[styles.dictionaryStats, { color: theme.textTertiary }]}>
                  {dictionary.language1 || '—'} ↔︎ {dictionary.language2 || '—'}
                </Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

export default function HomeScreen({ navigation }) {
  const {
    theme,
    dictionaries,
    addDictionary,
    selectDictionary,
    deleteDictionary,
    t,
  } = useApp();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newDictionaryName, setNewDictionaryName] = useState('');
  const [language1, setLanguage1] = useState('');
  const [language2, setLanguage2] = useState('');

  // Resolve language names for display
  const resolvedLang1 = language1 ? resolveLanguageName(language1) : '';
  const resolvedLang2 = language2 ? resolveLanguageName(language2) : '';
  const isLang1Code = isValidISO639_3(language1);
  const isLang2Code = isValidISO639_3(language2);

  const handleAddDictionary = async () => {
    if (!newDictionaryName.trim()) return;

    const dictionaryData = {
      name: newDictionaryName.trim(),
      language1: resolvedLang1 || language1.trim() || null,
      language2: resolvedLang2 || language2.trim() || null,
      language1Code: isLang1Code ? language1.toLowerCase().trim() : null,
      language2Code: isLang2Code ? language2.toLowerCase().trim() : null,
    };

    const newDictionary = await addDictionary(dictionaryData);
    setNewDictionaryName('');
    setLanguage1('');
    setLanguage2('');
    setShowAddForm(false);

    // 新規辞書を選択して設定画面に遷移
    await selectDictionary(newDictionary.id);
    navigation.navigate('DictionaryTabs', { screen: 'DictionarySettings' });
  };

  const handleSelectDictionary = async (dictionary) => {
    await selectDictionary(dictionary.id);
    navigation.navigate('DictionaryTabs');
  };

  const handleDeleteDictionary = (dictionary) => {
    Alert.alert(
      t('deleteDictionary'),
      t('deleteDictionaryConfirm', { name: dictionary.name }),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: () => deleteDictionary(dictionary.id),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.faviconContainer}>
              <FaviconIcon2 size={36} />
            </View>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Home</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('GlobalSettings')}
              style={styles.settingsButton}
            >
              <SettingsIcon2 color={theme.textSecondary} size={22} />
            </TouchableOpacity>
          </View>

          {/* Dictionary List */}
          <View style={styles.sectionTitleContainer}>
            <BooksIcon color={theme.textSecondary} size={16} />
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              {t('dictionaryList')}
            </Text>
          </View>

          {dictionaries.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: theme.bgSecondary }]}>
              <BooksIcon color={theme.textTertiary} size={48} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                {t('noDictionaries')}
              </Text>
            </View>
          ) : (
            dictionaries.map((dictionary) => (
              <SwipeableDictionaryCard
                key={dictionary.id}
                dictionary={dictionary}
                onPress={() => handleSelectDictionary(dictionary)}
                onDelete={() => handleDeleteDictionary(dictionary)}
                theme={theme}
                t={t}
              />
            ))
          )}

          {/* Add Dictionary Form */}
          {showAddForm ? (
            <View style={[styles.addForm, { backgroundColor: theme.bgSecondary }]}>
              <Text style={[styles.addFormLabel, { color: theme.textSecondary }]}>
                {t('dictionaryName')}
              </Text>
              <TextInput
                value={newDictionaryName}
                onChangeText={setNewDictionaryName}
                placeholder={t('dictionaryNamePlaceholder')}
                placeholderTextColor={theme.textTertiary}
                style={[styles.addInput, { color: theme.text, borderColor: theme.border }]}
                autoFocus
              />

              <Text style={[styles.addFormLabel, { color: theme.textSecondary, marginTop: 12 }]}>
                {t('sourceLanguage')}
              </Text>
              <View style={styles.languageInputContainer}>
                <TextInput
                  value={language1}
                  onChangeText={setLanguage1}
                  placeholder={t('sourceLanguagePlaceholder')}
                  placeholderTextColor={theme.textTertiary}
                  style={[styles.addInput, styles.languageInput, { color: theme.text, borderColor: theme.border }]}
                />
                {isLang1Code && resolvedLang1 && (
                  <Text style={[styles.resolvedLanguage, { color: theme.accent }]}>
                    → {resolvedLang1}
                  </Text>
                )}
              </View>

              <Text style={[styles.addFormLabel, { color: theme.textSecondary, marginTop: 12 }]}>
                {t('targetLanguage')}
              </Text>
              <View style={styles.languageInputContainer}>
                <TextInput
                  value={language2}
                  onChangeText={setLanguage2}
                  placeholder={t('targetLanguagePlaceholder')}
                  placeholderTextColor={theme.textTertiary}
                  style={[styles.addInput, styles.languageInput, { color: theme.text, borderColor: theme.border }]}
                />
                {isLang2Code && resolvedLang2 && (
                  <Text style={[styles.resolvedLanguage, { color: theme.accent }]}>
                    → {resolvedLang2}
                  </Text>
                )}
              </View>

              <Text style={[styles.addFormHint, { color: theme.textTertiary }]}>
                {t('languageCodeHint')}
              </Text>

              <View style={styles.addFormButtons}>
                <TouchableOpacity onPress={() => {
                  setShowAddForm(false);
                  setNewDictionaryName('');
                  setLanguage1('');
                  setLanguage2('');
                }}>
                  <Text style={[styles.cancelText, { color: theme.textSecondary }]}>
                    {t('cancel')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAddDictionary}
                  disabled={!newDictionaryName.trim()}
                  style={[
                    styles.addButton,
                    {
                      backgroundColor: newDictionaryName.trim()
                        ? theme.accent
                        : theme.disabled,
                    },
                  ]}
                >
                  <Text style={styles.addButtonText}>{t('create')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => setShowAddForm(true)}
              style={[styles.newDictionaryButton, { borderColor: theme.border }]}
            >
              <PlusIcon color={theme.accent} size={20} />
              <Text style={[styles.newDictionaryText, { color: theme.accent }]}>
                {t('createNewDictionary')}
              </Text>
            </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  settingsButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faviconContainer: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  emptyState: {
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  swipeContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  deleteAction: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 64,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  deleteActionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    width: '100%',
    gap: 2,
  },
  deleteActionText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '600',
  },
  dictionaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  dictionaryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  dictionaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dictionaryIconImage: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  dictionaryMeta: {
    flex: 1,
  },
  dictionaryName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  dictionaryStats: {
    fontSize: 13,
  },
  addForm: {
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  addInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    marginBottom: 12,
  },
  addFormLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  languageInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  languageInput: {
    flex: 1,
    marginBottom: 0,
  },
  resolvedLanguage: {
    fontSize: 14,
    fontWeight: '500',
  },
  addFormHint: {
    fontSize: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  addFormButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 16,
  },
  cancelText: {
    fontSize: 15,
  },
  addButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  newDictionaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 12,
  },
  newDictionaryText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
