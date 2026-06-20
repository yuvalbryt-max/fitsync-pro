"""
Garmin Connect sync — activities, HR, HRV, stress, steps, SpO2, VO2Max.
Cron: 07:00, 14:00, 21:00 Israel (04:00, 11:00, 18:00 UTC).
Uses garth session caching to avoid repeated logins (avoids Garmin 429 rate limits).
"""
import os, sys, time, logging
from datetime import datetime, timezone, timedelta
from pathlib import Path
from dotenv import load_dotenv
import garminconnect
from db import get_client, get_user_id, log_sync, upsert

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

TOKENSTORE = Path("/tmp/garth_tokens")


def get_garmin():
    """Login to Garmin, reusing cached session when available."""
    email    = os.environ["GARMIN_EMAIL"]
    password = os.environ["GARMIN_PASSWORD"]

    # Try reusing cached session first
    if TOKENSTORE.exists():
        try:
            c = garminconnect.Garmin()
            c.login(tokenstore=str(TOKENSTORE))
            log.info("Garmin session restored from cache")
            return c
        except Exception:
            log.info("Cached session expired, re-authenticating...")
            import shutil
            shutil.rmtree(str(TOKENSTORE), ignore_errors=True)

    # Fresh login with retries
    for attempt in range(3):
        try:
            c = garminconnect.Garmin(email=email, password=password)
            c.login(tokenstore=str(TOKENSTORE))
            log.info("Garmin login OK, session cached")
            return c
        except Exception as exc:
            if attempt == 2:
                raise
            wait = 2 ** attempt * 5  # 5s, 10s
            log.warning(f"Login attempt {attempt+1} failed: {exc}. Retrying in {wait}s...")
            time.sleep(wait)
    raise RuntimeError("Garmin login failed after retries")


def sync_activities(garmin, db, user_id):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    since = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d")
    try:
        acts = garmin.get_activities_by_date(since, today)
    except Exception as exc:
        log.warning(f"Activities fetch failed: {exc}")
        return 0
    rows = []
    for a in acts:
        aid = a.get("activityId")
        if not aid:
            continue
        rows.append({
            "user_id":            user_id,
            "garmin_activity_id": int(aid),
            "activity_type":      a.get("activityType", {}).get("typeKey", "unknown"),
            "started_at":         a.get("startTimeLocal"),
            "duration_seconds":   int(a.get("duration", 0)),
            "distance_meters":    a.get("distance"),
            "calories":           int(a.get("calories", 0)) or None,
            "hr_avg":             int(a.get("averageHR", 0)) or None,
            "hr_max":             int(a.get("maxHR", 0)) or None,
            "vo2max_estimate":    a.get("vO2MaxValue"),
        })
    return upsert(db, "activities", rows, "garmin_activity_id")


def sync_health_metrics(garmin, db, user_id):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    rows  = []
    try:
        hrv = garmin.get_hrv_data(today)
        val = hrv.get("hrvSummary", {}).get("lastNight5MinHigh") if hrv else None
        if val:
            rows.append({"user_id": user_id, "recorded_at": today + "T06:00:00+00:00",
                         "metric_type": "hrv", "value": float(val), "unit": "ms"})
    except Exception as exc:
        log.warning(f"HRV: {exc}")
    try:
        rhr = garmin.get_rhr_day(today)
        mm  = rhr.get("allMetrics", {}).get("metricsMap", {}) if rhr else {}
        hrs = mm.get("WELLNESS_RESTING_HEART_RATE", [])
        if hrs and hrs[0].get("value"):
            rows.append({"user_id": user_id, "recorded_at": today + "T06:00:00+00:00",
                         "metric_type": "hr_resting", "value": float(hrs[0]["value"]), "unit": "bpm"})
    except Exception as exc:
        log.warning(f"RHR: {exc}")
    try:
        stress = garmin.get_stress_data(today)
        avg = stress.get("avgStressLevel") if stress else None
        if avg and avg > 0:
            rows.append({"user_id": user_id, "recorded_at": today + "T12:00:00+00:00",
                         "metric_type": "stress", "value": float(avg), "unit": None})
    except Exception as exc:
        log.warning(f"Stress: {exc}")
    try:
        steps_data = garmin.get_steps_data(today)
        total = sum(s.get("steps", 0) for s in (steps_data or []) if isinstance(s, dict))
        if total > 0:
            rows.append({"user_id": user_id, "recorded_at": today + "T23:00:00+00:00",
                         "metric_type": "steps", "value": float(total), "unit": None})
    except Exception as exc:
        log.warning(f"Steps: {exc}")
    try:
        spo2 = garmin.get_spo2_data(today)
        avg  = spo2.get("averageSpO2") if spo2 else None
        if avg:
            rows.append({"user_id": user_id, "recorded_at": today + "T06:00:00+00:00",
                         "metric_type": "spo2", "value": float(avg), "unit": "%"})
    except Exception as exc:
        log.warning(f"SpO2: {exc}")
    try:
        summary = garmin.get_user_summary(today)
        vo2 = (summary or {}).get("vo2MaxPreciseValue") or (summary or {}).get("vo2MaxValue")
        if vo2:
            rows.append({"user_id": user_id, "recorded_at": today + "T12:00:00+00:00",
                         "metric_type": "vo2max", "value": float(vo2), "unit": "ml/kg/min"})
    except Exception as exc:
        log.warning(f"VO2Max: {exc}")
    if not rows:
        return 0
    db.table("health_metrics").insert(rows).execute()
    return len(rows)


def main():
    started = datetime.now(timezone.utc).isoformat()
    db      = get_client()
    user_id = get_user_id()
    errors  = []
    total   = 0
    log.info("Starting Garmin sync...")
    try:
        garmin = get_garmin()
    except Exception as exc:
        msg = f"Auth failed: {exc}"
        log.error(msg)
        log_sync(db, "garmin", "failed", error=msg, started_at=started)
        sys.exit(1)
    for fn, label in [(sync_activities, "activities"), (sync_health_metrics, "health")]:
        try:
            n = fn(garmin, db, user_id)
            log.info(f"{label}: {n}")
            total += n
        except Exception as exc:
            errors.append(f"{label}: {exc}")
    status = "failed" if len(errors) == 2 else ("partial" if errors else "success")
    log_sync(db, "garmin", status, records=total, error="; ".join(errors) or None, started_at=started)
    log.info(f"Done: {total} records, status={status}")


if __name__ == "__main__":
    main()
