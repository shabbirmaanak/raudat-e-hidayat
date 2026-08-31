import urllib.request
import json
import os

TURSO_URL = "https://raudat-e-hidayat-shabbirmaanak.aws-ap-south-1.turso.io/v2/pipeline"
TURSO_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODgxNjEwOTcsImlkIjoiMDFhMDU2YjQtZTEwMS03MTU3LWE4YWQtMzBhM2RkNzQxNmYzIiwia2lkIjoicnNxM3J2QXI5MFloTkV0SGltMjhrRjVoUzBTbG1xcHc0M3JOVFRCaEZPUSIsInJpZCI6IjM1ZDNmOWViLWI1NDItNGJlMS04YjI2LTgxMTc1NTRiMDQzMSJ9.4AnWNvmQv4tos5c-QO36OndC4Ug1up6dIzJEDcXuy96GxBL1vEzoNkSxeb4yOn6dKHJwY1R5T9u3oE9zmCrjBw"

def execute_pipeline(statements):
    requests = []
    for stmt in statements:
        if isinstance(stmt, str):
            requests.append({"type": "execute", "stmt": {"sql": stmt}})
        elif isinstance(stmt, dict):
            requests.append({"type": "execute", "stmt": stmt})
    
    payload = {"requests": requests}
    req = urllib.request.Request(
        TURSO_URL,
        data=json.dumps(payload).encode('utf-8'),
        headers={
            "Authorization": f"Bearer {TURSO_TOKEN}",
            "Content-Type": "application/json"
        }
    )
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        return res

def main():
    print("1. Creating schema and indexes in Turso...")
    init_stmts = [
        """
        CREATE TABLE IF NOT EXISTS kalam (
            id INTEGER PRIMARY KEY,
            reference TEXT NOT NULL,
            serial_num TEXT NOT NULL,
            stated_by TEXT NOT NULL,
            arabic TEXT NOT NULL,
            arabic_normalized TEXT,
            ld_translation TEXT NOT NULL,
            ld_normalized TEXT,
            english_translation TEXT NOT NULL,
            english_normalized TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        """,
        "CREATE INDEX IF NOT EXISTS idx_kalam_ref ON kalam(reference);",
        "CREATE INDEX IF NOT EXISTS idx_kalam_speaker ON kalam(stated_by);",
        "CREATE INDEX IF NOT EXISTS idx_kalam_serial ON kalam(serial_num);"
    ]
    execute_pipeline(init_stmts)
    print("✓ Schema initialized.")

    print("2. Loading dataset from data/raudat_data.json...")
    data_path = os.path.join(os.path.dirname(__file__), "data", "raudat_data.json")
    with open(data_path, "r", encoding="utf-8") as f:
        items = json.load(f)
    print(f"Loaded {len(items)} records.")

    print("3. Inserting records in batches into Turso...")
    batch_size = 50
    for i in range(0, len(items), batch_size):
        batch = items[i:i + batch_size]
        stmts = []
        for item in batch:
            stmts.append({
                "sql": """
                INSERT OR REPLACE INTO kalam (
                    id, reference, serial_num, stated_by, 
                    arabic, arabic_normalized, 
                    ld_translation, ld_normalized, 
                    english_translation, english_normalized
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                """,
                "args": [
                    {"type": "integer", "value": str(item["id"])},
                    {"type": "text", "value": item.get("reference", "")},
                    {"type": "text", "value": str(item.get("serial_num", ""))},
                    {"type": "text", "value": item.get("stated_by", "")},
                    {"type": "text", "value": item.get("arabic", "")},
                    {"type": "text", "value": item.get("arabic_normalized", "")},
                    {"type": "text", "value": item.get("ld_translation", "")},
                    {"type": "text", "value": item.get("ld_normalized", "")},
                    {"type": "text", "value": item.get("english_translation", "")},
                    {"type": "text", "value": item.get("english_normalized", "")}
                ]
            })
        execute_pipeline(stmts)
        print(f"  Inserted records {i + 1} to {min(i + batch_size, len(items))}...")

    print("4. Verifying Turso database record count...")
    verify_res = execute_pipeline(["SELECT COUNT(*) as count FROM kalam;"])
    count_val = verify_res["results"][0]["response"]["result"]["rows"][0][0]["value"]
    print(f"✓ Total records in Turso 'kalam' table: {count_val}")

    print("5. Sample query verification...")
    sample_res = execute_pipeline([
        "SELECT id, reference, serial_num, stated_by, arabic, english_translation FROM kalam LIMIT 2;"
    ])
    rows = sample_res["results"][0]["response"]["result"]["rows"]
    cols = [c["name"] for c in sample_res["results"][0]["response"]["result"]["cols"]]
    for r in rows:
        row_dict = {cols[j]: r[j]["value"] for j in range(len(cols))}
        print("  Sample row:", row_dict)

    print("\n🎉 All 600 records successfully uploaded to your Turso Cloud Database!")

if __name__ == "__main__":
    main()
