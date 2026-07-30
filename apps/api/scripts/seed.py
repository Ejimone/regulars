"""Seed the database from committed fixtures.

Deterministic and idempotent: each fixture tenant is dropped (CASCADE clears
its documents/chunks/messages/drafts) and rebuilt, so this doubles as the
demo-tenant reset. Embeddings are computed locally at seed time.

Run:  python -m scripts.seed
"""

import json
import sys
from pathlib import Path

from sqlalchemy import delete, select

from app.channels import get_adapter
from app.db.models import Document, Message, Tenant
from app.db.session import get_sessionmaker
from app.rag.indexing import index_document

FIXTURES_DIR = Path(__file__).resolve().parent.parent / "fixtures"


def seed_business(business_dir: Path) -> None:
    business = json.loads((business_dir / "business.json").read_text())
    messages = json.loads((business_dir / "messages.json").read_text())

    with get_sessionmaker()() as session:
        existing = session.scalar(select(Tenant).where(Tenant.slug == business["slug"]))
        if existing:
            session.execute(delete(Tenant).where(Tenant.id == existing.id))

        tenant = Tenant(slug=business["slug"], name=business["name"], vertical=business["vertical"])
        session.add(tenant)
        session.flush()

        chunk_count = 0
        for doc_fixture in business["documents"]:
            document = Document(
                tenant_id=tenant.id,
                title=doc_fixture["title"],
                kind=doc_fixture["kind"],
                content=doc_fixture["content"],
            )
            session.add(document)
            session.flush()
            chunk_count += index_document(session, document)

        # Only the payload crosses this line — exactly what a live webhook would
        # deliver. The fixture's other fields are eval ground truth, not inputs.
        for m in messages:
            normalized = get_adapter(m["channel"]).parse(m["payload"])
            session.add(
                Message(
                    tenant_id=tenant.id,
                    channel=normalized.channel,
                    external_id=normalized.external_id,
                    author_name=normalized.author_name,
                    content=normalized.content,
                    rating=normalized.rating,
                    raw=normalized.raw,
                    received_at=normalized.received_at,
                )
            )

        session.commit()
        print(
            f"  {business['name']}: {len(business['documents'])} documents, "
            f"{chunk_count} chunks, {len(messages)} messages"
        )


def main() -> int:
    business_dirs = sorted(d for d in FIXTURES_DIR.iterdir() if (d / "business.json").exists())
    if not business_dirs:
        print(f"no fixtures in {FIXTURES_DIR} — run: python -m scripts.generate_fixtures")
        return 1
    print("seeding (first run downloads the embedding model, ~100MB)...")
    for business_dir in business_dirs:
        seed_business(business_dir)
    return 0


if __name__ == "__main__":
    sys.exit(main())
