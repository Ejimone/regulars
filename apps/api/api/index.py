"""Vercel serverless entrypoint.

Vercel's Python runtime looks for an ASGI callable named ``app`` in files under
``api/``; ``vercel.json`` rewrites every path here so FastAPI keeps doing its own
routing. The bundle deliberately excludes fastembed — see EMBEDDING_PROVIDER in
app/config.py.
"""

from app.main import app

__all__ = ["app"]
