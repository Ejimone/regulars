"""Semantic chunking: retrieval units follow the document's own structure.

Documents are small and structured (hours, policies, FAQs), so we split on
blank lines and markdown headings, then greedily merge blocks up to a size
cap. FAQ documents are the exception: every Q/A block stays its own chunk so
retrieval lands on exactly one answer, never a bundle of unrelated ones.
"""

import re

MAX_CHUNK_CHARS = 1200
MIN_CHUNK_CHARS = 200

_BLOCK_SPLIT = re.compile(r"\n\s*\n")


def chunk_document(content: str, kind: str) -> list[str]:
    blocks = [b.strip() for b in _BLOCK_SPLIT.split(content) if b.strip()]
    if not blocks:
        return []
    if kind == "faq":
        return blocks

    chunks: list[str] = []
    current = ""
    for block in blocks:
        starts_section = block.startswith("#")
        over_cap = current and len(current) + len(block) + 2 > MAX_CHUNK_CHARS
        # A heading only forces a boundary if what we have is already substantial;
        # otherwise tiny fragments (e.g. a title line) would become chunks.
        if current and (over_cap or (starts_section and len(current) >= MIN_CHUNK_CHARS)):
            chunks.append(current)
            current = block
        else:
            current = f"{current}\n\n{block}" if current else block
    if current:
        if chunks and len(current) < MIN_CHUNK_CHARS:
            chunks[-1] = f"{chunks[-1]}\n\n{current}"
        else:
            chunks.append(current)
    return chunks
