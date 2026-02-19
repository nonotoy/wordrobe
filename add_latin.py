import json

# イヌクティトゥット音節文字とラテンアルファベットのマッピング
# Based on https://github.com/Elcoid/inuktitut-syllabics

# 音節文字の定義
syllabics = [
    ['\u140a', '\u1438', '\u1455', '\u1472', '\u1490', '\u14aa', '\u14c7', '\u14f4', '\u14da', '\u152d', '\u1559', '\u154b', '\u1583', '\u1593', '\u15a4'],
    ['\u140B', '\u1439', '\u1456', '\u1473', '\u1491', '\u14ab', '\u14c8', '\u14f5', '\u14db', '\u152e', '\u155a', '\u154c', '\u1584', '\u1594', '\u15a5'],
    ['\u1403', '\u1431', '\u144e', '\u146d', '\u148b', '\u14a5', '\u14c2', '\u14ef', '\u14d5', '\u1528', '\u1555', '\u1546', '\u157f', '\u158f', '\u15a0'],
    ['\u1404', '\u1432', '\u144f', '\u146e', '\u148c', '\u14a6', '\u14c3', '\u14f0', '\u14d6', '\u1529', '\u1556', '\u1547', '\u1580', '\u1590', '\u15a1'],
    ['\u1405', '\u1433', '\u1450', '\u146f', '\u148d', '\u14a7', '\u14c4', '\u14f1', '\u14d7', '\u152a', '\u1557', '\u1548', '\u1581', '\u1591', '\u15a2'],
    ['\u1406', '\u1434', '\u1451', '\u1470', '\u148e', '\u14a8', '\u14c5', '\u14f2', '\u14d8', '\u152b', '\u1558', '\u1549', '\u1582', '\u1592', '\u15a3'],
    ['\u1426', '\u1449', '\u14bc', '\u1483', '\u14a1', '\u14bb', '\u14d0', '\u1505', '\u14ea', '\u153e', '\u155d', '\u1550', '\u1585', '\u1595', '\u15a6']
]

# ラテンアルファベットの定義
latins = [
    ["a",  "pa",  "ta",  "ka",  "ga",  "ma",  "na",  "sa",  "la",  "ja",  "va",  "ra",  "qa",  "nga",  "\u019aa"],
    ["aa", "paa", "taa", "kaa", "gaa", "maa", "naa", "saa", "laa", "jaa", "vaa", "raa", "qaa", "ngaa", "\u019aaa"],
    ["i",  "pi",  "ti",  "ki",  "gi",  "mi",  "ni",  "si",  "li",  "ji",  "vi",  "ri",  "qi",  "ngi",  "\u019ai"],
    ["ii", "pii", "tii", "kii", "gii", "mii", "nii", "sii", "lii", "jii", "vii", "rii", "qii", "ngii", "\u019aii"],
    ["u",  "pu",  "tu",  "ku",  "gu",  "mu",  "nu",  "su",  "lu",  "ju",  "vu",  "ru",  "qu",  "ngu",  "\u019au"],
    ["uu", "puu", "tuu", "kuu", "guu", "muu", "nuu", "suu", "luu", "juu", "vuu", "ruu", "quu", "nguu", "\u019auu"],
    ["h",  "p",   "t",   "k",   "g",   "m",   "n",   "s",   "l",   "j",   "v",   "r",   "q",   "ng",   "\u019a"]
]

# マッピング辞書を作成
syllabic_to_latin = {}
for i, row in enumerate(syllabics):
    for j, char in enumerate(row):
        syllabic_to_latin[char] = latins[i][j]

# 変換関数
def convert_to_latin(text):
    """イヌクティトゥット音節文字をラテンアルファベットに変換"""
    result = []
    for char in text:
        if char in syllabic_to_latin:
            # 語末の子音の場合、ハイフンを除去
            latin = syllabic_to_latin[char]
            if latin.startswith('-'):
                latin = latin[1:]
            result.append(latin)
        else:
            # マッピングにない文字（スペース、句読点など）はそのまま
            result.append(char)
    return ''.join(result)

# iku.jsonを読み込む
with open('/Users/yoshifumihanada/Documents/wordrobe/iku.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 各エントリーにsrc_secondaryを追加
for entry in data['entries']:
    src_primary = entry['src_primary']
    src_secondary = convert_to_latin(src_primary)
    entry['src_secondary'] = src_secondary

# 更新したデータを書き込む
with open('/Users/yoshifumihanada/Documents/wordrobe/iku.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"完了: {len(data['entries'])}件のエントリーにsrc_secondaryを追加しました")

# サンプル表示
print("\nサンプル:")
for i in range(min(5, len(data['entries']))):
    entry = data['entries'][i]
    print(f"{entry['id']}: {entry['src_primary']} → {entry['src_secondary']} ({entry['meaning']})")
