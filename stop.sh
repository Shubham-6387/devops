#!/usr/bin/env bash
# =============================================================================
#  CloneCloud DevSecOps Platform — Teardown Script
#  Stops all services cleanly.
# =============================================================================
CYAN='\033[0;36m'; GREEN='\033[0;32m'; NC='\033[0m'
log(){ echo -e "${CYAN}[CloneCloud]${NC} $1"; }

echo -e "${CYAN}Stopping CloneCloud DevSecOps Platform...${NC}"

log "Killing port-forwards..."
pkill -f "kubectl port-forward" 2>/dev/null || true

log "Stopping Docker Compose stack..."
docker compose down 2>/dev/null || true

log "Stopping Jenkins container..."
docker rm -f clonecloud-jenkins 2>/dev/null || true

log "Deleting Kind Kubernetes cluster..."
kind delete cluster --name clonecloud 2>/dev/null || true

echo -e "${GREEN}[✓] CloneCloud fully stopped.${NC}"
