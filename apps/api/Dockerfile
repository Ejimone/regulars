FROM python:3.13-slim

WORKDIR /app

# Install dependencies first so source edits don't bust the layer cache
COPY pyproject.toml ./
COPY app ./app
RUN pip install --no-cache-dir -e .

COPY alembic.ini ./
COPY alembic ./alembic
COPY scripts ./scripts
COPY fixtures ./fixtures
COPY tests ./tests

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
