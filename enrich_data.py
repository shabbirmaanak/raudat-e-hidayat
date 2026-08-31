import json
import re

# Arabic normalization function
def normalize_arabic(text):
    if not text:
        return ""
    # Remove tashkeel / harakat
    tashkeel_pattern = re.compile(r'[\u0617-\u061A\u064B-\u0652\u0670\u06D6-\u06ED]')
    text = tashkeel_pattern.sub('', text)
    # Normalize Alef forms
    text = re.sub(r'[إأآٱا]', 'ا', text)
    # Normalize Yaa forms
    text = re.sub(r'[يى]', 'ي', text)
    # Normalize Taa Marbuta
    text = re.sub(r'ة', 'ه', text)
    # Normalize Hamza forms
    text = re.sub(r'[ؤئ]', 'ء', text)
    # Remove tatweel (kashida)
    text = re.sub(r'ـ', '', text)
    # Clean multiple spaces
    text = re.sub(r'\s+', ' ', text).strip()
    return text.lower()

# Normalize Lisan al-Dawat text (similar to Arabic normalization)
def normalize_ld(text):
    if not text:
        return ""
    text = normalize_arabic(text)
    # Also handle Gujarati/Urdu specific letters if any
    text = re.sub(r'[پ]', 'ب', text)
    text = re.sub(r'[چ]', 'ج', text)
    text = re.sub(r'[گ]', 'ك', text)
    text = re.sub(r'[ژ]', 'ز', text)
    text = re.sub(r'[ڈ]', 'د', text)
    text = re.sub(r'[ٹ]', 'ت', text)
    text = re.sub(r'[ڑ]', 'ر', text)
    return text

with open('raudat_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for item in data:
    item['arabic_normalized'] = normalize_arabic(item['arabic'])
    item['ld_normalized'] = normalize_ld(item['ld_translation'])
    item['english_normalized'] = item['english_translation'].lower().strip()
    item['stated_by_normalized'] = normalize_arabic(item['stated_by'])

# Create data directory
import os
os.makedirs('data', exist_ok=True)

# Save JSON
with open('data/raudat_data.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

# Save as JS file for direct offline file:// protocol compatibility without CORS
with open('data/raudat_data.js', 'w', encoding='utf-8') as f:
    f.write('const RAUDAT_DATA = ' + json.dumps(data, ensure_ascii=False) + ';')

print(f"Successfully processed {len(data)} records into data/raudat_data.json and data/raudat_data.js")
