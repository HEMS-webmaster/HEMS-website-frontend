#!/usr/bin/env python3
"""
Generates preview assets for uploaded Workshop Manager proceeding PDFs:
  - *_Abstract.pdf -> <stem>_preview.txt (first ~100 words in clean NFC UTF-8)
  - Other PDFs     -> <stem>_preview.png (page 1 rendered at 150 DPI)
"""

import os
import re
import sys
import unicodedata


MATH_SPECIAL = {
    0x210E: "h", 0x212C: "B", 0x2130: "E", 0x2131: "F", 0x210B: "H",
    0x2110: "I", 0x2112: "L", 0x2133: "M", 0x211B: "R", 0x212F: "e",
    0x210A: "g", 0x2134: "o", 0x2102: "C", 0x210D: "H", 0x2115: "N",
    0x2119: "P", 0x211A: "Q", 0x211D: "R", 0x2124: "Z", 0x2126: "Ω",
    0x212B: "Å",
}
GREEK_UPPER = "ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ"
GREEK_LOWER = "αβγδεζηθικλμνξοπρςστυφχψω"
GREEK_VAR = ["ε", "θ", "κ", "φ", "ρ", "π"]


def map_math_char(ch: str) -> str:
    cp = ord(ch)
    if cp in MATH_SPECIAL:
        return MATH_SPECIAL[cp]
    for idx in range(26):
        start = 0x1D400 + idx * 26
        if start <= cp <= start + 25:
            base = 65 if idx % 2 == 0 else 97
            return chr(base + (cp - start))
    for block_start in (0x1D6A8, 0x1D6E2, 0x1D71C, 0x1D756, 0x1D790):
        if block_start <= cp < block_start + 25:
            off = cp - block_start
            if off == 17:
                return "Θ"
            mapped = off - 1 if off > 17 else off
            return GREEK_UPPER[mapped]
        if cp == block_start + 25:
            return "∇"
        lower_start = block_start + 26
        if lower_start <= cp < lower_start + 25:
            return GREEK_LOWER[cp - lower_start]
        if cp == block_start + 51:
            return "∂"
        if block_start + 52 <= cp <= block_start + 57:
            return GREEK_VAR[cp - (block_start + 52)]
    for dstart in (0x1D7CE, 0x1D7D8, 0x1D7E2, 0x1D7EC, 0x1D7F6):
        if dstart <= cp <= dstart + 9:
            return str(cp - dstart)
    return ch


def clean_pdf_text(raw: str) -> str:
    text = re.sub(r"[\uF0B7\uF0A7\uF076\uF0D8\uF0A8]", "•", raw or "")
    text = text.replace("\u200B", "").replace("\ufeff", "")
    text = "".join(map_math_char(ch) for ch in text)
    text = unicodedata.normalize("NFC", text)
    words = re.split(r"\s+", text.strip())
    words = [w for w in words if w]
    if len(words) > 100:
        return " ".join(words[:100]) + "..."
    return " ".join(words)


def extract_abstract_preview(pdf_path: str, out_txt_path: str) -> None:
    chunks = []
    try:
        import fitz  # PyMuPDF

        doc = fitz.open(pdf_path)
        for i in range(min(2, len(doc))):
            chunks.append(doc[i].get_text("text") or "")
        doc.close()
    except Exception:
        from pypdf import PdfReader

        reader = PdfReader(pdf_path)
        for page in reader.pages[:2]:
            chunks.append(page.extract_text() or "")

    preview_text = clean_pdf_text("\n".join(chunks))
    with open(out_txt_path, "w", encoding="utf-8", newline="\n") as f:
        f.write(preview_text)


def render_first_page_png(pdf_path: str, out_png_path: str) -> None:
    import fitz  # PyMuPDF

    doc = fitz.open(pdf_path)
    if len(doc) == 0:
        doc.close()
        raise ValueError(f"PDF has 0 pages: {pdf_path}")
    page = doc[0]
    pix = page.get_pixmap(dpi=150, alpha=False)
    pix.save(out_png_path)
    doc.close()


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: preview_generator.py <pdf_path>", file=sys.stderr)
        return 1

    pdf_path = os.path.abspath(sys.argv[1])
    if not os.path.isfile(pdf_path):
        print(f"File not found: {pdf_path}", file=sys.stderr)
        return 1

    stem, _ = os.path.splitext(pdf_path)
    if "_Abstract.pdf" in os.path.basename(pdf_path):
        out_txt = f"{stem}_preview.txt"
        extract_abstract_preview(pdf_path, out_txt)
    else:
        out_png = f"{stem}_preview.png"
        render_first_page_png(pdf_path, out_png)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
