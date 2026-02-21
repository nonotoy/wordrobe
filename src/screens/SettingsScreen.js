import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useApp } from '../context/AppContext';
import { Divider } from '../components/UIComponents';
import { CheckIcon, XIcon, FolderIcon, BooksIcon, TextInputLeftIcon, PictureIcon, EarthAsiaIcon, SimpleBookIcon } from '../components/Icons';
import { resolveLanguageName, isValidISO639_3 } from '../utils/languages';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const {
    theme,
    currentDictionary,
    dataSources,
    updateDictionary,
    t,
  } = useApp();

  const [showAddSource, setShowAddSource] = useState(false);
  const [newSourceName, setNewSourceName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [dictionaryName, setDictionaryName] = useState('');
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState([]);
  const [editingSource, setEditingSource] = useState(null);
  const [editSourceName, setEditSourceName] = useState('');
  const [editingLanguages, setEditingLanguages] = useState(false);
  const [language1Input, setLanguage1Input] = useState('');
  const [language2Input, setLanguage2Input] = useState('');

  const handleSaveName = async () => {
    if (!dictionaryName.trim() || !currentDictionary) return;
    await updateDictionary(currentDictionary.id, { name: dictionaryName.trim() });
    setEditingName(false);
  };

  const handleSaveLanguages = async () => {
    if (!currentDictionary) return;
    // Both languages are required
    if (!language1Input.trim() || !language2Input.trim()) {
      Alert.alert(t('error'), t('languagesRequired'));
      return;
    }

    const resolvedLang1 = resolveLanguageName(language1Input);
    const resolvedLang2 = resolveLanguageName(language2Input);
    const isLang1Code = isValidISO639_3(language1Input);
    const isLang2Code = isValidISO639_3(language2Input);

    await updateDictionary(currentDictionary.id, {
      language1: resolvedLang1 || language1Input.trim(),
      language2: resolvedLang2 || language2Input.trim(),
      language1Code: isLang1Code ? language1Input.toLowerCase().trim() : null,
      language2Code: isLang2Code ? language2Input.toLowerCase().trim() : null,
    });
    setEditingLanguages(false);
  };

  const handlePickImage = async () => {
    if (!currentDictionary) return;

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(t('permissionError'), t('imagePermissionMessage'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0]) {
      await updateDictionary(currentDictionary.id, { iconImage: result.assets[0].uri });
    }
  };

  const handleRemoveImage = async () => {
    if (!currentDictionary) return;
    await updateDictionary(currentDictionary.id, { iconImage: null });
  };

  const handleToggleDeleteMode = () => {
    if (deleteMode) {
      // Already in delete mode - confirm deletion
      if (selectedForDelete.length > 0) {
        Alert.alert(
          t('deleteDataSources'),
          t('deleteDataSourcesConfirm', { count: selectedForDelete.length }),
          [
            {
              text: t('cancel'),
              style: 'cancel',
              onPress: () => {
                setDeleteMode(false);
                setSelectedForDelete([]);
              },
            },
            {
              text: t('delete'),
              style: 'destructive',
              onPress: async () => {
                const newDataSources = dataSources.filter(
                  (s) => !selectedForDelete.includes(s.id)
                );
                // データソースを削除すると同時に、エントリーと例文もクリア
                await updateDictionary(currentDictionary.id, {
                  dataSources: newDataSources,
                  entries: [],
                  sentences: [],
                });
                setDeleteMode(false);
                setSelectedForDelete([]);
              },
            },
          ]
        );
      } else {
        setDeleteMode(false);
        setSelectedForDelete([]);
      }
    } else {
      // Enter delete mode
      setDeleteMode(true);
      setSelectedForDelete([]);
    }
  };

  const handleToggleSelectForDelete = (id) => {
    setSelectedForDelete((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setSelectedFile(result.assets[0]);
      }
    } catch (error) {
      Alert.alert(t('error'), t('loadFailed'));
    }
  };

  const handleAddSource = async () => {
    if (!newSourceName || !selectedFile) return;

    setLoading(true);
    try {
      // Read file content
      const content = await FileSystem.readAsStringAsync(selectedFile.uri);

      // Parse JSON
      const data = JSON.parse(content);

      const entriesCount = data.entries?.length || 0;
      const sentencesCount = data.sentences?.length || 0;

      if (entriesCount === 0 && sentencesCount === 0) {
        throw new Error(t('noDataFound'));
      }

      const newSource = {
        id: Date.now().toString(),
        name: newSourceName,
        type: 'dictionary',
        fileName: selectedFile.name,
        enabled: true,
      };

      const updates = {
        dataSources: [...dataSources, newSource],
      };
      const prefix = newSource.id;
      if (data.entries) {
        const taggedEntries = data.entries.map(e => ({
          ...e,
          id: `${prefix}_${e.id}`,
          dataSourceId: prefix,
          related_words: e.related_words
            ? e.related_words.map(rId => `${prefix}_${rId}`)
            : undefined,
        }));
        updates.entries = [...(currentDictionary.entries || []), ...taggedEntries];
      }
      if (data.sentences) {
        const taggedSentences = data.sentences.map(s => ({
          ...s,
          id: `${prefix}_${s.id}`,
          dataSourceId: prefix,
        }));
        updates.sentences = [...(currentDictionary.sentences || []), ...taggedSentences];
      }

      await updateDictionary(currentDictionary.id, updates);
      setNewSourceName('');
      setSelectedFile(null);
      setShowAddSource(false);
      Alert.alert(t('success'), t('loadComplete', { entries: entriesCount, sentences: sentencesCount }));
    } catch (error) {
      Alert.alert(t('error'), error.message || t('loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const sortedDataSources = [...dataSources].sort((a, b) => {
    if (a.type === 'localization' && b.type !== 'localization') return 1;
    if (a.type !== 'localization' && b.type === 'localization') return -1;
    return 0;
  });

  const handleEditSource = (source) => {
    setEditingSource(source);
    setEditSourceName(source.name);
  };

  const handleSaveSourceEdit = async () => {
    if (!editingSource || !editSourceName.trim()) return;
    const newDataSources = dataSources.map(s =>
      s.id === editingSource.id
        ? { ...s, name: editSourceName.trim() }
        : s
    );
    await updateDictionary(currentDictionary.id, { dataSources: newDataSources });
    setEditingSource(null);
    setEditSourceName('');
  };

  const handleCancelSourceEdit = () => {
    setEditingSource(null);
    setEditSourceName('');
  };

  if (!currentDictionary) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={[]}>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            {t('noDictionaries')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={[]}>
      <View style={[styles.headerDivider, { backgroundColor: theme.border }]} />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Data Sources */}
          <View style={[styles.section, { marginBottom: 36 }]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <BooksIcon color={theme.textSecondary} size={16} />
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                  {t('dataSources')}
                </Text>
              </View>
              <View style={styles.headerButtons}>
                {!deleteMode && (
                  <TouchableOpacity
                    onPress={() => setShowAddSource(!showAddSource)}
                    style={[styles.addButton, { backgroundColor: theme.accent }]}
                  >
                    <Text style={styles.addButtonText}>+ {t('add')}</Text>
                  </TouchableOpacity>
                )}
                {sortedDataSources.length > 0 && (
                  <TouchableOpacity
                    onPress={handleToggleDeleteMode}
                    style={[
                      styles.deleteSourceButton,
                      {
                        borderColor: deleteMode ? '#dc2626' : theme.border,
                        backgroundColor: deleteMode && selectedForDelete.length > 0 ? '#dc2626' : 'transparent',
                      }
                    ]}
                  >
                    {deleteMode && selectedForDelete.length === 0 ? (
                      <XIcon
                        color="#dc2626"
                        size={14}
                      />
                    ) : (
                      <XIcon
                        color={deleteMode && selectedForDelete.length > 0 ? '#fff' : theme.textSecondary}
                        size={14}
                      />
                    )}
                    <Text style={[
                      styles.deleteSourceButtonText,
                      {
                        color: deleteMode && selectedForDelete.length > 0 ? '#fff' : (deleteMode ? '#dc2626' : theme.textSecondary)
                      }
                    ]}>
                      {deleteMode ? (selectedForDelete.length > 0 ? t('deleteConfirm') : t('cancel')) : t('delete')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {showAddSource && (
              <View style={[styles.addSourceForm, { backgroundColor: theme.bgSecondary }]}>
                <TextInput
                  value={newSourceName}
                  onChangeText={setNewSourceName}
                  placeholder={t('name')}
                  placeholderTextColor={theme.textTertiary}
                  style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                />

                <TouchableOpacity
                  onPress={handlePickFile}
                  style={[styles.filePickerButton, { borderColor: theme.border }]}
                  disabled={loading}
                >
                  <FolderIcon color={theme.textSecondary} size={20} />
                  <Text style={[styles.filePickerText, { color: selectedFile ? theme.text : theme.textTertiary }]}>
                    {selectedFile ? selectedFile.name : t('selectFile')}
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.filePickerHint, { color: theme.textTertiary }]}>
                  {t('filePickerHint')}
                </Text>

                <View style={styles.formButtons}>
                  <TouchableOpacity
                    onPress={() => {
                      setShowAddSource(false);
                      setNewSourceName('');
                      setSelectedFile(null);
                    }}
                    disabled={loading}
                  >
                    <Text style={[styles.cancelText, { color: theme.textSecondary }]}>
                      {t('cancel')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleAddSource}
                    disabled={!newSourceName || !selectedFile || loading}
                    style={[
                      styles.submitButton,
                      {
                        backgroundColor: (!newSourceName || !selectedFile || loading)
                          ? theme.disabled
                          : theme.accent
                      }
                    ]}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.submitButtonText}>{t('add')}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {sortedDataSources.length === 0 ? (
              <Text style={[styles.noDataText, { color: theme.textTertiary }]}>
                {t('noDataSources')}
              </Text>
            ) : (
              sortedDataSources.map((source, index) => (
                <View key={source.id}>
                  {editingSource?.id === source.id ? (
                    <View style={[styles.editSourceForm, { backgroundColor: theme.bgSecondary }]}>
                      <TextInput
                        value={editSourceName}
                        onChangeText={setEditSourceName}
                        placeholder={t('name')}
                        placeholderTextColor={theme.textTertiary}
                        style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                        autoFocus
                      />
                      <Text style={[styles.fileNameDisplay, { color: theme.textTertiary, marginTop: 8 }]}>
                        {source.fileName || source.url || ''}
                      </Text>
                      <View style={styles.formButtons}>
                        <TouchableOpacity onPress={handleCancelSourceEdit}>
                          <Text style={[styles.cancelText, { color: theme.textSecondary }]}>
                            {t('cancel')}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={handleSaveSourceEdit}
                          disabled={!editSourceName.trim()}
                          style={[
                            styles.submitButton,
                            {
                              backgroundColor: !editSourceName.trim()
                                ? theme.disabled
                                : theme.accent
                            }
                          ]}
                        >
                          <Text style={styles.submitButtonText}>{t('save')}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.sourceRow}
                      onPress={deleteMode ? () => handleToggleSelectForDelete(source.id) : () => handleEditSource(source)}
                      activeOpacity={0.7}
                    >
                      {deleteMode && (
                        <View style={[
                          styles.checkbox,
                          {
                            borderColor: selectedForDelete.includes(source.id) ? '#dc2626' : theme.border,
                            backgroundColor: selectedForDelete.includes(source.id) ? '#dc2626' : 'transparent',
                          }
                        ]}>
                          {selectedForDelete.includes(source.id) && (
                            <CheckIcon color="#fff" size={14} />
                          )}
                        </View>
                      )}
                      <View style={[styles.sourceInfo, { flex: 1 }]}>
                        <Text style={[styles.sourceName, { color: theme.text, marginBottom: 4 }]}>
                          {source.name}
                        </Text>
                        <Text
                          style={[styles.sourceURL, { color: theme.textTertiary }]}
                          numberOfLines={1}
                        >
                          {source.fileName || source.url || ''}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  {index < sortedDataSources.length - 1 && <Divider marginY={0} />}
                </View>
              ))
            )}
          </View>

          {/* Dictionary Name */}
          <View style={styles.section}>
            <View style={[styles.sectionTitleContainer, { marginBottom: 12 }]}>
              <TextInputLeftIcon color={theme.textSecondary} size={16} />
              <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                {t('dictionaryName')}
              </Text>
            </View>
            {editingName ? (
              <View style={[styles.editNameForm, { backgroundColor: theme.bgSecondary }]}>
                <TextInput
                  value={dictionaryName}
                  onChangeText={setDictionaryName}
                  style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                  autoFocus
                />
                <View style={styles.formButtons}>
                  <TouchableOpacity onPress={() => setEditingName(false)}>
                    <Text style={[styles.cancelText, { color: theme.textSecondary }]}>
                      {t('cancel')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSaveName}
                    disabled={!dictionaryName.trim()}
                    style={[
                      styles.submitButton,
                      {
                        backgroundColor: !dictionaryName.trim()
                          ? theme.disabled
                          : theme.accent
                      }
                    ]}
                  >
                    <Text style={styles.submitButtonText}>{t('save')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => {
                  setDictionaryName(currentDictionary?.name || '');
                  setEditingName(true);
                }}
                style={[styles.settingRow, { backgroundColor: theme.bgSecondary }]}
              >
                <Text style={[styles.settingText, { color: theme.text }]}>
                  {currentDictionary?.name}
                </Text>
                <Text style={[styles.editLabel, { color: theme.accent }]}>
{t('change')}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Languages */}
          <View style={styles.section}>
            <View style={[styles.sectionTitleContainer, { marginBottom: 12 }]}>
              <EarthAsiaIcon color={theme.textSecondary} size={16} />
              <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                {t('languages')}
              </Text>
            </View>
            {editingLanguages ? (
              <View style={[styles.editNameForm, { backgroundColor: theme.bgSecondary }]}>
                <Text style={[styles.languageLabel, { color: theme.textSecondary }]}>
                  {t('sourceLanguage')}
                </Text>
                <TextInput
                  value={language1Input}
                  onChangeText={setLanguage1Input}
                  placeholder={t('sourceLanguagePlaceholder')}
                  placeholderTextColor={theme.textTertiary}
                  style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                  autoFocus
                />
                {isValidISO639_3(language1Input) && resolveLanguageName(language1Input) && (
                  <Text style={[styles.resolvedLanguageHint, { color: theme.accent }]}>
                    → {resolveLanguageName(language1Input)}
                  </Text>
                )}
                <Text style={[styles.languageLabel, { color: theme.textSecondary, marginTop: 8 }]}>
                  {t('targetLanguage')}
                </Text>
                <TextInput
                  value={language2Input}
                  onChangeText={setLanguage2Input}
                  placeholder={t('targetLanguagePlaceholder')}
                  placeholderTextColor={theme.textTertiary}
                  style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                />
                {isValidISO639_3(language2Input) && resolveLanguageName(language2Input) && (
                  <Text style={[styles.resolvedLanguageHint, { color: theme.accent }]}>
                    → {resolveLanguageName(language2Input)}
                  </Text>
                )}
                <Text style={[styles.languageHint, { color: theme.textTertiary }]}>
                  {t('languageCodeHint')}
                </Text>
                <View style={styles.formButtons}>
                  <TouchableOpacity onPress={() => setEditingLanguages(false)}>
                    <Text style={[styles.cancelText, { color: theme.textSecondary }]}>
                      {t('cancel')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSaveLanguages}
                    disabled={!language1Input.trim() || !language2Input.trim()}
                    style={[
                      styles.submitButton,
                      {
                        backgroundColor: (!language1Input.trim() || !language2Input.trim())
                          ? theme.disabled
                          : theme.accent
                      }
                    ]}
                  >
                    <Text style={styles.submitButtonText}>{t('save')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => {
                  setLanguage1Input(currentDictionary?.language1 || '');
                  setLanguage2Input(currentDictionary?.language2 || '');
                  setEditingLanguages(true);
                }}
                style={[styles.settingRow, { backgroundColor: theme.bgSecondary }]}
              >
                <Text style={[styles.settingText, { color: theme.text }]}>
                  {currentDictionary?.language1 || '—'} ↔︎ {currentDictionary?.language2 || '—'}
                </Text>
                <Text style={[styles.editLabel, { color: theme.accent }]}>
                  {t('change')}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Icon Image */}
          <View style={styles.section}>
            <View style={[styles.sectionTitleContainer, { marginBottom: 12 }]}>
              <PictureIcon color={theme.textSecondary} size={16} />
              <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                {t('dictionaryIcon')}
              </Text>
            </View>
            <View style={[styles.settingRow, { backgroundColor: theme.bgSecondary }]}>
              <View style={styles.iconRowContent}>
                {currentDictionary?.iconImage ? (
                  <Image
                    source={{ uri: currentDictionary.iconImage }}
                    style={styles.iconRowImage}
                  />
                ) : (
                  <View style={styles.iconRowPlaceholder}>
                    <SimpleBookIcon color={theme.textSecondary} size={20} />
                  </View>
                )}
              </View>
              <View style={styles.iconRowActions}>
                <TouchableOpacity onPress={handlePickImage}>
                  <Text style={[styles.editLabel, { color: theme.accent }]}>
                    {currentDictionary?.iconImage ? t('change') : t('select')}
                  </Text>
                </TouchableOpacity>
                {currentDictionary?.iconImage && (
                  <TouchableOpacity onPress={handleRemoveImage} style={{ marginLeft: 12 }}>
                    <Text style={[styles.editLabel, { color: theme.textSecondary }]}>
                      {t('delete')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

        </View>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  deleteSourceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  deleteSourceButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 15,
  },
  noDataText: {
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
  },
  addButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  addSourceForm: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    marginBottom: 12,
  },
  filePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 8,
    borderStyle: 'dashed',
    padding: 14,
    marginBottom: 8,
  },
  filePickerText: {
    fontSize: 14,
    flex: 1,
  },
  filePickerHint: {
    fontSize: 12,
    marginBottom: 12,
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 16,
  },
  cancelText: {
    fontSize: 14,
  },
  submitButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sourceInfo: {
    flex: 1,
  },
  sourceName: {
    fontSize: 15,
  },
  sourceURL: {
    fontSize: 12,
  },
  editSourceForm: {
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
  },
  fileNameDisplay: {
    fontSize: 12,
    marginBottom: 12,
  },
  editNameForm: {
    padding: 16,
    borderRadius: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  settingText: {
    fontSize: 15,
  },
  editLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  languageLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  resolvedLanguageHint: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  languageHint: {
    fontSize: 12,
    marginBottom: 12,
  },
  iconRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconRowImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  iconRowPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconRowActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
