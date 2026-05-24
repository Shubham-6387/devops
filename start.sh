#!/usr/bin/env bash
# =============================================================================
#  CloneCloud DevSecOps Platform — Master Startup Script
#  Starts the full stack: Docker services, Kind Kubernetes cluster,
#  Prometheus, Grafana, Jenkins, and opens all port-forwards.
# =============================================================================

set -e
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log()    { echo -e "${CYAN}[CloneCloud]${NC} $1"; }
success(){ echo -e "${GREEN}[✓]${NC} $1"; }
warn()   { echo -e "${YELLOW}[!]${NC} $1"; }
error()  { echo -e "${RED}[✗]${NC} $1"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║       CloneCloud DevSecOps Platform Startup          ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# ─────────────────────────────────────────────────
# STEP 1 — Start Docker Compose Services
# ─────────────────────────────────────────────────
log "Step 1/6 — Starting Docker Compose services (Frontend, Backend, MongoDB, Jenkins)..."

# Jenkins
if ! docker ps --format '{{.Names}}' | grep -q "clonecloud-jenkins"; then
    log "  Starting Jenkins container..."
    docker run -d --name clonecloud-jenkins \
        -p 8080:8080 -p 50000:50000 \
        jenkins/jenkins:lts > /dev/null 2>&1
    success "Jenkins started."
else
    success "Jenkins already running."
fi

# App stack
docker compose up --build -d
success "Docker Compose stack (frontend, backend, mongodb) is up."

# ─────────────────────────────────────────────────
# STEP 2 — Start Kind Kubernetes Cluster
# ─────────────────────────────────────────────────
log "Step 2/6 — Checking Kubernetes (Kind) cluster..."

if kind get clusters 2>/dev/null | grep -q "clonecloud"; then
    success "Kind cluster 'clonecloud' already running."
else
    log "  Creating Kind cluster 'clonecloud'..."
    kind create cluster --config kind-config.yaml
    success "Kind cluster created."
fi

# ─────────────────────────────────────────────────
# STEP 3 — Load Docker images into Kind
# ─────────────────────────────────────────────────
log "Step 3/6 — Loading Docker images into Kind cluster..."
docker tag devopsproject-backend:latest clonecloud/backend:latest 2>/dev/null || true
docker tag devopsproject-frontend:latest clonecloud/frontend:latest 2>/dev/null || true
kind load docker-image clonecloud/backend:latest --name clonecloud
kind load docker-image clonecloud/frontend:latest --name clonecloud
success "Images loaded into Kind cluster."

# ─────────────────────────────────────────────────
# STEP 4 — Deploy Helm Chart to Kubernetes
# ─────────────────────────────────────────────────
log "Step 4/6 — Deploying CloneCloud Helm chart to Kubernetes..."

kubectl create namespace clonecloud-main --dry-run=client -o yaml | kubectl apply -f - > /dev/null

if helm status clonecloud -n clonecloud-main > /dev/null 2>&1; then
    log "  Upgrading existing Helm release..."
    helm upgrade clonecloud ./helm/clonecloud -n clonecloud-main > /dev/null
    success "Helm release upgraded."
else
    log "  Installing Helm release..."
    helm install clonecloud ./helm/clonecloud -n clonecloud-main > /dev/null
    success "Helm release installed."
fi

# ─────────────────────────────────────────────────
# STEP 5 — Deploy Prometheus & Grafana
# ─────────────────────────────────────────────────
log "Step 5/6 — Setting up Prometheus and Grafana..."

helm repo add prometheus-community https://prometheus-community.github.io/helm-charts > /dev/null 2>&1 || true
helm repo add grafana https://grafana.github.io/helm-charts > /dev/null 2>&1 || true
helm repo update > /dev/null 2>&1

if ! helm status prometheus -n clonecloud-main > /dev/null 2>&1; then
    log "  Installing Prometheus..."
    helm install prometheus prometheus-community/prometheus \
        -n clonecloud-main \
        -f ./monitoring/prometheus/prometheus-values.yaml > /dev/null
    success "Prometheus installed."
else
    success "Prometheus already deployed."
fi

if ! helm status grafana -n clonecloud-main > /dev/null 2>&1; then
    log "  Installing Grafana..."
    helm install grafana grafana/grafana \
        -n clonecloud-main \
        -f ./monitoring/grafana/grafana-values.yaml > /dev/null
    success "Grafana installed."
else
    success "Grafana already deployed."
fi

# ─────────────────────────────────────────────────
# STEP 6 — Wait for pods and start Port-forwards
# ─────────────────────────────────────────────────
log "Step 6/6 — Waiting for all pods to become Ready..."

kubectl wait --for=condition=ready pod \
    -l "app=clonecloud" -n clonecloud-main \
    --timeout=120s > /dev/null 2>&1 && success "CloneCloud app pods ready." || warn "Some pods still starting."

kubectl wait --for=condition=ready pod \
    -l "app.kubernetes.io/name=prometheus" -n clonecloud-main \
    --timeout=120s > /dev/null 2>&1 && success "Prometheus pods ready." || warn "Prometheus still starting."

kubectl wait --for=condition=ready pod \
    -l "app.kubernetes.io/name=grafana" -n clonecloud-main \
    --timeout=120s > /dev/null 2>&1 && success "Grafana pods ready." || warn "Grafana still starting."

# Kill any stale port-forwards
pkill -f "kubectl port-forward" 2>/dev/null || true
sleep 1

log "Starting port-forwards in background..."
kubectl port-forward svc/prometheus-server 9090:9090 -n clonecloud-main > /dev/null 2>&1 &
kubectl port-forward svc/grafana 3001:80 -n clonecloud-main > /dev/null 2>&1 &
sleep 3

# Auto-import Grafana dashboard
log "Importing CloneCloud dashboard into Grafana..."
python3 monitoring/grafana/import_dashboard.py > /dev/null 2>&1 && \
    success "Grafana dashboard imported." || warn "Grafana dashboard import failed (will retry manually)."

# ─────────────────────────────────────────────────
# DONE — Print Access Table
# ─────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              🚀 CloneCloud is Fully Running!                     ║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║${NC}  Service          URL                         Credentials         ${GREEN}║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║${NC}  Frontend App     http://localhost:3000         —                  ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  Frontend (K8s)   http://localhost:30080         —                  ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  Backend API      http://localhost:5000/health   —                  ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  Jenkins          http://localhost:8080          admin/see logs     ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  Prometheus       http://localhost:9090          —                  ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  Grafana          http://localhost:3001          admin / admin      ${GREEN}║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║${NC}  Grafana Dashboard:                                               ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  http://localhost:3001/d/clonecloud-main/clonecloud-devsecops-dashboard  ${GREEN}║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Print Jenkins password
log "Fetching Jenkins admin password..."
JENKINS_PASS=$(docker exec clonecloud-jenkins cat /var/jenkins_home/secrets/initialAdminPassword 2>/dev/null || echo "Check: docker logs clonecloud-jenkins")
echo -e "${YELLOW}Jenkins Initial Admin Password:${NC} $JENKINS_PASS"
echo ""
