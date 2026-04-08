FROM mcr.microsoft.com/devcontainers/javascript-node:22

# Python for ETL
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-venv python3-pip \
    cron \
    && rm -rf /var/lib/apt/lists/*
