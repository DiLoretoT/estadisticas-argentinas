"""Tests para etl/common.py — parsing y merge."""

import sys
from datetime import date
from pathlib import Path

# Asegurar que el dir etl/ esté en path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from common import parse_series_points, merge_series_points  # noqa: E402


def test_parse_series_points_happy_path():
    payload = {
        "data": [
            ["2024-01-01", 1.5],
            ["2024-02-01", 2.5],
            ["2024-03-01", 3.5],
        ]
    }
    points = parse_series_points(payload)
    assert len(points) == 3
    assert points[0] == (date(2024, 1, 1), 1.5)
    assert points[2] == (date(2024, 3, 1), 3.5)


def test_parse_series_points_skips_header_row():
    payload = {
        "data": [
            ["date", "value"],
            ["2024-01-01", 1.5],
        ]
    }
    points = parse_series_points(payload)
    assert len(points) == 1


def test_parse_series_points_skips_null_values():
    payload = {
        "data": [
            ["2024-01-01", 1.5],
            ["2024-02-01", None],
            ["2024-03-01", 3.5],
        ]
    }
    points = parse_series_points(payload)
    assert len(points) == 2


def test_parse_series_points_skips_invalid_dates():
    payload = {
        "data": [
            ["2024-01-01", 1.5],
            ["not-a-date", 2.5],
            ["2024-03-01", 3.5],
        ]
    }
    points = parse_series_points(payload)
    assert len(points) == 2


def test_parse_series_points_skips_invalid_values():
    payload = {
        "data": [
            ["2024-01-01", 1.5],
            ["2024-02-01", "no-numero"],
        ]
    }
    points = parse_series_points(payload)
    assert len(points) == 1


def test_parse_series_points_empty_payload():
    assert parse_series_points({}) == []
    assert parse_series_points({"data": []}) == []


def test_merge_series_points_dedupes_by_date():
    existing = [(date(2024, 1, 1), 1.0), (date(2024, 2, 1), 2.0)]
    incoming = [(date(2024, 2, 1), 2.5), (date(2024, 3, 1), 3.0)]
    merged = merge_series_points(existing, incoming)
    assert len(merged) == 3
    # incoming sobrescribe existing en el mismo date
    assert merged[1] == (date(2024, 2, 1), 2.5)


def test_merge_series_points_returns_sorted():
    existing = [(date(2024, 3, 1), 3.0)]
    incoming = [(date(2024, 1, 1), 1.0), (date(2024, 2, 1), 2.0)]
    merged = merge_series_points(existing, incoming)
    assert [p[0] for p in merged] == [
        date(2024, 1, 1),
        date(2024, 2, 1),
        date(2024, 3, 1),
    ]


def test_merge_series_points_empty():
    assert merge_series_points([], []) == []
    assert merge_series_points([(date(2024, 1, 1), 1.0)], []) == [
        (date(2024, 1, 1), 1.0)
    ]
