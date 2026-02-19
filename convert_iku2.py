import json
import re

# iku.jsonを読み込んで、各エントリーを抽出
entries = []

with open('/Users/yoshifumihanada/Documents/wordrobe/iku.json', 'r', encoding='utf-8') as f:
    content = f.read()

# 正規表現でエントリーを抽出（複数行マッチ）
pattern = r'\{\s*"iku"\s*:\s*"([^"]*)"\s*,\s*"eng"\s*:\s*"([^"]*)"\s*\}'
matches = re.findall(pattern, content, re.DOTALL)

print(f"デバッグ: {len(matches)}件のエントリーを抽出")

# 新しい形式に変換
new_data = {
    "entries": []
}

for idx, (iku, eng) in enumerate(matches, start=1):
    entry = {
        "id": f"{idx:04d}",
        "src_primary": iku,
        "meaning": eng,
        "pos": "",
        "source": "Inuktut Tusaalanga"
    }
    new_data["entries"].append(entry)

# 変換したデータを新しいファイルに書き込む
with open('/Users/yoshifumihanada/Documents/wordrobe/iku_converted.json', 'w', encoding='utf-8') as f:
    json.dump(new_data, f, ensure_ascii=False, indent=2)

print(f"変換完了: {len(new_data['entries'])}件のエントリーをiku_converted.jsonに保存しました")
