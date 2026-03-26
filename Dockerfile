FROM python:3.11-slim AS base

WORKDIR /app

COPY pyproject.toml .
COPY engine/ engine/
COPY mock_scim/ mock_scim/
COPY config/ config/

RUN pip install --no-cache-dir -e ".[all]"
RUN mkdir -p data

EXPOSE 5001

CMD ["lifecycle-lab", "run", "--mode", "sim"]
