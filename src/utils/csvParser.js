export function parseCSV(content) {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let insideQuotes = false;

  for (const char of content) {
    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentField);
      currentField = '';
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (currentField || currentRow.length > 0) {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      }
    } else {
      currentField += char;
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows;
}

export function parseEntriesFromCSV(rows, headers) {
  const entries = [];
  
  const getIndex = (...names) => {
    for (const name of names) {
      const idx = headers.indexOf(name);
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const idIndex = getIndex('id');
  const srcPrimaryIndex = getIndex('src_primary', 'srcprimary');
  const srcSecondaryIndex = getIndex('src_secondary', 'srcsecondary');
  const pronunciationIndex = getIndex('pronunciation');
  const meaningIndex = getIndex('meaning');
  const posIndex = getIndex('pos');
  const wordFormationIndex = getIndex('word_formation', 'wordformation');
  const sourceIndex = getIndex('source');
  const relatedWordsIndex = getIndex('related_words', 'relatedwords');

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 3) continue;

    const getValue = (index) => {
      if (index === -1 || !row[index]) return null;
      const val = row[index].trim();
      return val || null;
    };

    const srcPrimary = getValue(srcPrimaryIndex);
    if (!srcPrimary) continue;

    const relatedWordsRaw = getValue(relatedWordsIndex);
    let relatedWords = null;
    if (relatedWordsRaw) {
      if (relatedWordsRaw.startsWith('[')) {
        try {
          relatedWords = JSON.parse(relatedWordsRaw);
        } catch {
          relatedWords = relatedWordsRaw.split(',').map(s => s.trim()).filter(Boolean);
        }
      } else {
        const sep = relatedWordsRaw.includes(';') ? ';' : ',';
        relatedWords = relatedWordsRaw.split(sep).map(s => s.trim()).filter(Boolean);
      }
    }

    entries.push({
      id: getValue(idIndex) || String(i),
      src_primary: srcPrimary,
      src_secondary: getValue(srcSecondaryIndex),
      pronunciation: getValue(pronunciationIndex),
      meaning: getValue(meaningIndex) || '',
      pos: getValue(posIndex) || '',
      word_formation: getValue(wordFormationIndex),
      related_words: relatedWords,
      source: getValue(sourceIndex),
    });
  }

  return entries;
}

export function parseSentencesFromCSV(rows, headers) {
  const sentences = [];
  
  const getIndex = (...names) => {
    for (const name of names) {
      const idx = headers.indexOf(name);
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const idIndex = getIndex('id');
  const sentencePrimaryIndex = getIndex('sentence_primary', 'sentenceprimary');
  const sentenceSecondaryIndex = getIndex('sentence_secondary', 'sentencesecondary');
  const translationIndex = getIndex('translation');
  const sourceIndex = getIndex('source');

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 2) continue;

    const getValue = (index) => {
      if (index === -1 || !row[index]) return null;
      const val = row[index].trim();
      return val || null;
    };

    const sentencePrimary = getValue(sentencePrimaryIndex);
    if (!sentencePrimary) continue;

    sentences.push({
      id: getValue(idIndex) || `s${i}`,
      sentence_primary: sentencePrimary,
      sentence_secondary: getValue(sentenceSecondaryIndex),
      translation: getValue(translationIndex) || '',
      source: getValue(sourceIndex),
    });
  }

  return sentences;
}
