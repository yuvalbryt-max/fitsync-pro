"""
Daily summary — BMR (Mifflin-St Jeor) + caloric balance.
Cron: 21:15 Israel (18:15 UTC).
"""
import os, logging
from datetime import datetime, timezone, date
from dotenv import load_dotenv
from db import get_client, get_user_id, log_sync

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)


def compute_bmr(weight_kg, height_cm, age, gender="male"):
    base = 10 * weight_kg + 6.25 * height_cm - 5 * age
    return int(base + 5 if gender == "male" else base - 161)


def age_from(birth_date):
    if not birth_date:
        return 30
    bd = date.fromisoformat(birth_date)
    td = date.today()
    return td.year - bd.year - ((td.month, td.day) < (bd.month, bd.day))


def main():
    started = datetime.now(timezone.utc).isoformat()
    db      = get_client()
    user_id = get_user_id()
    today   = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    log.info(f"Daily summary for {today}")

    profile = (db.table("users").select("height_cm,birth_date,gender")
               .eq("id", user_id).single().execute()).data or {}
    w_row   = (db.table("body_metrics").select("weight_kg").eq("user_id", user_id)
               .order("measured_at", desc=True).limit(1).execute()).data or []
    weight  = float(w_row[0]["weight_kg"]) if w_row and w_row[0].get("weight_kg") else 80.0
    bmr_val = compute_bmr(weight, int(profile.get("height_cm") or 175),
                           age_from(profile.get("birth_date")), profile.get("gender") or "male")

    acts = (db.table("activities").select("calories").eq("user_id", user_id)
            .gte("started_at", today + "T00:00:00").lt("started_at", today + "T23:59:59")
            .execute()).data or []
    active_kcal = sum(int(a.get("calories") or 0) for a in acts)

    steps_row  = (db.table("health_metrics").select("value").eq("user_id", user_id)
                  .eq("metric_type", "steps").gte("recorded_at", today)
                  .order("recorded_at", desc=True).limit(1).execute()).data or []
    steps_kcal = int(float(steps_row[0]["value"]) * 0.04) if steps_row else 0

    nut = (db.table("nutrition_entries").select("kcal,protein_g,carbs_g,fat_g")
           .eq("user_id", user_id).gte("logged_at", today + "T00:00:00")
           .lt("logged_at", today + "T23:59:59").execute()).data or []
    consumed  = sum(int(r.get("kcal") or 0) for r in nut)
    protein_g = int(sum(float(r.get("protein_g") or 0) for r in nut))
    carbs_g   = int(sum(float(r.get("carbs_g") or 0) for r in nut))
    fat_g     = int(sum(float(r.get("fat_g") or 0) for r in nut))
    net       = consumed - (bmr_val + active_kcal + steps_kcal)

    db.table("daily_summary").upsert({
        "user_id": user_id, "date": today,
        "bmr_kcal": bmr_val, "active_kcal": active_kcal, "steps_kcal": steps_kcal,
        "consumed_kcal": consumed, "protein_g": protein_g,
        "carbs_g": carbs_g, "fat_g": fat_g, "net_balance": net,
    }, on_conflict="user_id,date").execute()

    log.info(f"BMR={bmr_val} active={active_kcal} steps_kcal={steps_kcal} consumed={consumed} net={net:+d}")
    log_sync(db, "daily_summary", "success", records=1, started_at=started)


if __name__ == "__main__":
    main()
