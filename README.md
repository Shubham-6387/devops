# CloneCloud: End-to-End DevSecOps CI/CD Platform Using Kubernetes and Observability

CloneCloud is a modern, cloud-native DevSecOps automation platform built to orchestrate, deploy, secure, and monitor containerized microservices in real-time. This project maps out continuous integration, security scanning, container packaging, Helm-driven Kubernetes deployments, and automated telemetry scraping using Prometheus and Grafana.

---

## 1. System Architecture & Flow

The system flows continuously from a developer pushing code to active Kubernetes workloads monitored by observability scrapers:

```text
Developer ──> GitHub Repo ──> Jenkins Pipeline ──> Docker Build ──> Container Registry
                                                                          │
                                                                          ▼
Prometheus Telemetry <── Grafana Dashboards <── Kubernetes Pods <── Helm Deploy
```

---

## 2. Directory Structure

```text
.
├── backend/                  # Node.js & Express API backend
│   ├── src/
│   │   └── server.js         # REST endpoints & Prometheus metrics exporter
│   ├── Dockerfile            # Multi-stage Node runtime image
│   └── package.json          # Node dependencies (Express, prom-client, mongoose)
│
├── frontend/                 # Vite & React.js UI application
│   ├── src/
│   │   ├── App.jsx           # Task Board, Pipeline visualizer & K8s pod simulator
│   │   ├── index.css         # Premium Glassmorphic neon dark style stylesheet
│   │   └── main.jsx
│   ├── Dockerfile            # Multi-stage static assets Nginx image
│   ├── nginx.conf            # Custom Nginx routes proxy configuration
│   ├── vite.config.js
│   └── package.json
│
├── helm/                     # Kubernetes Orchestration packages
│   └── clonecloud/
│       ├── Chart.yaml        # Helm chart definition
│       ├── values.yaml       # Default deployment parameters (ports, memory, limits)
│       └── templates/        # K8s manifest blueprints (HPA, StatefulSet, Secrets, ConfigMaps)
│
├── monitoring/               # Observability structures
│   ├── prometheus/
│   │   └── prometheus-values.yaml
│   └── grafana/
│       ├── grafana-values.yaml
│       └── dashboards/
│           └── clonecloud-dashboard.json # Grafana visual monitoring JSON
│
└── Jenkinsfile               # Declarative DevSecOps Jenkins pipeline script
```

---

## 3. Quick Start (Local Development)

### Prerequisites
- Node.js (v18 or newer)
- MongoDB instance running locally (port `27017`) or Docker installed.

### 3.1 Start Local MongoDB (Using Docker)
If you don't have MongoDB installed locally, launch it with Docker:
```bash
docker run -d --name clonecloud-mongo -p 27017:27017 mongo:6.0
```

### 3.2 Backend Service Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the Express REST API in development mode:
   ```bash
   npm run dev
   ```
   *The backend will boot on port `5000` (metrics exposed on `http://localhost:5000/metrics` and health on `http://localhost:5000/health`).*

### 3.3 Frontend Service Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Boot up the Vite web server:
   ```bash
   npm run dev
   ```
   *Access the TaskFlow dashboard at `http://localhost:3000`.*

---

## 4. Containerizing Services (Docker)

To manually package the microservices into secure, multi-stage containers:

### Build Images
```bash
# Build Node backend container
docker build -t clonecloud/backend:latest ./backend

# Build Nginx-served static React frontend container
docker build -t clonecloud/frontend:latest ./frontend
```

### Run Containers Manually
```bash
# Start backend container targeting the MongoDB instance
docker run -d --name clonecloud-backend -p 5000:5000 -e MONGO_URI="mongodb://your-ip:27017/clonecloud" clonecloud/backend:latest

# Start frontend container
docker run -d --name clonecloud-frontend -p 3000:80 clonecloud/frontend:latest
```

---

## 5. Kubernetes Deployment (Using Helm)

Make sure you have an active Kubernetes cluster (`minikube`, `k3s`, or `microk8s`) and the `kubectl` and `helm` CLI commands configured.

### 5.1 Manual Deployment Flow
1. Create the dedicated namespace:
   ```bash
   kubectl create namespace clonecloud-main
   ```
2. Install the Helm Chart release:
   ```bash
   helm install clonecloud ./helm/clonecloud -n clonecloud-main
   ```
3. Check deployment status:
   ```bash
   kubectl get all -n clonecloud-main
   ```

### 5.2 Common Troubleshooting: ImagePullBackOff
If you get an `ImagePullBackOff` error on local single-node clusters, import the built images manually into the container runtime.
- **For K3s (containerd):**
  ```bash
  docker save clonecloud/backend:latest | sudo k3s ctr images import -
  docker save clonecloud/frontend:latest | sudo k3s ctr images import -
  ```
- **For Minikube:**
  ```bash
  minikube image load clonecloud/backend:latest
  minikube image load clonecloud/frontend:latest
  ```

---

## 6. Observability (Prometheus & Grafana)

To scrape application statistics and load:

### 6.1 Install Prometheus
```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm install prometheus prometheus-community/prometheus \
    -f ./monitoring/prometheus/prometheus-values.yaml \
    -n clonecloud-main
```

### 6.2 Install Grafana
```bash
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update
helm install grafana grafana/grafana \
    -f ./monitoring/grafana/grafana-values.yaml \
    -n clonecloud-main
```

### 6.3 Import CloneCloud Dashboard
1. Fetch the admin password from Grafana (or default `admin` as configured in `grafana-values.yaml`):
   ```bash
   kubectl get secret --namespace clonecloud-main grafana -o jsonpath="{.data.admin-password}" | base64 --decode
   ```
2. Port-forward Grafana:
   ```bash
   kubectl port-forward service/grafana 3001:80 -n clonecloud-main
   ```
3. Navigate to `http://localhost:3001` and log in with user: `admin`.
4. Create/Import a new dashboard using the JSON model provided in `./monitoring/grafana/dashboards/clonecloud-dashboard.json`.

---

## 7. Self-Healing Demonstration

To verify Kubernetes self-healing reliability:
1. Identify the backend pods:
   ```bash
   kubectl get pods -n clonecloud-main -l component=backend
   ```
2. Delete one of the active backend pods:
   ```bash
   kubectl delete pod <pod-name> -n clonecloud-main
   ```
3. Quickly watch pod status transitions:
   ```bash
   kubectl get pods -n clonecloud-main -l component=backend -w
   ```
   *Kubernetes automatically detects the missing pod count, spins up a new pod in `Pending` state, pulls the container image, checks its readiness status, and adds it back to the active traffic pool without downtime.*
