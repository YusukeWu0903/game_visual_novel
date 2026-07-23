import json
import os

def generate_monogatari_script(json_input_path, output_js_path):
    with open(json_input_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    lines = ["monogatari.script ({"]
    lines.append('  "Start": [')
    
    for entry in data:
        lines.append('    "show background ' + entry['bg'] + ' with ' + entry['effect'] + '",')
        lines.append('    "show character ' + entry['sprite'] + ' at center with ' + entry['effect'] + '",')
        lines.append('    "' + entry['speaker'] + ': ' + entry['text'] + '",')
    
    lines.append('  ]')
    lines.append("});")
    
    with open(output_js_path, 'w', encoding='utf-8') as f:
        f.write("\n".join(lines))
    print(f"Generated: {output_js_path}")

if __name__ == "__main__":
    generate_monogatari_script("web-visual-novel/src/data/script.json", "web-visual-novel/src/generated_script.js")
