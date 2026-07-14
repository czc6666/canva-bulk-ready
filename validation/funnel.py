#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import urllib.error
import urllib.request
from pathlib import Path

NAMESPACE = "canva-bulk-ready-prod-v1"
EVENTS = [
    "page_view",
    "sample_loaded",
    "file_selected",
    "check_succeeded",
    "check_failed",
    "test_batch_downloaded",
    "receipt_copied",
    "feedback_clicked",
]
DEFAULT_BASELINE = Path(__file__).with_name("launch-baseline.json")
DEFAULT_OWNER = Path(__file__).with_name("owner-events-after-launch.json")


def read_counter(event: str) -> int:
    url = f"https://api.counterapi.dev/v1/{NAMESPACE}/{event}/"
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 CanvaBulkReady/0.1"})
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            return int(json.load(response).get("count", 0))
    except urllib.error.HTTPError as exc:
        if exc.code == 400:
            return 0
        raise


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--baseline", type=Path, default=DEFAULT_BASELINE)
    parser.add_argument("--owner-events", type=Path, default=DEFAULT_OWNER)
    args = parser.parse_args()

    baseline_payload = json.loads(args.baseline.read_text(encoding="utf-8"))
    baseline = baseline_payload["counters"]
    owner = {event: 0 for event in EVENTS}
    if args.owner_events.exists():
        owner.update(json.loads(args.owner_events.read_text(encoding="utf-8")).get("events", {}))
    current = {event: read_counter(event) for event in EVENTS}
    raw = {event: current[event] - int(baseline.get(event, 0)) for event in EVENTS}
    corrected = {event: raw[event] - int(owner.get(event, 0)) for event in EVENTS}
    print(json.dumps({
        "namespace": NAMESPACE,
        "baseline": baseline,
        "current": current,
        "raw_delta": raw,
        "known_owner_events_after_baseline": owner,
        "corrected_unattributed_delta": corrected,
        "warning": "Anonymous counters are spoofable and cannot prove E4 without a real-user reply, sanitized artifact, or concrete feedback.",
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
