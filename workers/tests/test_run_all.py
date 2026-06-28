"""Tests for run_all.py — master runner."""
import sys
from unittest.mock import patch, MagicMock
import pytest

sys.path.insert(0, "..")
from run_all import run_worker


def test_run_worker_success():
    """A script that exits 0 returns True."""
    with patch("run_all.subprocess.run") as mock_run:
        mock_run.return_value = MagicMock(returncode=0)
        assert run_worker("daily_summary.py") is True


def test_run_worker_failure():
    """A script that exits non-zero returns False."""
    with patch("run_all.subprocess.run") as mock_run:
        mock_run.return_value = MagicMock(returncode=1)
        assert run_worker("garmin_sync.py") is False


def test_run_worker_timeout():
    """A script that times out returns False."""
    import subprocess
    with patch("run_all.subprocess.run", side_effect=subprocess.TimeoutExpired("x", 300)):
        assert run_worker("slow_script.py") is False


def test_run_worker_unexpected_error():
    """An unexpected exception returns False without crashing."""
    with patch("run_all.subprocess.run", side_effect=RuntimeError("oops")):
        assert run_worker("bad_script.py") is False
