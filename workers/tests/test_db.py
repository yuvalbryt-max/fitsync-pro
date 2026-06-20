"""Minimal unit tests for db.py helper functions."""
import pytest
from unittest.mock import MagicMock, patch


def test_upsert_empty_returns_zero():
    """upsert with empty list returns 0 without calling Supabase."""
    import sys, os
    sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
    from db import upsert
    mock_client = MagicMock()
    result = upsert(mock_client, "any_table", [], "id")
    assert result == 0
    mock_client.table.assert_not_called()


def test_upsert_returns_count():
    """upsert returns the number of rows provided."""
    import sys, os
    sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
    from db import upsert
    mock_client = MagicMock()
    mock_client.table.return_value.upsert.return_value.execute.return_value = None
    rows = [{"id": 1, "val": "a"}, {"id": 2, "val": "b"}]
    result = upsert(mock_client, "test_table", rows, "id")
    assert result == 2


def test_get_user_id_raises_without_env():
    """get_user_id raises ValueError when USER_ID env var is missing."""
    import sys, os
    sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
    from db import get_user_id
    with patch.dict(os.environ, {}, clear=True):
        # Remove USER_ID if present
        os.environ.pop("USER_ID", None)
        with pytest.raises((ValueError, KeyError)):
            get_user_id()
