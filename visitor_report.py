#!/usr/bin/env python3
"""
Admin Visitor & Traffic Report Generator for Raudat-e-Hidayat
Fetches real-time visitor statistics from the Turso Database.
"""

import urllib.request
import json
import datetime
import sys

TURSO_URL = "https://raudat-e-hidayat-shabbirmaanak.aws-ap-south-1.turso.io/v2/pipeline"
TURSO_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODgxNjEwOTcsImlkIjoiMDFhMDU2YjQtZTEwMS03MTU3LWE4YWQtMzBhM2RkNzQxNmYzIiwia2lkIjoicnNxM3J2QXI5MFloTkV0SGltMjhrRjVoUzBTbG1xcHc0M3JOVFRCaEZPUSIsInJpZCI6IjM1ZDNmOWViLWI1NDItNGJlMS04YjI2LTgxMTc1NTRiMDQzMSJ9.4AnWNvmQv4tos5c-QO36OndC4Ug1up6dIzJEDcXuy96GxBL1vEzoNkSxeb4yOn6dKHJwY1R5T9u3oE9zmCrjBw"

def execute_query(sql, args=[]):
    payload = {
        "requests": [{
            "type": "execute",
            "stmt": {
                "sql": sql,
                "args": [{"type": "text", "value": str(a)} for a in args]
            }
        }]
    }
    req = urllib.request.Request(
        TURSO_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {TURSO_TOKEN}",
            "Content-Type": "application/json"
        }
    )
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode("utf-8"))
        result = res["results"][0]["response"]["result"]
        cols = [c["name"] for c in result.get("cols", [])]
        rows = []
        for r in result.get("rows", []):
            rows.append({cols[i]: r[i]["value"] for i in range(len(cols))})
        return rows

def parse_device_info(ua):
    ua_lower = ua.lower()
    if "iphone" in ua_lower:
        device = "iPhone (iOS)"
    elif "ipad" in ua_lower:
        device = "iPad (iOS)"
    elif "android" in ua_lower:
        device = "Android Mobile"
    elif "macintosh" in ua_lower or "mac os" in ua_lower:
        device = "Mac Desktop"
    elif "windows" in ua_lower:
        device = "Windows PC"
    elif "linux" in ua_lower:
        device = "Linux PC"
    else:
        device = "Other / Unknown"

    if "chrome" in ua_lower and "edg" not in ua_lower:
        browser = "Chrome"
    elif "safari" in ua_lower and "chrome" not in ua_lower:
        browser = "Safari"
    elif "firefox" in ua_lower:
        browser = "Firefox"
    elif "edg" in ua_lower:
        browser = "Edge"
    else:
        browser = "Browser"
    
    return f"{device} • {browser}"

def main():
    print("=" * 65)
    print("      📊 RAUDAT-E-HIDAYAT — ADMIN VISITOR & TRAFFIC REPORT")
    print("=" * 65)

    try:
        # 1. Total Visits and Unique Sessions
        total_visits_row = execute_query("SELECT COUNT(*) as total FROM visitor_logs;")[0]
        unique_sessions_row = execute_query("SELECT COUNT(DISTINCT session_id) as total FROM visitor_logs;")[0]
        
        total_visits = int(total_visits_row["total"])
        unique_visitors = int(unique_sessions_row["total"])

        print(f"\n📈  TOTAL VISITS:           {total_visits:,}")
        print(f"👥  UNIQUE VISITORS:        {unique_visitors:,}")

        # 2. Visits Today vs Past Days
        daily_breakdown = execute_query("""
            SELECT DATE(visited_at) as visit_date, COUNT(*) as cnt, COUNT(DISTINCT session_id) as unique_cnt
            FROM visitor_logs 
            GROUP BY DATE(visited_at) 
            ORDER BY visit_date DESC 
            LIMIT 7;
        """)

        print("\n📅  DAILY TRAFFIC (Last 7 Active Days):")
        print("   " + "-" * 55)
        print(f"   {'Date (UTC)':<15} {'Total Views':<15} {'Unique Visitors':<15}")
        print("   " + "-" * 55)
        for d in daily_breakdown:
            print(f"   {str(d['visit_date']):<15} {str(d['cnt']):<15} {str(d['unique_cnt']):<15}")
        print("   " + "-" * 55)

        # 3. Top Referrers
        referrers = execute_query("""
            SELECT referrer, COUNT(*) as cnt 
            FROM visitor_logs 
            GROUP BY referrer 
            ORDER BY cnt DESC 
            LIMIT 5;
        """)
        print("\n🔗  TOP TRAFFIC SOURCES / REFERRERS:")
        for r in referrers:
            print(f"   • {r['referrer'] or 'direct'}: {r['cnt']} visits")

        # 4. Top Languages
        languages = execute_query("""
            SELECT language, COUNT(*) as cnt 
            FROM visitor_logs 
            GROUP BY language 
            ORDER BY cnt DESC 
            LIMIT 5;
        """)
        print("\n🌐  TOP VISITOR LANGUAGES:")
        for l in languages:
            print(f"   • {l['language'] or 'unknown'}: {l['cnt']} visitors")

        # 5. Recent 10 Visitor Logs
        recent_logs = execute_query("""
            SELECT id, session_id, visited_at, language, screen_res, referrer, user_agent 
            FROM visitor_logs 
            ORDER BY id DESC 
            LIMIT 10;
        """)

        print("\n🕒  RECENT 10 VISITOR SESSIONS:")
        print("   " + "-" * 58)
        for log in recent_logs:
            device_str = parse_device_info(log["user_agent"] or "")
            print(f"   #{log['id']:<4} | {log['visited_at']} UTC | {device_str}")
            print(f"         Lang: {log['language']} | Res: {log['screen_res']} | Ref: {log['referrer']}")
        print("   " + "-" * 58)

        print("\n✅ Report generated successfully from Turso Cloud Database.")
        print("=" * 65 + "\n")

    except Exception as e:
        print(f"\n❌ Error generating report from database: {e}", file=sys.stderr)

if __name__ == "__main__":
    main()
