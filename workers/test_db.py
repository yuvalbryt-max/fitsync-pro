"""Basic tests for db.py helpers."""
import os
import pytest
from unittest.mock import MagicMock, patch


# ---------------------------------------------------------------------------
# get_user_id
# ---------------------------------------------------------------------------

def test_get_user_id_returns_value(monkeypatch):
    monkeypatch.setenv("USER_ID", "abc-123")
    from db import get_user_id
    assert get_user_id() == "abc-123"


def test_get_user_id_raises_when_missing(monkeypatch):
    monkeypatch.delenv("USER_ID", raising=False)
    # Reload to pick up env change
    import importlib, db
    importlib.reload(db)
    with pytest.raises(ValueError, match="USER_ID"):
        db.get_user_id()


# ---------------------------------------------------------------------------
# upsert
# ---------------------------------------------------------------------------

def test_upsert_returns_zero_for_empty_data():
    from db import upsert
    mock_client = MagicMock()
    result = upsert(mock_client, "some_table", [], "id")
    assert result == 0
    mock_client.table.assert_not_called()


def test_upsert_returns_row_count():
    from db import upsert
    mock_client = MagicMock()
    data = [{"id": 1, "val": "a"}, {"id": 2, "val": "b"}]
    result = upsert(mock_client, "some_table", data, "id")
    assert result == 2
    mock_client.table.assert_called_once_with("some_table")


# ---------------------------------------------------------------------------
# log_sync
# ---------------------------------------------------------------------------

def test_log_sync_inserts_row(monkeypatch):
    monkeypatch.setenv("USER_ID", "user-xyz")
    import importlib, db
    importlib.reload(db)

    mock_client = MagicMock()
    db.log_sync(mock_client, "garmin", "success", records=5, started_at="2026-01-01T00:00:00+00:00")

    mock_client.table.assert_called_once_with("sync_log")
    insert_call_args = mock_client.table.return_value.insert.call_args[0][0]
    assert insert_call_args["sync_type"] == "garmin"
    assert insert_call_args["status"] == "success"
    assert insert_call_args["records_synced"] == 5
    assert insert_call_args["user_id"] == "user-xyz"


def test_log_sync_with_error(monkeypatch):
    monkeypatch.setenv("USER_ID", "user-xyz")
    import importlib, db
    importlib.reload(db)

    mock_client = MagicMock()
    db.log_sync(mock_client, "jefit", "failed", error="timeout")

    insert_call_args = mock_client.table.return_value.insert.call_args[0][0]
    assert insert_call_args["error_msg"] == "timeout"
    assert insert_call_args["status"] == "failed"
