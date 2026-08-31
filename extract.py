import re
import json
import html

with open('post_empty.html', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

# Find goog.script.init(
prefix = 'goog.script.init("'
start = text.find(prefix)
if start != -1:
    start += len(prefix)
    # Find the matching end quote before the next argument
    end_marker = '", "", undefined'
    end = text.find(end_marker, start)
    if end == -1:
        end = text.rfind('");}')
    
    raw_str = text[start:end]
    print(f"Raw string length: {len(raw_str)}")
    
    decoded = raw_str.encode('utf-8').decode('unicode_escape')
    print(f"Decoded string length: {len(decoded)}")
    
    try:
        data = json.loads(decoded)
        user_html = data.get('userHtml', '')
    except Exception as e:
        print(f"JSON parse error: {e}, trying direct userHtml substring")
        u_start = decoded.find('"userHtml":"') + len('"userHtml":"')
        u_end = decoded.rfind('","ncc"')
        user_html = decoded[u_start:u_end]
        user_html = user_html.replace('\\"', '"').replace('\\n', '\n').replace('\\/', '/')

    print(f"user_html length: {len(user_html)}")
    with open('extracted_user.html', 'w', encoding='utf-8') as out:
        out.write(user_html)
        
    rows = re.findall(r'<tr.*?>(.*?)</tr>', user_html, re.DOTALL | re.IGNORECASE)
    print(f"Total rows found: {len(rows)}")
    
    parsed = []
    for r in rows:
        cells = re.findall(r'<t[dh].*?>(.*?)</t[dh]>', r, re.DOTALL | re.IGNORECASE)
        cleaned = [re.sub(r'<[^>]+>', '', c).strip() for c in cells]
        cleaned = [html.unescape(c) for c in cleaned]
        if any(cleaned):
            parsed.append(cleaned)
            
    print(f"Non-empty parsed rows: {len(parsed)}")
    if parsed:
        print("Header:", parsed[0])
        for i in range(1, min(6, len(parsed))):
            print(f"Row {i}:", parsed[i])
            
    records = []
    if len(parsed) > 1:
        headers = parsed[0]
        for row_idx, r in enumerate(parsed[1:]):
            record = {
                "id": row_idx + 1,
                "state_by": r[0] if len(r) > 0 else "",
                "arabic": r[2] if len(r) > 2 else (r[1] if len(r) > 1 else ""),
                "ld_translation": r[3] if len(r) > 3 else "",
                "translation": r[4] if len(r) > 4 else "",
                "reference": r[5] if len(r) > 5 else (r[-1] if len(r) > 1 else ""),
                "raw_cells": r
            }
            records.append(record)
            
    with open('data.json', 'w', encoding='utf-8') as jf:
        json.dump(records, jf, ensure_ascii=False, indent=2)
    print(f"Saved {len(records)} records to data.json")
else:
    print("goog.script.init prefix not found")
