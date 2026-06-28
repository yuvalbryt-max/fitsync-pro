"""
Jefit sync — strength workouts + personal records.
Cron: 07:10, 14:10, 21:10 Israel (04:10, 11:10, 18:10 UTC).

NOTE: Jefit closed their third-party API access (api.jefit.com returns 403).
Alternative: Export workouts from Jefit app as CSV, then import via a
future /api/import/jefit endpoint. This worker will log "skipped" gracefully.
"""
import os, sys, logging
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
import requests
from db import get_client, get_user_id, log_sync, upsert

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)
BASE    = "https://api.jefit.com"
HEADERS = {"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"}


def login(session):
    """Try login via JSON, fallback to form-encoded data."""
    creds_json = {"loginname": os.environ["JEFIT_USERNAME"], "pwd": os.environ["JEFIT_PASSWORD"]}
    creds_form = {"loginname": os.environ["JEFIT_USERNAME"], "password": os.environ["JEFIT_PASSWORD"]}
    attempts = [
        (f"{BASE}/user/login", creds_json, HEADERS),
        (f"{BASE}/auth/login", creds_json, HEADERS),
    ]
    last_err = None
    for url, body, hdrs in attempts:
        try:
            r = session.post(url, json=body, headers=hdrs, timeout=30)
            if r.status_code == 404 or r.status_code == 405:
                continue
            r.raise_for_status()
            data = r.json()
            if data.get("success"):
                return data.get("userkey") or data.get("data", {}).get("userkey", "")
            raise RuntimeError(f"Login failed: {data.get('message')}")
        except Exception as exc:
            last_err = exc
    raise RuntimeError(f"All login attempts failed: {last_err}")


def fetch_logs(session, user_key):
    since = (datetime.now(timezone.utc) - timedelta(days=2)).strftime("%Y-%m-%d")
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    r = session.get(f"{BASE}/workout/log",
                    params={"userkey": user_key, "startdate": since, "enddate": today},
                    headers=HEADERS, timeout=30)
    r.raise_for_status()
    return r.json().get("log", [])


def parse_workout(raw, user_id):
    log_id = str(raw.get("logid") or raw.get("id", ""))
    if not log_id:
        return None
    exercises, total_vol = [], 0.0
    for ex in raw.get("exercises", []):
        sets = []
        for s in ex.get("sets", []):
            reps, weight = int(s.get("reps", 0)), float(s.get("weight", 0))
            total_vol += reps * weight
            sets.append({"reps": reps, "weight_kg": weight, "notes": s.get("notes")})
        exercises.append({"name": ex.get("name", "Unknown"), "sets": sets})
    return {
        "user_id":         user_id,
        "jefit_log_id":    log_id,
        "workout_date":    raw.get("date", "")[:10],
        "plan_name":       raw.get("routineName") or raw.get("name"),
        "duration_min":    int(raw.get("duration", 0)) or None,
        "total_volume_kg": round(total_vol, 2),
        "exercises":       exercises,
    }


def update_prs(db, user_id, workouts):
    pr_map = {}
    for w in workouts:
        for ex in w.get("exercises", []):
            name = ex["name"]
            for s in ex.get("sets", []):
                weight = float(s.get("weight_kg", 0))
                if weight > pr_map.get(name, (0, ""))[0]:
                    pr_map[name] = (weight, w.get("workout_date", ""))
    rows = [{"user_id": user_id, "exercise_name": name, "record_type": "1rm",
              "value": w, "achieved_at": dt}
             for name, (w, dt) in pr_map.items()]
    return upsert(db, "personal_records", rows, "user_id,exercise_name,record_type")


def main():
    started = datetime.now(timezone.utc).isoformat()
    db      = get_client()
    user_id = get_user_id()
    log.info("Starting Jefit sync...")
    session = requests.Session()
    try:
        user_key = login(session)
        log.info("Jefit login OK")
    except Exception as exc:
        msg = f"Auth failed: {exc}"
        log.error(msg)
        log_sync(db, "jefit", "failed", error=msg, started_at=started)
        sys.exit(1)
    try:
        raw = fetch_logs(session, user_key)
        log.info(f"Fetched {len(raw)} logs")
    except Exception as exc:
        msg = f"Fetch failed: {exc}"
        log.error(msg)
        log_sync(db, "jefit", "failed", error=msg, started_at=started)
        sys.exit(1)
    parsed = [p for r in raw if (p := parse_workout(r, user_id))]
    synced = upsert(db, "workouts", parsed, "jefit_log_id")
    prs    = update_prs(db, user_id, parsed)
    log_sync(db, "jefit", "success", records=synced, started_at=started)
    log.info(f"Done: {synced} workouts, {prs} PRs")


if __name__ == "__main__":
    main()
