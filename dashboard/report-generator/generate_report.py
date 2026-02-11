"""
Full Report Generator — Capture + Build in one step.

Usage:
    python generate_report.py
    python generate_report.py --client "Sarah M." --date-range "Jan 1 - Jan 15, 2026"
    python generate_report.py --skip-capture  (if screenshots already exist)
"""

import argparse
from capture import load_config, capture_report
from build_deck import build_report


def main():
    parser = argparse.ArgumentParser(
        description="Capture Looker Studio dashboard and generate PowerPoint report"
    )
    parser.add_argument(
        "--date-range",
        help='Date range for the report (e.g., "Jan 1 - Jan 15, 2026")'
    )
    parser.add_argument(
        "--client",
        help="Client name (overrides config.json)"
    )
    parser.add_argument(
        "--skip-capture",
        action="store_true",
        help="Skip screenshot capture (use existing screenshots)"
    )
    args = parser.parse_args()

    config = load_config()

    # Step 1: Capture screenshots
    if not args.skip_capture:
        print("=" * 50)
        print("STEP 1: Capturing Looker Studio screenshots")
        print("=" * 50)
        capture_report(config)
        print()

    # Step 2: Build PowerPoint
    print("=" * 50)
    print("STEP 2: Building PowerPoint deck")
    print("=" * 50)
    output = build_report(
        config,
        date_range=args.date_range,
        client_name=args.client
    )

    print()
    print("=" * 50)
    print(f"DONE! Report saved to: {output}")
    print("=" * 50)


if __name__ == "__main__":
    main()
