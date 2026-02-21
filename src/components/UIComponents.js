import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';
import { SearchIcon, XIcon, ChevronLeftIcon, ChevronRightIcon, StarIconCustom } from './Icons';

export function SearchBar({ value, onChangeText, placeholder }) {
  const { theme } = useApp();

  return (
    <View style={[styles.searchContainer, { backgroundColor: theme.bgSecondary }]}>
      <SearchIcon color={theme.textTertiary} size={20} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textTertiary}
        style={[styles.searchInput, { color: theme.text }]}
        autoCorrect={false}
        autoCapitalize="none"
        spellCheck={false}
      />
      <TouchableOpacity
        onPress={() => onChangeText('')}
        style={[styles.clearButton, { opacity: value ? 1 : 0 }]}
        disabled={!value}
      >
        <View style={[styles.clearButtonInner, { backgroundColor: theme.textTertiary }]}>
          <XIcon color={theme.bg} size={10} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

export function Divider({ marginY = 8 }) {
  const { theme } = useApp();
  return <View style={[styles.divider, { backgroundColor: theme.border, marginVertical: marginY }]} />;
}

export function POSBadge({ text }) {
  const { theme } = useApp();
  return (
    <View style={[styles.posBadge, { backgroundColor: theme.accentLight }]}>
      <Text style={[styles.posBadgeText, { color: theme.accentText }]}>{text}</Text>
    </View>
  );
}

export function DialectBadge({ text }) {
  const { theme } = useApp();
  if (!text) return null;
  return (
    <View style={[styles.dialectBadge, { backgroundColor: theme.border }]}>
      <Text style={[styles.dialectBadgeText, { color: theme.text }]}>{text}</Text>
    </View>
  );
}

export function FavoriteButton({ isFavorite, onPress, size = 24 }) {
  const { theme } = useApp();
  return (
    <TouchableOpacity onPress={onPress} style={styles.favoriteButton}>
      <StarIconCustom
        color={isFavorite ? theme.star : theme.starInactive}
        size={size}
        filled={isFavorite}
      />
    </TouchableOpacity>
  );
}

export function Pagination({ currentPage, totalPages, onPageChange, totalItems }) {
  const { theme } = useApp();

  // 10件以下の場合はページネーションを表示しない
  if (totalItems <= 10) return null;

  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <View style={styles.paginationContainer}>
      <TouchableOpacity
        onPress={() => canGoPrev && onPageChange(currentPage - 1)}
        disabled={!canGoPrev}
        style={[
          styles.paginationButton,
          { borderColor: canGoPrev ? theme.border : theme.disabled }
        ]}
      >
        <ChevronLeftIcon color={canGoPrev ? theme.text : theme.disabled} size={16} />
      </TouchableOpacity>

      <Text style={[
        styles.paginationText,
        { color: totalPages > 1 ? theme.textSecondary : theme.disabled }
      ]}>
        {currentPage} / {totalPages || 1}
      </Text>

      <TouchableOpacity
        onPress={() => canGoNext && onPageChange(currentPage + 1)}
        disabled={!canGoNext}
        style={[
          styles.paginationButton,
          { borderColor: canGoNext ? theme.border : theme.disabled }
        ]}
      >
        <ChevronRightIcon color={canGoNext ? theme.text : theme.disabled} size={16} />
      </TouchableOpacity>
    </View>
  );
}

export function Toggle({ value, onValueChange }) {
  const { theme } = useApp();
  
  return (
    <TouchableOpacity
      onPress={() => onValueChange(!value)}
      style={[
        styles.toggle,
        { backgroundColor: value ? theme.accent : theme.border }
      ]}
    >
      <View style={[
        styles.toggleKnob,
        { left: value ? 21 : 3 }
      ]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
  clearButtonInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
  },
  posBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  posBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  dialectBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dialectBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  favoriteButton: {
    padding: 8,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginTop: 24,
    marginBottom: 16,
  },
  paginationButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationText: {
    fontSize: 14,
  },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    position: 'relative',
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    position: 'absolute',
    top: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});
