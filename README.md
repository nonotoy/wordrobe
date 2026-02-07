# Wordrobe 👔📚

言葉のクローゼット - 自分好みの言葉を集めて保管する、カスタム辞書アプリ

## 特徴

- 📖 **辞書**: 単語の検索、一覧表示、詳細表示
- 📝 **例文**: 例文の一覧、単語との自動マッチング
- ⭐ **お気に入り**: よく使う単語を保存
- 🔄 **文字切替**: 複数の表記体系に対応（ラテン文字/カナなど）
- 🌙 **ダークモード**: 目に優しい表示
- 📥 **データインポート**: JSON/CSV形式に対応

## セットアップ

### 必要なもの

- Node.js 18以上
- npm または yarn
- Expo Go アプリ（スマホでテストする場合）

### インストール

```bash
# プロジェクトフォルダに移動
cd wordrobe

# 依存パッケージをインストール
npm install

# 開発サーバーを起動
npm start
```

### 実行方法

```bash
# iOS シミュレーター
npm run ios

# Android エミュレーター
npm run android

# Web ブラウザ
npm run web

# Expo Go で実行（QRコードをスキャン）
npm start
```

## 開発環境

VS Code での開発を推奨します。以下の拡張機能が便利です：

- **ES7+ React/Redux/React-Native snippets**
- **Prettier - Code formatter**
- **ESLint**

## プロジェクト構成

```
wordrobe/
├── App.js                    # エントリポイント
├── app.json                  # Expo設定
├── package.json
├── src/
│   ├── components/
│   │   ├── Icons.js          # SVGアイコン
│   │   └── UIComponents.js   # 共通UIコンポーネント
│   ├── context/
│   │   └── AppContext.js     # 状態管理
│   ├── screens/
│   │   ├── DictionaryScreen.js
│   │   ├── DetailScreen.js
│   │   ├── ExamplesScreen.js
│   │   ├── FavoritesScreen.js
│   │   └── SettingsScreen.js
│   └── utils/
│       └── csvParser.js      # CSV解析
├── assets/                   # アイコン・スプラッシュ画像
└── sample-data/
    ├── wordrobe-sample.json  # サンプルJSON
    ├── entries.csv           # サンプル単語CSV
    └── sentences.csv         # サンプル例文CSV
```

## データ形式

### JSON形式

```json
{
  "settings": {
    "logo_name": "Wordrobe",
    "script_settings": {
      "primary_name": "ラテン文字",
      "secondary_name": "カナ表記",
      "has_secondary": true
    }
  },
  "entries": [
    {
      "id": "001",
      "src_primary": "kamuy",
      "src_secondary": "カムイ",
      "pronunciation": "kamuj",
      "meaning": "神、霊",
      "pos": "名詞",
      "word_formation": "kam-uy",
      "declension": { "singular": "kamuy", "plural": "kamuy" },
      "conjugation": { "singular": "arpa", "plural": "paye" },
      "related_words": ["002", "003"],
      "source": "田村すず子 (1996)"
    }
  ],
  "sentences": [
    {
      "id": "s001",
      "sentence_primary": "Kamuy pirka kur ne.",
      "sentence_secondary": "カムイ ピリカ クㇽ ネ",
      "translation": "神は良い存在である。",
      "source": "田村すず子 (1996)"
    }
  ]
}
```

### CSV形式

**entries.csv（単語）**
```csv
id,src_primary,src_secondary,pronunciation,meaning,pos,word_formation,related_words,source
001,kamuy,カムイ,kamuj,神、霊,名詞,kam-uy,"002,003",田村すず子 (1996)
```

**sentences.csv（例文）**
```csv
id,sentence_primary,sentence_secondary,translation,source
s001,Kamuy pirka kur ne.,カムイ ピリカ クㇽ ネ,神は良い存在である。,田村すず子 (1996)
```

## フィールド説明

### 単語 (entries)

| フィールド | 必須 | 説明 |
|-----------|:----:|------|
| id | ✓ | 一意のID |
| src_primary | ✓ | 主要表記 |
| src_secondary | | 副次表記 |
| pronunciation | | 発音記号 |
| meaning | ✓ | 意味 |
| pos | ✓ | 品詞 |
| word_formation | | 語構成 |
| declension | | 曲用 |
| conjugation | | 活用 |
| related_words | | 参照（関連単語のID配列） |
| source | | 出典 |

### 例文 (sentences)

| フィールド | 必須 | 説明 |
|-----------|:----:|------|
| id | ✓ | 一意のID |
| sentence_primary | ✓ | 主要表記 |
| sentence_secondary | | 副次表記 |
| translation | ✓ | 翻訳 |
| source | | 出典 |

## 使い方

### データのインポート

1. 設定画面を開く
2. 「JSONまたはCSVをインポート」をタップ
3. ファイルを選択

### 文字切替

1. 設定画面を開く
2. 「文字切替」で表記を選択

※ JSONで `has_secondary: true` を設定した場合のみ表示されます

## ビルド

```bash
# iOS用ビルド
npx expo build:ios

# Android用ビルド  
npx expo build:android

# EAS Build（推奨）
npx eas build --platform ios
npx eas build --platform android
```

## ライセンス

MIT License

---

**Wordrobe** - 言葉のクローゼット 👔📚
