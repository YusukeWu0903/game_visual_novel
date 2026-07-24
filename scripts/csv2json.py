import csv
import json

def convert_csv_to_json(csv_path, json_path):
    data = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            sprites = []
            # Mapping columns to positions
            for pos in ['left', 'center', 'right']:
                file = row.get(f'sprite_{pos}')
                if file:
                    sprite_obj = {'file': file, 'pos': pos}
                    # Parse movement if exists
                    if row.get('char_move') and file in row['char_move']:
                        sprite_obj['move'] = row['char_move'].split(':')[1]
                    # Parse effect if exists
                    if row.get('char_effect') and file in row['char_effect']:
                        sprite_obj['effect'] = row['char_effect'].split(':')[1]
                    sprites.append(sprite_obj)
            
            data.append({
                'id': int(row['id']),
                'speaker': row['speaker'],
                'text': row['text'],
                'bg': row['bg'],
                'sprites': sprites
            })
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    convert_csv_to_json("web-visual-novel/src/data/script.csv", "web-visual-novel/src/data/script.json")
