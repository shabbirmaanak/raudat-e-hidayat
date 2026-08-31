import re
import html
import json
from html.parser import HTMLParser

class TableParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_table = False
        self.in_tr = False
        self.in_cell = False
        self.current_row = []
        self.current_cell = []
        self.rows = []

    def handle_starttag(self, tag, attrs):
        tag = tag.lower()
        if tag == 'table':
            self.in_table = True
        elif tag == 'tr' and self.in_table:
            self.in_tr = True
            self.current_row = []
        elif tag in ('td', 'th') and self.in_tr:
            self.in_cell = True
            self.current_cell = []

    def handle_endtag(self, tag):
        tag = tag.lower()
        if tag in ('td', 'th') and self.in_cell:
            self.in_cell = False
            cell_text = ''.join(self.current_cell).strip()
            self.current_row.append(cell_text)
        elif tag == 'tr' and self.in_tr:
            self.in_tr = False
            if self.current_row:
                self.rows.append(self.current_row)
        elif tag == 'table':
            self.in_table = False

    def handle_data(self, data):
        if self.in_cell:
            self.current_cell.append(data)

    def handle_entityref(self, name):
        if self.in_cell:
            self.current_cell.append(html.unescape(f'&{name};'))

    def handle_charref(self, name):
        if self.in_cell:
            self.current_cell.append(html.unescape(f'&#{name};'))

with open('user_content.html', 'r', encoding='utf-8', errors='ignore') as f:
    raw_content = f.read()

# Fix GAS escaping
raw_content = raw_content.replace(r'\/', '/').replace(r'\"', '"').replace(r'\n', '\n')

parser = TableParser()
parser.feed(raw_content)

print(f"Total rows parsed: {len(parser.rows)}")
if parser.rows:
    print(f"Header: {parser.rows[0]}")

records = []
for i, r in enumerate(parser.rows[1:]):
    if len(r) >= 6:
        records.append({
            "id": i + 1,
            "stated_by": r[0],
            "serial_num": r[1],
            "arabic": r[2],
            "ld_translation": r[3],
            "english_translation": r[4],
            "reference": r[5]
        })
    elif len(r) > 0:
        print(f"Row {i+1} has unexpected length {len(r)}: {r}")

print(f"Total records processed: {len(records)}")

refs = sorted(list(set(r['reference'] for r in records)))
stated = sorted(list(set(r['stated_by'] for r in records)))
print(f"References ({len(refs)}): {refs}")
print(f"Stated by ({len(stated)}): {stated}")

with open('raudat_data.json', 'w', encoding='utf-8') as f:
    json.dump(records, f, ensure_ascii=False, indent=2)

print("Saved raudat_data.json successfully!")
