// ISO 639-3 language code mappings
// Common languages for dictionary use

const ISO639_3 = {
  // Major world languages
  eng: { name: 'English', nativeName: '英語' },
  jpn: { name: 'Japanese', nativeName: '日本語' },
  zho: { name: 'Chinese', nativeName: '中国語' },
  cmn: { name: 'Mandarin Chinese', nativeName: '北京語' },
  kor: { name: 'Korean', nativeName: '韓国語' },
  spa: { name: 'Spanish', nativeName: 'スペイン語' },
  fra: { name: 'French', nativeName: 'フランス語' },
  deu: { name: 'German', nativeName: 'ドイツ語' },
  rus: { name: 'Russian', nativeName: 'ロシア語' },
  por: { name: 'Portuguese', nativeName: 'ポルトガル語' },
  ita: { name: 'Italian', nativeName: 'イタリア語' },
  ara: { name: 'Arabic', nativeName: 'アラビア語' },
  hin: { name: 'Hindi', nativeName: 'ヒンディー語' },
  vie: { name: 'Vietnamese', nativeName: 'ベトナム語' },
  tha: { name: 'Thai', nativeName: 'タイ語' },
  ind: { name: 'Indonesian', nativeName: 'インドネシア語' },
  msa: { name: 'Malay', nativeName: 'マレー語' },
  nld: { name: 'Dutch', nativeName: 'オランダ語' },
  pol: { name: 'Polish', nativeName: 'ポーランド語' },
  tur: { name: 'Turkish', nativeName: 'トルコ語' },
  ukr: { name: 'Ukrainian', nativeName: 'ウクライナ語' },
  ell: { name: 'Greek', nativeName: 'ギリシャ語' },
  heb: { name: 'Hebrew', nativeName: 'ヘブライ語' },
  swe: { name: 'Swedish', nativeName: 'スウェーデン語' },
  nor: { name: 'Norwegian', nativeName: 'ノルウェー語' },
  dan: { name: 'Danish', nativeName: 'デンマーク語' },
  fin: { name: 'Finnish', nativeName: 'フィンランド語' },
  hun: { name: 'Hungarian', nativeName: 'ハンガリー語' },
  ces: { name: 'Czech', nativeName: 'チェコ語' },
  ron: { name: 'Romanian', nativeName: 'ルーマニア語' },
  bul: { name: 'Bulgarian', nativeName: 'ブルガリア語' },
  hrv: { name: 'Croatian', nativeName: 'クロアチア語' },
  srp: { name: 'Serbian', nativeName: 'セルビア語' },
  slk: { name: 'Slovak', nativeName: 'スロバキア語' },
  slv: { name: 'Slovenian', nativeName: 'スロベニア語' },
  lit: { name: 'Lithuanian', nativeName: 'リトアニア語' },
  lav: { name: 'Latvian', nativeName: 'ラトビア語' },
  est: { name: 'Estonian', nativeName: 'エストニア語' },

  // Indigenous and minority languages
  ain: { name: 'Ainu', nativeName: 'アイヌ語' },
  ryu: { name: 'Okinawan', nativeName: '沖縄語' },
  haw: { name: 'Hawaiian', nativeName: 'ハワイ語' },
  mri: { name: 'Maori', nativeName: 'マオリ語' },
  smo: { name: 'Samoan', nativeName: 'サモア語' },
  ton: { name: 'Tongan', nativeName: 'トンガ語' },
  fij: { name: 'Fijian', nativeName: 'フィジー語' },
  tah: { name: 'Tahitian', nativeName: 'タヒチ語' },
  cha: { name: 'Chamorro', nativeName: 'チャモロ語' },
  nav: { name: 'Navajo', nativeName: 'ナバホ語' },
  chr: { name: 'Cherokee', nativeName: 'チェロキー語' },
  oji: { name: 'Ojibwe', nativeName: 'オジブウェー語' },
  cre: { name: 'Cree', nativeName: 'クリー語' },
  iku: { name: 'Inuktitut', nativeName: 'イヌクティトゥット語' },
  kal: { name: 'Greenlandic', nativeName: 'グリーンランド語' },
  sme: { name: 'Northern Sami', nativeName: '北サーミ語' },
  smj: { name: 'Lule Sami', nativeName: 'ルレ・サーミ語' },
  sma: { name: 'Southern Sami', nativeName: '南サーミ語' },
  eus: { name: 'Basque', nativeName: 'バスク語' },
  bre: { name: 'Breton', nativeName: 'ブルトン語' },
  glg: { name: 'Galician', nativeName: 'ガリシア語' },
  cat: { name: 'Catalan', nativeName: 'カタルーニャ語' },
  oci: { name: 'Occitan', nativeName: 'オック語' },
  cos: { name: 'Corsican', nativeName: 'コルシカ語' },
  srd: { name: 'Sardinian', nativeName: 'サルデーニャ語' },
  wel: { name: 'Welsh', nativeName: 'ウェールズ語' },
  gle: { name: 'Irish', nativeName: 'アイルランド語' },
  gla: { name: 'Scottish Gaelic', nativeName: 'スコットランド・ゲール語' },
  glv: { name: 'Manx', nativeName: 'マン島語' },
  cor: { name: 'Cornish', nativeName: 'コーンウォール語' },

  // Classical and ancient languages
  lat: { name: 'Latin', nativeName: 'ラテン語' },
  grc: { name: 'Ancient Greek', nativeName: '古代ギリシャ語' },
  san: { name: 'Sanskrit', nativeName: 'サンスクリット語' },
  pli: { name: 'Pali', nativeName: 'パーリ語' },
  got: { name: 'Gothic', nativeName: 'ゴート語' },
  chu: { name: 'Church Slavonic', nativeName: '教会スラヴ語' },
  cop: { name: 'Coptic', nativeName: 'コプト語' },
  arc: { name: 'Aramaic', nativeName: 'アラム語' },
  akk: { name: 'Akkadian', nativeName: 'アッカド語' },
  sux: { name: 'Sumerian', nativeName: 'シュメール語' },
  egy: { name: 'Egyptian', nativeName: '古代エジプト語' },

  // Sign languages
  ase: { name: 'American Sign Language', nativeName: 'アメリカ手話' },
  jsl: { name: 'Japanese Sign Language', nativeName: '日本手話' },
  bfi: { name: 'British Sign Language', nativeName: 'イギリス手話' },
  fsl: { name: 'French Sign Language', nativeName: 'フランス手話' },
  gsg: { name: 'German Sign Language', nativeName: 'ドイツ手話' },

  // Constructed languages
  epo: { name: 'Esperanto', nativeName: 'エスペラント語' },
  ido: { name: 'Ido', nativeName: 'イド語' },
  ina: { name: 'Interlingua', nativeName: 'インターリングア' },
  vol: { name: 'Volapük', nativeName: 'ヴォラピュク' },
  tlh: { name: 'Klingon', nativeName: 'クリンゴン語' },
  qya: { name: 'Quenya', nativeName: 'クウェンヤ' },
  sjn: { name: 'Sindarin', nativeName: 'シンダール語' },
};

