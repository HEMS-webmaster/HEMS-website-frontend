import sys
import os
import fitz  # PyMuPDF
import re

def generate_preview(pdf_path):
    if not os.path.exists(pdf_path):
        print(f"Error: File not found {pdf_path}")
        sys.exit(1)

    filename = os.path.basename(pdf_path)
    
    try:
        doc = fitz.open(pdf_path)
        if len(doc) == 0:
            print("Error: Empty PDF")
            sys.exit(1)
            
        page = doc.load_page(0)
        
        if "_Abstract" in filename:
            # Extract text using dictionary to access font sizes and block structures
            dict_text = page.get_text('dict')
            lines = [l for b in dict_text.get('blocks', []) if 'lines' in b for l in b['lines']]
            
            paragraphs = []
            current_para = []
            current_size = None
            
            for l in lines:
                text = ''.join([s.get('text', '') for s in l.get('spans', [])]).strip()
                size = l['spans'][0]['size'] if l.get('spans') else 0
                
                # New paragraph if empty line or significant font size change
                if not text or (current_size and abs(size - current_size) > 1):
                    if current_para:
                        paragraphs.append({'text': ' '.join(current_para), 'size': current_size})
                        current_para = []
                    if text:
                        current_para.append(text)
                        current_size = size
                else:
                    if text:
                        current_para.append(text)
                        if not current_size:
                            current_size = size
            
            if current_para:
                paragraphs.append({'text': ' '.join(current_para), 'size': current_size})
            
            if not paragraphs:
                # Fallback to flat text if parsing failed
                raw_text = page.get_text()
                words = [w for w in re.split(r'\s+', raw_text) if w]
                first_100 = " ".join(words[:100])
                if len(words) > 100:
                    first_100 += "..."
            else:
                max_sz = max((p['size'] for p in paragraphs), default=0)
                title_para = next((p for p in paragraphs if abs(p['size'] - max_sz) < 1), {'text': ''})
                body_para = max([p for p in paragraphs if p != title_para], key=lambda x: len(x['text']), default={'text': ''})
                
                combined_text = title_para['text'] + "\n\n" + body_para['text']
                words = [w for w in re.split(r'\s+', combined_text) if w]
                first_100 = " ".join(words[:100])
                if len(words) > 100:
                    first_100 += "..."
                
            out_path = pdf_path.replace('.pdf', '_preview.txt')
            with open(out_path, 'w', encoding='utf-8') as f:
                f.write(first_100)
            print(f"Success: Wrote text preview to {out_path}")
            
        else:
            # Extract image (Presentation or Poster)
            # Scale to roughly 600px width to keep file size small
            zoom = 600.0 / page.rect.width
            pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom))
            out_path = pdf_path.replace('.pdf', '_preview.png')
            pix.save(out_path)
            print(f"Success: Wrote image preview to {out_path}")
            
    except Exception as e:
        print(f"Error processing {pdf_path}: {e}")
        sys.exit(1)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python preview_generator.py <path_to_pdf>")
        sys.exit(1)
        
    pdf_path = sys.argv[1]
    generate_preview(pdf_path)
