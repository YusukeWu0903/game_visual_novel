import csv
import json
import os

def convert_csv_to_json():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.dirname(script_dir)
    
    csv_path = os.path.join(root_dir, "web-visual-novel", "src", "data", "script.csv")
    json_path = os.path.join(root_dir, "web-visual-novel", "src", "data", "script.json")
    
    data = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            sprites = []
            for pos in ['left', 'center', 'right']:
                file = row.get(f'sprite_{pos}')
                if file and file.strip():
                    sprite_obj = {'file': file.strip(), 'pos': pos}
                    
                    # 解析 char_actions: Kasumi.webp:move|effect; ...
                    if row.get('char_actions'):
                        for action in row['char_actions'].split(';'):
                            if ':' in action:
                                actor, cmds = action.split(':', 1)
                                if actor.strip() == file.strip():
                                    for cmd in cmds.split('|'):
                                        if '->' in cmd: sprite_obj['move'] = cmd
                                        else: sprite_obj['effect'] = cmd
                    sprites.append(sprite_obj)
            
            data.append({
                'id': int(row['id']),
                'speaker': row['speaker'],
                'text': row['text'],
                'bg': row['bg'],
                'bgm': row.get('bgm', ''),
                'sprites': sprites
            })
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    convert_csv_to_json()
