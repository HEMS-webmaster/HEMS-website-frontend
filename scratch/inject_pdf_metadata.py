import os
import sys
import re
import argparse
from PyPDF2 import PdfReader, PdfWriter

sys.stdout.reconfigure(encoding='utf-8')

registry_path = r"c:\Antigravity\HEMS-website\docs\design\pdf_seo_registry.md"
base_dir = r"c:\Antigravity\HEMS-website"

def parse_registry(md_path):
    if not os.path.exists(md_path):
        print(f"Error: Registry file not found at {md_path}")
        sys.exit(1)
        
    with open(md_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    blocks = content.split('---')
    entries = []
    
    for block in blocks:
        if '### Registry ID:' not in block:
            continue
            
        entry = {}
        id_match = re.search(r'### Registry ID:\s*(\d+)', block)
        if id_match:
            entry['id'] = id_match.group(1)
            
        for line in block.strip().split('\n'):
            line = line.strip()
            if line.startswith('*   **Filename**:'):
                entry['filename'] = re.sub(r'^\*\s+\*\*Filename\*\*:\s*`([^`]+)`', r'\1', line).strip()
            elif line.startswith('*   **Path**:'):
                entry['path'] = re.sub(r'^\*\s+\*\*Path\*\*:\s*`([^`]+)`', r'\1', line).strip()
            elif line.startswith('*   **Type**:'):
                entry['type'] = re.sub(r'^\*\s+\*\*Type\*\*:\s*`([^`]+)`', r'\1', line).strip()
            elif line.startswith('*   **Year**:'):
                entry['year'] = re.sub(r'^\*\s+\*\*Year\*\*:\s*`([^`]+)`', r'\1', line).strip()
            elif line.startswith('*   **Title**:'):
                entry['title'] = re.sub(r'^\*\s+\*\*Title\*\*:\s*', '', line).strip()
            elif line.startswith('*   **Authors**:'):
                entry['authors'] = re.sub(r'^\*\s+\*\*Authors\*\*:\s*', '', line).strip()
            elif line.startswith('*   **Subject**:'):
                entry['subject'] = re.sub(r'^\*\s+\*\*Subject\*\*:\s*', '', line).strip()
            elif line.startswith('*   **Keywords**:'):
                entry['keywords'] = re.sub(r'^\*\s+\*\*Keywords\*\*:\s*', '', line).strip()

        if 'path' in entry:
            entries.append(entry)
            
    return entries

def main():
    parser = argparse.ArgumentParser(description="HEMS PDF SEO Metadata Injector Script")
    parser.add_argument("--dry-run", action="store_true", help="Parse the registry and check paths without writing changes")
    parser.add_argument("--verify", action="store_true", help="Print current metadata headers of the PDF files")
    args = parser.parse_args()
    
    entries = parse_registry(registry_path)
    print(f"Loaded {len(entries)} PDF registry entries.")
    
    missing_count = 0
    processed_count = 0
    failed_count = 0
    skipped_fake_pdf = 0
    skipped_encrypted = 0
    
    for entry in entries:
        rel_path = entry['path']
        abs_path = os.path.join(base_dir, rel_path)
        
        # Verify file existence
        if not os.path.exists(abs_path):
            print(f"Warning: File not found at path: {rel_path}")
            missing_count += 1
            continue
            
        # Detect magic headers to skip fake files (like HTML or ZIP)
        try:
            with open(abs_path, 'rb') as f:
                header = f.read(4)
        except Exception as e:
            print(f"Error: Failed to read file header for {entry['filename']}: {e}")
            failed_count += 1
            continue
            
        if header.startswith(b'<HTM') or header.startswith(b'<htm') or header.startswith(b' \n<h') or header.startswith(b'<!DO'):
            print(f"[SKIPPED HTML-AS-PDF] ID {entry['id']}: {entry['filename']}")
            skipped_fake_pdf += 1
            continue
            
        if header == b'PK\x03\x04':
            print(f"[SKIPPED ZIP-AS-PDF] ID {entry['id']}: {entry['filename']}")
            skipped_fake_pdf += 1
            continue
            
        if args.dry_run:
            print(f"[DRY-RUN] ID {entry['id']}: Mapped {entry['filename']}")
            processed_count += 1
            continue
            
        if args.verify:
            try:
                reader = PdfReader(abs_path)
                meta = reader.metadata
                print(f"[VERIFY] ID {entry['id']}: {entry['filename']}")
                if meta:
                    for k, v in meta.items():
                        print(f"  {k}: {repr(v)}")
                else:
                    print("  No metadata dictionary found.")
                processed_count += 1
            except Exception as e:
                print(f"Error: Failed to read {entry['filename']}: {e}")
                failed_count += 1
            continue
            
        # Normal execution: Inject metadata
        try:
            reader = PdfReader(abs_path)
            
            # Skip/log encrypted PDFs if encryption is active and PyCryptodome is missing
            if reader.is_encrypted:
                print(f"[SKIPPED ENCRYPTED-NO-AES] ID {entry['id']}: {entry['filename']}")
                skipped_encrypted += 1
                continue
                
            writer = PdfWriter()
            
            # Transfer existing pages to writer
            for page in reader.pages:
                writer.add_page(page)
                
            # Compile new metadata mapping, resolving any IndirectObjects
            existing_meta = reader.metadata
            new_meta = {}
            if existing_meta:
                for k, v in existing_meta.items():
                    k_str = str(k)
                    # Resolve any IndirectObjects to their base objects
                    resolved_val = v.get_object() if hasattr(v, 'get_object') else v
                    if resolved_val is not None:
                        # Clean up types to be standard Python strings or numbers
                        if isinstance(resolved_val, bytes):
                            try:
                                new_meta[k_str] = resolved_val.decode('utf-8')
                            except:
                                new_meta[k_str] = resolved_val.decode('latin1')
                        elif isinstance(resolved_val, list):
                            new_meta[k_str] = ", ".join(str(i) for i in resolved_val)
                        else:
                            new_meta[k_str] = str(resolved_val)
                        
            # Apply the optimized SEO headers
            new_meta['/Title'] = entry['title']
            new_meta['/Author'] = entry['authors']
            new_meta['/Subject'] = entry['subject']
            new_meta['/Keywords'] = entry['keywords']
            
            writer.add_metadata(new_meta)
            
            # Write to a temp file and replace to prevent data corruption
            temp_path = abs_path + ".tmp"
            with open(temp_path, "wb") as f:
                writer.write(f)
                
            os.replace(temp_path, abs_path)
            processed_count += 1
            
            if processed_count % 50 == 0 or processed_count == len(entries):
                print(f"Processed {processed_count}/{len(entries)} files...")
                
        except Exception as e:
            print(f"Error: Failed to inject metadata into {entry['filename']}: {e}")
            failed_count += 1
            if os.path.exists(abs_path + ".tmp"):
                os.remove(abs_path + ".tmp")
                
    print("\n--- Summary ---")
    print(f"Total processed/verified: {processed_count}")
    print(f"Total skipped fake PDFs : {skipped_fake_pdf}")
    print(f"Total skipped encrypted : {skipped_encrypted}")
    print(f"Total missing files     : {missing_count}")
    print(f"Total failed writes     : {failed_count}")

if __name__ == "__main__":
    main()
