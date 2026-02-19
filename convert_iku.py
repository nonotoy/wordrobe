import json
import re

# iku.jsonを読み込む
with open('/Users/yoshifumihanada/Documents/wordrobe/iku.json', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 各オブジェクトを抽出
original_data = []
current_obj = {}
in_object = False

for i, line in enumerate(lines, 1):
    line = line.strip()

    # オブジェクトの開始
    if line.startswith('{'):
        in_object = True
        current_obj = {}
    # "iku" フィールド
    elif '"iku"' in line and ':' in line and in_object:
        match = re.search(r'"iku"\s*:\s*"([^"]*)"', line)
        if match:
            current_obj['iku'] = match.group(1)
    # "eng" フィールド
    elif '"eng"' in line and ':' in line and in_object:
        match = re.search(r'"eng"\s*:\s*"([^"]*)"', line)
        if match:
            current_obj['eng'] = match.group(1)
    # オブジェクトの終了
    elif (line.startswith('}') or line == '},') and in_object:
        # ikuとengの両方がある場合のみ追加
        if 'iku' in current_obj and 'eng' in current_obj:
            original_data.append(current_obj.copy())
        current_obj = {}
        in_object = False

print(f"デバッグ: {len(original_data)}件のエントリーを抽出")

# 新しい形式に変換
new_data = {
    "entries": []
}

for idx, item in enumerate(original_data, start=1):
    entry = {
        "id": f"{idx:04d}",
        "src_primary": item.get("iku", ""),
        "meaning": item.get("eng", ""),
        "pos": "",
        "source": "Inuktut Tusaalanga"
    }
    new_data["entries"].append(entry)

# 変換したデータを書き込む
with open('/Users/yoshifumihanada/Documents/wordrobe/iku.json', 'w', encoding='utf-8') as f:
    json.dump(new_data, f, ensure_ascii=False, indent=2)

print(f"変換完了: {len(new_data['entries'])}件のエントリーを変換しました")