/**
 * Get language info from ISO 639-3 code
 * @param {string} code - ISO 639-3 language code
 * @returns {object|null} Language info or null if not found
 */
export function getLanguageByCode(code) {
  if (!code) return null;
  const normalizedCode = code.toLowerCase().trim();
  return ISO639_3[normalizedCode] || null;
}

/**
 * Get language display name from code or return the input as-is
 * @param {string} input - ISO 639-3 code or language name
 * @returns {string} Language native name or original input
 */
export function resolveLanguageName(input) {
  if (!input) return '';
  const trimmed = input.trim();
  const langInfo = getLanguageByCode(trimmed);
  return langInfo ? langInfo.nativeName : trimmed;
}

/**
 * Check if input is a valid ISO 639-3 code
 * @param {string} code - Potential ISO 639-3 code
 * @returns {boolean}
 */
export function isValidISO639_3(code) {
  if (!code) return false;
  return !!ISO639_3[code.toLowerCase().trim()];
}

/**
 * Get all available languages for autocomplete
 * @returns {Array} Array of {code, name, nativeName}
 */
export function getAllLanguages() {
  return Object.entries(ISO639_3).map(([code, info]) => ({
    code,
    ...info,
  }));
}

/**
 * Search languages by name or code
 * @param {string} query - Search query
 * @returns {Array} Matching languages
 */
export function searchLanguages(query) {
  if (!query) return [];
  const q = query.toLowerCase().trim();
  return Object.entries(ISO639_3)
    .filter(([code, info]) =>
      code.includes(q) ||
      info.name.toLowerCase().includes(q) ||
      info.nativeName.includes(q)
    )
    .map(([code, info]) => ({ code, ...info }))
    .slice(0, 10);
}

export default ISO639_3;
