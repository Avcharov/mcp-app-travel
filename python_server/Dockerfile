FROM python:3.14 AS base

COPY uv.lock pyproject.toml .
COPY --from=ghcr.io/astral-sh/uv:0.9.2 /uv /bin/
RUN uv venv -p 3.14 && \
    . .venv/bin/activate && \
    uv sync --frozen

FROM python:3.14-slim AS final

ENV PATH="/.venv/bin:${PATH}"

COPY --from=base /.venv /.venv
COPY . /app

CMD ["python", "/app/src/main.py"]
