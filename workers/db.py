"""Shared Supabase client and helpers for all sync workers."""
import os
from datetime import datetime, timezone
from supabase import create_client, Client


def get_client() -> Client:
    return create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])


def get_user_id() -> str:
    uid = os.environ.get("USER_ID", "")
    if not uid:
        raise ValueError("USER_ID environment variable not set")
    return uid


def log_sync(client: Client, sync_type: str, status: str,
             records: int = 0, error: str | None = None,
             started_at: str | None = None) -> None:
    client.table("sync_log").insert({
        "user_id":        get_user_id(),
        "sync_type":      sync_type,
        "started_at":     started_at or datetime.now(timezone.utc).isoformat(),
        "finished_at":    datetime.now(timezone.utc).isoformat(),
        "status":         status,
        "records_synced": records,
        "error_msg":      error,
    }).execute()


def upsert(client: Client, table: str, data: list[dict], conflict: str) -> int:
    if not data:
        return 0
    client.table(table).upsert(data, on_conflict=conflict).execute()
    return len(data)
