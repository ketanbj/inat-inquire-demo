FROM node:22-bookworm AS portal-build
WORKDIR /app/portal
COPY portal/package.json portal/package-lock.json portal/tsconfig.json portal/vite.config.ts portal/index.html ./
COPY portal/src ./src
ARG VITE_DEMO_API_URL=
ENV VITE_DEMO_API_URL=${VITE_DEMO_API_URL}
RUN npm ci --no-audit --no-fund && npm run build

FROM python:3.11-slim AS runtime
WORKDIR /app
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV DEMO_STATIC_DIR=/app/portal/dist
ENV DEMO_DATA_DIR=/app/data
COPY server/pyproject.toml server/uv.lock ./server/
RUN pip install --no-cache-dir uv==0.8.17 \
    && cd /app/server \
    && uv export --frozen --no-dev --no-emit-project --format requirements.txt --output-file /tmp/requirements.txt >/dev/null \
    && pip install --no-cache-dir --require-hashes -r /tmp/requirements.txt \
    && pip uninstall -y uv \
    && rm -f /tmp/requirements.txt
COPY server/app ./server/app
COPY data ./data
COPY --from=portal-build /app/portal/dist ./portal/dist
RUN adduser --disabled-password --gecos "" --home /nonexistent --shell /usr/sbin/nologin appuser \
    && chown -R appuser:appuser /app
USER appuser
WORKDIR /app/server
EXPOSE 8088
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8088"]
