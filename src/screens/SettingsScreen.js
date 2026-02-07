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
import { CheckIcon, BookIcon, XIcon, FolderIcon } from '../components/Icons';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const {
    theme,
    currentDictionary,
    dataSources,
    updateDictionary,
  } = useApp();

  const [showAddSource, setShowAddSource] = useState(false);
  const [newSourceName, setNewSourceName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [newSourceType, setNewSourceType] = useState('both');
  const [loading, setLoading] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [dictionaryName, setDictionaryName] = useState('');
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState([]);
  const [editingSource, setEditingSource] = useState(null);
  const [editSourceName, setEditSourceName] = useState('');
  const [editSourceType, setEditSourceType] = useState('both');

  const handleSaveName = async () => {
    if (!dictionaryName.trim() || !currentDictionary) return;
    await updateDictionary(currentDictionary.id, { name: dictionaryName.trim() });
    setEditingName(false);
  };

  const handlePickImage = async () => {
    if (!currentDictionary) return;

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('権限エラー', '画像ライブラリへのアクセス権限が必要です');
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
          'データソースを削除',
          `${selectedForDelete.length}件のデータソースを削除しますか？`,
          [
            {
              text: 'キャンセル',
              style: 'cancel',
              onPress: () => {
                setDeleteMode(false);
                setSelectedForDelete([]);
              },
            },
            {
              text: '削除',
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
      Alert.alert('エラー', 'ファイルの選択に失敗しました');
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
        throw new Error('データが見つかりません。JSONの形式を確認してください。');
      }

      const newSource = {
        id: Date.now().toString(),
        name: newSourceName,
        type: newSourceType,
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
      Alert.alert('成功', `${entriesCount}件の単語と${sentencesCount}件の例文を読み込みました`);
    } catch (error) {
      Alert.alert('エラー', error.message || 'データソースの追加に失敗しました');
    } finally {
      setLoading(false);
    }
  };


  const sortedDataSources = [...dataSources].sort((a, b) => {
    if (a.type === 'localization' && b.type !== 'localization') return 1;
    if (a.type !== 'localization' && b.type === 'localization') return -1;
    return 0;
  });

  const typeLabel = (type) => {
    switch (type) {
      case 'both': return '辞書+例文';
      case 'dictionary': return '辞書';
      case 'sentences': return '例文';
      case 'localization': return '表示言語';
      default: return type;
    }
  };

  const typeColors = (type) => {
    switch (type) {
      case 'both': return { bg: theme.accentLight, text: theme.accentText };
      case 'dictionary': return { bg: theme.accentLight, text: theme.accentText };
      case 'sentences': return { bg: theme.successLight, text: theme.successText };
      case 'localization': return { bg: theme.warningLight, text: theme.warningText };
      default: return { bg: theme.accentLight, text: theme.accentText };
    }
  };

  const handleEditSource = (source) => {
    setEditingSource(source);
    setEditSourceName(source.name);
    setEditSourceType(source.type);
  };

  const handleSaveSourceEdit = async () => {
    if (!editingSource || !editSourceName.trim()) return;
    const newDataSources = dataSources.map(s =>
      s.id === editingSource.id
        ? { ...s, name: editSourceName.trim(), type: editSourceType }
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
            辞書が選択されていません
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={[]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Data Sources */}
          <View style={[styles.section, { marginBottom: 36 }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                データソース
              </Text>
              <View style={styles.headerButtons}>
                {!deleteMode && (
                  <TouchableOpacity
                    onPress={() => setShowAddSource(!showAddSource)}
                    style={[styles.addButton, { backgroundColor: theme.accent }]}
                  >
                    <Text style={styles.addButtonText}>+ 追加</Text>
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
                      <TrashIcon
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
                      {deleteMode ? (selectedForDelete.length > 0 ? '削除する' : 'キャンセル') : '削除'}
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
                  placeholder="名前"
                  placeholderTextColor={theme.textTertiary}
                  style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                />

                <View style={styles.typeButtons}>
                  {['both', 'dictionary', 'sentences'].map(type => (
                    <TouchableOpacity
                      key={type}
                      onPress={() => setNewSourceType(type)}
                      style={[
                        styles.typeButton,
                        {
                          borderColor: newSourceType === type ? theme.accent : theme.border,
                          backgroundColor: newSourceType === type ? theme.accentLight : 'transparent',
                        }
                      ]}
                    >
                      <Text style={[
                        styles.typeButtonText,
                        { color: newSourceType === type ? theme.accentText : theme.textSecondary }
                      ]}>
                        {typeLabel(type)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  onPress={handlePickFile}
                  style={[styles.filePickerButton, { borderColor: theme.border }]}
                  disabled={loading}
                >
                  <FolderIcon color={theme.textSecondary} size={20} />
                  <Text style={[styles.filePickerText, { color: selectedFile ? theme.text : theme.textTertiary }]}>
                    {selectedFile ? selectedFile.name : 'ファイルを選択...'}
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.filePickerHint, { color: theme.textTertiary }]}>
                  Google Drive、iCloud、端末内のJSONファイルを選択できます
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
                      キャンセル
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
                      <Text style={styles.submitButtonText}>追加</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {sortedDataSources.length === 0 ? (
              <Text style={[styles.noDataText, { color: theme.textTertiary }]}>
                データソースがありません
              </Text>
            ) : (
              sortedDataSources.map((source, index) => (
                <View key={source.id}>
                  {editingSource?.id === source.id ? (
                    <View style={[styles.editSourceForm, { backgroundColor: theme.bgSecondary }]}>
                      <TextInput
                        value={editSourceName}
                        onChangeText={setEditSourceName}
                        placeholder="名前"
                        placeholderTextColor={theme.textTertiary}
                        style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                        autoFocus
                      />
                      <View style={styles.typeButtons}>
                        {['both', 'dictionary', 'sentences'].map(type => (
                          <TouchableOpacity
                            key={type}
                            onPress={() => setEditSourceType(type)}
                            style={[
                              styles.typeButton,
                              {
                                borderColor: editSourceType === type ? theme.accent : theme.border,
                                backgroundColor: editSourceType === type ? theme.accentLight : 'transparent',
                              }
                            ]}
                          >
                            <Text style={[
                              styles.typeButtonText,
                              { color: editSourceType === type ? theme.accentText : theme.textSecondary }
                            ]}>
                              {typeLabel(type)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <Text style={[styles.fileNameDisplay, { color: theme.textTertiary }]}>
                        {source.fileName || source.url || ''}
                      </Text>
                      <View style={styles.formButtons}>
                        <TouchableOpacity onPress={handleCancelSourceEdit}>
                          <Text style={[styles.cancelText, { color: theme.textSecondary }]}>
                            キャンセル
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
                          <Text style={styles.submitButtonText}>保存</Text>
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
                        <View style={styles.sourceNameRow}>
                          <Text style={[styles.sourceName, { color: theme.text }]}>
                            {source.name}
                          </Text>
                          <View style={[
                            styles.typeBadge,
                            { backgroundColor: typeColors(source.type).bg }
                          ]}>
                            <Text style={[
                              styles.typeBadgeText,
                              { color: typeColors(source.type).text }
                            ]}>
                              {typeLabel(source.type)}
                            </Text>
                          </View>
                        </View>
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
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              辞書名
            </Text>
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
                      キャンセル
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
                    <Text style={styles.submitButtonText}>保存</Text>
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
                <Text style={[styles.editLabel, { color: theme.accent }]}>変更</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Icon Image */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              辞書アイコン
            </Text>
            <View style={[styles.imagePickerContainer, { backgroundColor: theme.bgSecondary }]}>
              <View style={styles.imagePreview}>
                {currentDictionary?.iconImage ? (
                  <Image
                    source={{ uri: currentDictionary.iconImage }}
                    style={styles.previewImage}
                  />
                ) : (
                  <View style={[styles.previewIconPlaceholder, { backgroundColor: theme.accent }]}>
                    <BookIcon color="#fff" size={24} />
                  </View>
                )}
              </View>
              <View style={styles.imageActions}>
                <TouchableOpacity
                  onPress={handlePickImage}
                  style={[styles.imageButton, { backgroundColor: theme.accent }]}
                >
                  <Text style={styles.imageButtonText}>
                    {currentDictionary?.iconImage ? '画像を変更' : '画像を選択'}
                  </Text>
                </TouchableOpacity>
                {currentDictionary?.iconImage && (
                  <TouchableOpacity
                    onPress={handleRemoveImage}
                    style={[styles.imageButton, { borderColor: theme.border, borderWidth: 1 }]}
                  >
                    <Text style={[styles.imageButtonTextSecondary, { color: theme.textSecondary }]}>
                      画像を削除
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
  dictionaryName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  dictionaryStats: {
    fontSize: 15,
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
  sectionTitle: {
    fontSize: 15,
    marginBottom: 12,
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
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  typeButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  typeButtonText: {
    fontSize: 13,
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
  sourceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sourceName: {
    fontSize: 15,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '500',
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
  imagePickerContainer: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  imagePreview: {
    marginBottom: 16,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 16,
  },
  previewIconPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageActions: {
    flexDirection: 'row',
    gap: 12,
  },
  imageButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  imageButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  imageButtonTextSecondary: {
    fontSize: 14,
    fontWeight: '500',
  },
});
