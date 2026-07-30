FROM python:3.13-slim

WORKDIR /app

# Install dependencies first so source edits don't bust the layer cache
COPY pyproject.toml ./
COPY app ./app
RUN pip install --no-cache-dir -e .

COPY tests ./tests

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
