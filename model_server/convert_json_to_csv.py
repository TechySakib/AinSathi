import json
import re
from pathlib import Path

import pandas as pd

INPUT_FILE = Path("Contextualized_Bangladesh_Legal_Acts.json")
OUTPUT_FILE = Path("data/legal_sections.csv")


def extract_section_number(text: str) -> str:
    match = re.match(r"^\s*([০-৯\d]+)[।.]", str(text))
    if not match:
        return ""
    return match.group(1)


def main():
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    rows = []
    counter = 1

    for act in data.get("acts", []):
        act_title = str(act.get("act_title", "Unknown Act")).strip()
        year = str(act.get("act_year", "")).strip()
        is_repealed = act.get("csv_metadata", {}).get("is_repealed", False)
        status = "repealed" if is_repealed else "active"

        for sec in act.get("sections", []):
            text = str(sec.get("section_content", "")).strip()
            if not text:
                continue

            rows.append({
                "id": f"C{counter}",
                "act_title": act_title,
                "year": year,
                "section": extract_section_number(text),
                "status": status,
                "text": text,
            })
            counter += 1

    df = pd.DataFrame(rows)
    df.to_csv(OUTPUT_FILE, index=False, encoding="utf-8")

    print("Done")
    print(f"Saved {len(df)} sections to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
    