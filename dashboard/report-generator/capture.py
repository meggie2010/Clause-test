"""
Looker Studio PDF to Images

Converts a Looker Studio PDF export into individual page images
for use in the PowerPoint deck builder.

Usage:
    python capture.py
    python capture.py --pdf "path/to/report.pdf"
"""

import argparse
import json
import sys
from pathlib import Path

from pdf2image import convert_from_path


def load_config():
    config_path = Path(__file__).parent / "config.json"
    with open(config_path) as f:
        return json.load(f)


def find_pdf(config):
    """Look for a PDF file in the report-generator directory."""
    script_dir = Path(__file__).parent
    pdfs = list(script_dir.glob("*.pdf"))
    if len(pdfs) == 1:
        return pdfs[0]
    elif len(pdfs) > 1:
        print("Multiple PDF files found:")
        for i, pdf in enumerate(pdfs):
            print(f"  {i + 1}. {pdf.name}")
        print("\nPlease specify which one with: python capture.py --pdf \"filename.pdf\"")
        sys.exit(1)
    return None


def extract_pages(pdf_path, config):
    """Convert each PDF page to a PNG image."""
    pages_config = config["report_pages"]
    output_dir = Path(__file__).parent / "screenshots"
    output_dir.mkdir(exist_ok=True)

    print(f"Converting PDF: {pdf_path}")
    images = convert_from_path(str(pdf_path), dpi=200)
    print(f"Found {len(images)} pages in PDF")

    saved = []
    for page_config in pages_config:
        name = page_config["name"]
        page_index = page_config["page_index"]
        label = page_config["label"]

        if page_index >= len(images):
            print(f"  WARNING: Page {page_index} requested but PDF only has {len(images)} pages. Skipping '{label}'.")
            continue

        output_path = output_dir / f"{name}.png"
        images[page_index].save(str(output_path), "PNG")
        print(f"  Page {page_index + 1} -> {output_path.name} ({label})")
        saved.append(output_path)

    # If there are more PDF pages than configured pages, save them too
    configured_indices = {p["page_index"] for p in pages_config}
    for i, img in enumerate(images):
        if i not in configured_indices:
            output_path = output_dir / f"page_{i + 1}.png"
            img.save(str(output_path), "PNG")
            print(f"  Page {i + 1} -> {output_path.name} (extra page)")
            saved.append(output_path)

    print(f"\nDone! {len(saved)} images saved to: {output_dir}")
    return output_dir


def capture_report(config, pdf_path=None):
    """Main entry point — find PDF and extract pages."""
    if pdf_path:
        pdf_path = Path(pdf_path)
    else:
        pdf_path = find_pdf(config)

    if not pdf_path or not pdf_path.exists():
        print("ERROR: No PDF file found.")
        print("\nTo use this script:")
        print("  1. In Looker Studio, go to File > Download > PDF")
        print("  2. Save the PDF in the report-generator folder")
        print("  3. Run this script again")
        print("\nOr specify the path: python capture.py --pdf \"path/to/report.pdf\"")
        sys.exit(1)

    return extract_pages(pdf_path, config)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Convert Looker Studio PDF export to images"
    )
    parser.add_argument(
        "--pdf",
        help="Path to the Looker Studio PDF file"
    )
    args = parser.parse_args()

    config = load_config()
    capture_report(config, pdf_path=args.pdf)
