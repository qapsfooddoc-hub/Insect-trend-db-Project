import os
import sys
import zipfile
import xml.etree.ElementTree as ET

sys.stdout.reconfigure(encoding='utf-8')

sample_dir = r"D:\Insect-trend-db Project\ไฟล์ตัวอย่าง"

for fname in os.listdir(sample_dir):
    if not fname.endswith(".xlsx"):
        continue
    fpath = os.path.join(sample_dir, fname)
    print("=" * 60)
    print(f"FILE: {fname}")
    print("=" * 60)
    try:
        with zipfile.ZipFile(fpath, 'r') as z:
            chart_files = [n for n in z.namelist() if 'charts/chart' in n and n.endswith('.xml')]
            print(f"Found {len(chart_files)} charts.")
            for cfile in chart_files:
                content = z.read(cfile).decode('utf-8', errors='ignore')
                root = ET.fromstring(content)
                # Find title
                titles = []
                for elem in root.iter():
                    if elem.tag.endswith('}t') and elem.text:
                        titles.append(elem.text.strip())
                print(f"  Chart {cfile}:")
                # Group text into reasonable strings
                joined = " ".join([t for t in titles if t])
                print(f"    Text elements: {joined[:300]}")
    except Exception as e:
        print(f"  Error: {e}")
