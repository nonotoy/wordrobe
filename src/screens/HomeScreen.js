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
import { BookIcon, GearIcon, PlusIcon, TrashIcon } from '../components/Icons';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DELETE_BUTTON_WIDTH = 64;
const SWIPE_THRESHOLD = DELETE_BUTTON_WIDTH + 10;

function SwipeableDictionaryCard({ dictionary, onPress, onDelete, theme }) {
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
          Animated.timing(translateX, {
            toValue: -DELETE_BUTTON_WIDTH,
            duration: 200,
            useNativeDriver: true,
          }).start();
          isOpen.current = true;
        } else {
          Animated.timing(translateX, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start();
          isOpen.current = false;
        }
      },
    })
  ).current;

  const closeSwipe = useCallback(() => {
    Animated.timing(translateX, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
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
      <Animated.View style={[styles.deleteAction, { opacity: deleteOpacity }]}>
        <TouchableOpacity
          onPress={() => {
            closeSwipe();
            onDelete();
          }}
          style={styles.deleteActionButton}
          activeOpacity={0.8}
        >
          <TrashIcon color="#fff" size={18} />
          <Text style={styles.deleteActionText}>削除</Text>
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
              <View style={[styles.dictionaryIcon, { backgroundColor: theme.accent }]}>
                <BookIcon color="#fff" size={20} />
              </View>
            )}
            <View style={styles.dictionaryMeta}>
              <Text style={[styles.dictionaryName, { color: theme.text }]}>
                {dictionary.name}
              </Text>
              <Text style={[styles.dictionaryStats, { color: theme.textTertiary }]}>
                {dictionary.entries?.length || 0} 単語 · {dictionary.sentences?.length || 0} 例文
              </Text>
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
  } = useApp();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newDictionaryName, setNewDictionaryName] = useState('');

  const handleAddDictionary = async () => {
    if (!newDictionaryName.trim()) return;

    const newDictionary = await addDictionary(newDictionaryName.trim());
    setNewDictionaryName('');
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
      '辞書を削除',
      `「${dictionary.name}」を削除しますか？この操作は取り消せません。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
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
            <View style={styles.logoContainer}>
              <View style={[styles.logoIcon, { backgroundColor: theme.accent }]}>
                <BookIcon color="#fff" size={28} />
              </View>
              <Text style={[styles.logoText, { color: theme.text }]}>Wordrobe</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('GlobalSettings')}
              style={[styles.settingsButton, { backgroundColor: theme.bgSecondary }]}
            >
              <GearIcon color={theme.textSecondary} size={22} />
            </TouchableOpacity>
          </View>

          {/* Dictionary List */}
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            辞書一覧
          </Text>

          {dictionaries.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: theme.bgSecondary }]}>
              <BookIcon color={theme.textTertiary} size={48} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                辞書がありません
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.textTertiary }]}>
                下のボタンから新しい辞書を追加してください
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
              />
            ))
          )}

          {/* Add Dictionary Form */}
          {showAddForm ? (
            <View style={[styles.addForm, { backgroundColor: theme.bgSecondary }]}>
              <TextInput
                value={newDictionaryName}
                onChangeText={setNewDictionaryName}
                placeholder="辞書名を入力..."
                placeholderTextColor={theme.textTertiary}
                style={[styles.addInput, { color: theme.text, borderColor: theme.border }]}
                autoFocus
              />
              <View style={styles.addFormButtons}>
                <TouchableOpacity onPress={() => {
                  setShowAddForm(false);
                  setNewDictionaryName('');
                }}>
                  <Text style={[styles.cancelText, { color: theme.textSecondary }]}>
                    キャンセル
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
                  <Text style={styles.addButtonText}>追加</Text>
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
                新しい辞書を追加
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
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 12,
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
    top: 4,
    bottom: 4,
    width: 64,
    backgroundColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  deleteActionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    width: '100%',
    gap: 2,
  },
  deleteActionText: {
    color: '#fff',
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
