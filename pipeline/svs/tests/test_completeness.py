"""Step 12 / Part E: every official Challenge #14 resource (docs/official_resources_links.md) and every EIC class-A item
(pipeline/svs/cache/eic_inventory.json) has docs/official/<id>.md, a manifest (an official record that lists the ID, or the
live Bloop product that decodes it) and a row in docs/official/VALIDATION_TABLE.md (a 'no validation source' row counts)."""
import unittest
from svs.config import DOCS_OFFICIAL, LINKS_DOC, PUBLIC_OFFICIAL, REPO
from svs.eic import decoded_by
from svs.resources import eic_class_a, official_ids, records

class Completeness(unittest.TestCase):
    def test_links_doc_exists(self):
        self.assertTrue(LINKS_DOC.exists(), f"{LINKS_DOC} is missing: the official list cannot be checked")

    def test_every_official_and_class_a_item_is_covered(self):
        from products.registry import PRODUCTS
        table = (DOCS_OFFICIAL / "VALIDATION_TABLE.md").read_text(encoding="utf-8")
        recs, live = records(), decoded_by()
        missing = []
        for sid in sorted(set(official_ids()) | set(eic_class_a())):
            if not (DOCS_OFFICIAL / f"{sid}.md").exists(): missing.append((sid, "docs/official/<id>.md")); continue
            if sid in recs:
                name = recs[sid]["record"]
                if not (PUBLIC_OFFICIAL / name / "manifest.json").exists(): missing.append((sid, "manifest"))
            elif sid in live:
                name = f"live_{live[sid]}"
                if not (REPO / "public" / "data" / PRODUCTS[live[sid]].outputs[0]).exists(): missing.append((sid, "live product output"))
            else:
                missing.append((sid, "manifest or live product")); continue
            if f"| {name} |" not in table: missing.append((sid, f"validation row for {name}"))
        self.assertEqual(missing, [], f"incomplete: {missing}")

if __name__ == "__main__":
    unittest.main()
