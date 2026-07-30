"""Run the pipeline over every unprocessed message. The M2 CLI face of the
product — what the dashboard will trigger per-message in M3.

Run:  python -m scripts.draft_all
"""

import sys

from sqlalchemy import select

from app.db.models import Tenant
from app.db.session import get_sessionmaker
from app.llm import get_llm
from app.log import setup_logging
from app.pipeline.run import process_new_messages


def main() -> int:
    setup_logging()
    llm = get_llm()
    with get_sessionmaker()() as session:
        for tenant in session.scalars(select(Tenant)).all():
            count = process_new_messages(session, llm, tenant.id)
            print(f"{tenant.slug}: processed {count}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
