"""
AI Insight — Hebrew daily coaching via Claude Sonnet.
Cron: 07:30 Israel (04:30 UTC).
"""
import os, logging
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
import anthropic
from db import get_client, get_user_id, log_sync

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)


def main():
    started   = datetime.now(timezone.utc).isoformat()
    db        = get_client()
    user_id   = get_user_id()
    yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d")
    today     = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    since_7   = (datetime.now(timezone.utc) - timedelta(days=7)).strftime("%Y-%m-%d")
    log.info(f"Generating insight for {today}...")

    summary  = (db.table("daily_summary").select("*").eq("user_id", user_id)
                .eq("date", yesterday).maybeSingle().execute()).data
    metrics  = (db.table("health_metrics").select("metric_type,value")
                .eq("user_id", user_id).gte("recorded_at", since_7)
                .in_("metric_type", ["hrv", "stress"]).execute()).data or []
    workouts = (db.table("workouts").select("workout_date,plan_name,total_volume_kg")
                .eq("user_id", user_id).order("workout_date", desc=True).limit(3).execute()).data or []
    weekly   = (db.table("daily_summary").select("net_balance")
                .eq("user_id", user_id).gte("date", since_7).execute()).data or []

    hrv_vals   = [m["value"] for m in metrics if m["metric_type"] == "hrv"]
    hrv_avg    = round(sum(hrv_vals) / len(hrv_vals), 1) if hrv_vals else "אין נתון"
    weekly_net = sum(r.get("net_balance", 0) for r in weekly)

    summary_line = (
        f"אתמול: BMR={summary['bmr_kcal']} קל׳, פעילות={summary['active_kcal']} קל׳, "
        f"נאכל={summary['consumed_kcal']} קל׳, מאזן={summary['net_balance']:+d} קל׳, "
        f"חלבון={summary['protein_g']}g"
    ) if summary else "אין נתוני תזונה מאתמול."

    workouts_line = "\n".join(
        f"- {w['workout_date']}: {w['plan_name'] or 'אימון'} — {w['total_volume_kg']}kg"
        for w in workouts
    ) or "אין אימוני כוח אחרונים"

    prompt = f"""אתה מאמן כושר ותזונה אישי. כתוב תובנה יומית קצרה בעברית (2-4 משפטים).
הסגנון: ישיר, מעודד, מבוסס נתונים. השתמש ב-**bold** לנתונים חשובים.

{summary_line}
מאזן שבועי: {weekly_net:+d} קל׳
HRV ממוצע (7 ימים): {hrv_avg}ms
אימונים אחרונים:
{workouts_line}

כתוב תובנה שמתייחסת לנתונים הבולטים ונותנת המלצה אחת קונקרטית להיום."""

    client  = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    msg     = client.messages.create(model="claude-sonnet-4-6", max_tokens=300,
                                     messages=[{"role": "user", "content": prompt}])
    content = msg.content[0].text.strip()
    log.info(f"Insight: {content[:80]}...")

    db.table("ai_insights").upsert({
        "user_id": user_id, "insight_date": today,
        "model_used": "claude-sonnet-4-6", "content": content,
        "data_snapshot": {"weekly_net": weekly_net, "hrv_avg": str(hrv_avg)},
    }, on_conflict="user_id,insight_date").execute()

    log_sync(db, "ai_insight", "success", records=1, started_at=started)
    log.info("Insight saved.")


if __name__ == "__main__":
    main()
