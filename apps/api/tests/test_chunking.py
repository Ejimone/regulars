from app.rag.chunking import MAX_CHUNK_CHARS, chunk_document


def test_faq_every_block_is_its_own_chunk() -> None:
    content = (
        "Q: Do you take walk-ins?\nA: Yes, before 3pm.\n\n"
        "Q: Is parking free?\nA: Yes, behind the building.\n\n"
        "Q: Do you offer payment plans?\nA: Yes, for treatments over $500."
    )
    chunks = chunk_document(content, kind="faq")
    assert len(chunks) == 3
    assert chunks[1].startswith("Q: Is parking free?")


def test_each_substantial_section_is_its_own_chunk() -> None:
    sections = [f"## Section {i}\n\n" + ("word " * 120).strip() for i in range(5)]
    chunks = chunk_document("\n\n".join(sections), kind="policies")
    assert len(chunks) == 5  # one section -> one chunk -> one clean citation
    assert all(c.startswith("## Section") for c in chunks)
    assert all(len(c) <= MAX_CHUNK_CHARS for c in chunks)


def test_tiny_sections_merge_together() -> None:
    sections = [f"## S{i}\n\nShort line." for i in range(6)]
    chunks = chunk_document("\n\n".join(sections), kind="pricing")
    assert 1 <= len(chunks) < 6  # too small to stand alone


def test_tiny_trailing_block_merges_backward() -> None:
    content = ("word " * 150).strip() + "\n\n" + ("word " * 150).strip() + "\n\nThanks!"
    chunks = chunk_document(content, kind="services")
    assert chunks[-1].endswith("Thanks!")
    assert all(len(c) >= 10 for c in chunks)


def test_empty_document() -> None:
    assert chunk_document("  \n\n  ", kind="faq") == []
