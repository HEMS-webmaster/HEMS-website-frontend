import fitz
import sys

doc = fitz.open(sys.argv[1])
page = doc.load_page(0)
blocks = page.get_text("dict")["blocks"]

for b in blocks[:5]:
    if "lines" in b:
        text = " ".join(["".join([span["text"] for span in line["spans"]]) for line in b["lines"]])
        font_size = b["lines"][0]["spans"][0]["size"]
        print(f"Size: {font_size:.2f} | Text: {text[:80]}")
