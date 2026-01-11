import json
from collections import defaultdict
from pathlib import Path

files = ['competitors.json', 'favorites.json', 'comparison_history.json', 'deep_reports.json']

def get_keys(obj, prefix=''):
    keys = set()
    if isinstance(obj, dict):
        for k, v in obj.items():
            keys.add(f"{prefix}{k}")
            if isinstance(v, (dict, list)):
                 # limit depth to avoid explosion, just want high level schema
                 if prefix.count('.') < 1: 
                     if isinstance(v, dict):
                         keys.update(get_keys(v, f"{prefix}{k}."))
                     elif isinstance(v, list) and len(v) > 0 and isinstance(v[0], dict):
                         keys.update(get_keys(v[0], f"{prefix}{k}."))
    return keys

for filename in files:
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        all_keys = set()
        if isinstance(data, list):
            for item in data:
                all_keys.update(get_keys(item))
        elif isinstance(data, dict):
            all_keys.update(get_keys(data))
            
        print(f"--- Keys in {filename} ---")
        for k in sorted(all_keys):
            print(k)
        print("\n")
    except Exception as e:
        print(f"Error reading {filename}: {e}")
