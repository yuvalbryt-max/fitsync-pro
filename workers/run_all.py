"""
Master runner — executes all sync workers sequentially.
A failing worker is logged but does NOT crash the container.
Railway cron: schedule this script instead of individual workers.
"""
import subprocess, sys, logging, os
from datetime import datetime, timezone

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

WORKERS = [
    "daily_summary.py",
    "ai_insight.py",
    "garmin_sync.py",
    "jefit_sync.py",
]


def run_worker(script: str) -> bool:
    log.info(f"▶ Starting {script}...")
    try:
        result = subprocess.run(
            [sys.executable, script],
            timeout=300,  # 5 min max per worker
            capture_output=False,
        )
        if result.returncode == 0:
            log.info(f"✅ {script} completed successfully")
            return True
        else:
            log.error(f"❌ {script} exited with code {result.returncode}")
            return False
    except subprocess.TimeoutExpired:
        log.error(f"⏱ {script} timed out after 300s")
        return False
    except Exception as exc:
        log.error(f"💥 {script} unexpected error: {exc}")
        return False


if __name__ == "__main__":
    started = datetime.now(timezone.utc).isoformat()
    log.info(f"=== FitSync master runner started at {started} ===")

    results = {}
    for w in WORKERS:
        results[w] = run_worker(w)

    log.info("=== Run summary ===")
    for w, ok in results.items():
        log.info(f"  {'✅' if ok else '❌'} {w}")

    failures = [w for w, ok in results.items() if not ok]
    if failures:
        log.warning(f"{len(failures)} worker(s) failed: {', '.join(failures)}")
    else:
        log.info("All workers completed successfully 🎉")

    # Exit 0 always — don't crash Railway on partial failures
    sys.exit(0)
