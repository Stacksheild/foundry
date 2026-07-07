#!/usr/bin/env bash
# Bootstraps an exe.dev VM to run apps/api as a persistent systemd service.
#
# Designed to be passed to `exe.dev new --command "curl -fsSL <raw-url> | bash"`
# with FOUNDRY_API_TOKEN, FOUNDRY_CORS_ORIGIN, and EXE_DEV_TOKEN provided via
# `--env` (exe.dev injects them into the command's environment). No secrets
# live in this file. Idempotent: safe to re-run on a recycled container.
set -euo pipefail
exec > >(tee -a "$HOME/bootstrap.log") 2>&1
echo "=== bootstrap started $(date -u +%FT%TZ) ==="

: "${FOUNDRY_API_TOKEN:?FOUNDRY_API_TOKEN must be provided via --env}"
: "${FOUNDRY_CORS_ORIGIN:?FOUNDRY_CORS_ORIGIN must be provided via --env}"
: "${EXE_DEV_TOKEN:?EXE_DEV_TOKEN must be provided via --env}"

export DEBIAN_FRONTEND=noninteractive

if ! command -v node >/dev/null 2>&1; then
  echo "--- installing Node 22 ---"
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
node --version
sudo corepack enable

cd "$HOME"
if [ ! -d foundry/.git ]; then
  git clone https://github.com/Stacksheild/foundry.git
fi
cd foundry
git fetch origin live-demo-environment
git checkout live-demo-environment
git reset --hard origin/live-demo-environment
git submodule update --init --recursive

pnpm install
pnpm build:vendor
pnpm build:libs
pnpm --filter @foundry/cli build

cat > "$HOME/foundry-api.env" <<ENV
FOUNDRY_API_TOKEN=${FOUNDRY_API_TOKEN}
FOUNDRY_CORS_ORIGIN=${FOUNDRY_CORS_ORIGIN}
EXE_DEV_TOKEN=${EXE_DEV_TOKEN}
PORT=8000
ENV
chmod 600 "$HOME/foundry-api.env"

sudo tee /etc/systemd/system/foundry-api.service > /dev/null <<UNIT
[Unit]
Description=Foundry apps/api (Fastify + SQLite registry)
After=network.target

[Service]
Type=simple
User=exedev
WorkingDirectory=/home/exedev/foundry
EnvironmentFile=/home/exedev/foundry-api.env
ExecStart=/usr/bin/pnpm --filter @foundry/api dev
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT

sudo systemctl daemon-reload
sudo systemctl enable --now foundry-api
sleep 5
curl -sf --max-time 5 http://localhost:8000/health
echo
echo "=== bootstrap finished $(date -u +%FT%TZ) ==="
