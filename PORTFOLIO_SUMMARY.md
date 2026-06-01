# 🌐 CloneCloud: Enterprise DevSecOps Platform & PowerHub Architecture

**CloneCloud** is an advanced, end-to-end cloud-native DevSecOps automation platform built to orchestrate, secure, deploy, and monitor complex microservices. At its core, the platform governs the lifecycle of **PowerHub**, a highly dynamic full-stack fitness and health tracking application.

This repository serves as a comprehensive demonstration of modern DevSecOps practices, Site Reliability Engineering (SRE), continuous integration, and Kubernetes orchestration.

---

## 🏗️ 1. Architecture Overview

The system operates across three primary planes:
1. **The Control Plane (CloneCloud Dashboard):** A custom-built DevSecOps React dashboard that acts as the nerve center for visualizing CI/CD pipelines, cluster health, security scans, and simulated outages.
2. **The Automation Plane (Jenkins & Trivy):** A robust declarative Jenkins pipeline that handles code checkout, dependency installation, static vulnerability analysis, containerization, and automated Helm deployment.
3. **The Workload Plane (PowerHub):** The core application running inside a local Kubernetes (Kind) cluster, relying on MongoDB for persistent state.

---

## ⚙️ 2. DevSecOps CI/CD Pipeline Breakdown

The automation is defined by a declarative **Jenkinsfile** featuring an 8-stage robust deployment pipeline:

*   **Stage 1 - Source Checkout:** Clones the PowerHub repository and injects production environment overrides (such as rewriting Vite API URLs for production routing).
*   **Stage 2 - Dependency Install & Build:** Executes parallel builds for both the Node.js backend and the React frontend.
*   **Stage 3 - Security Scanning:** Integrates **Trivy** for exhaustive vulnerability scanning. Performs `npm audit` across all layers and executes Trivy filesystem scans to catch Critical and High CVEs before building images.
*   **Stage 4 - Docker Build:** Packages the verified source code into highly optimized, multi-stage Docker images (`powerhub/backend` and `powerhub/frontend`).
*   **Stage 5 - Kind Cluster Load:** Automatically provisions a local `Kind` Kubernetes cluster (if none exists) and loads the built Docker images directly into the cluster nodes to bypass external registry latency.
*   **Stage 6 - Helm Deploy:** Dynamically creates the `clonecloud-main` namespace and uses `helm upgrade --install` to deploy the application via custom Helm charts.
*   **Stage 7 - Verification:** Monitors Kubernetes `rollout status` and executes pod health checks to guarantee zero-downtime deployments.
*   **Stage 8 - Notification:** Outputs deployment endpoints, port-forwarding instructions, and live telemetry links.

---

## 🩺 3. Kubernetes Orchestration & Self-Healing SRE

CloneCloud heavily leverages Kubernetes for robust orchestration and self-healing:

*   **Helm Blueprints:** The infrastructure is codified using Helm charts (`helm/clonecloud`). It defines:
    *   **Deployments & Services** for the React frontend and Node.js backend.
    *   **StatefulSets** with PersistentVolumeClaims (PVCs) for the MongoDB database, ensuring data durability.
    *   **Horizontal Pod Autoscalers (HPA)** to dynamically scale replicas based on CPU load.
*   **Crash Simulation Lab:** The CloneCloud dashboard features a built-in testing lab where engineers can manually trigger controlled crashes (`docker stop`) on frontend, backend, or database containers. 
*   **Auto-Recovery Watchdog:** Upon detecting a crash, the platform visually demonstrates Kubernetes' reconciliation loops. It tracks the outage, restarts the failed pod, verifies database connection hooks, and runs HTTP status probes until the service is restored to a `HEALTHY` state.

---

## 🏋️ 4. The PowerHub Workload

PowerHub is the primary microservices application managed by CloneCloud—a fully-featured fitness, diet, and health tracking platform.

*   **Backend (Node.js/Express):** Exposes RESTful APIs with advanced data models. 
    *   **Models Included:** `DietHistory`, `WorkoutRoutine`, `Exercise`, `FoodScan`, `UserWorkoutProfile`, `HealthScoreLog`, `ProgressLog`, and `Task`.
    *   **External APIs:** Integrates with the OpenFoodFacts API (`https://world.openfoodfacts.org`) for real-time nutritional scanning.
*   **Frontend (React/Vite):** An optimized Single Page Application (SPA) served via a high-performance **Nginx** reverse proxy container.
*   **Database:** A MongoDB instance managed via Kubernetes StatefulSets and secured with Kubernetes Secrets.

---

## 📊 5. Observability & Telemetry

Observability is a first-class citizen in the CloneCloud ecosystem.

*   **Prometheus:** Deployed via Helm to scrape application statistics directly from the Express backend's `/metrics` endpoints.
*   **Grafana:** Visualizes the telemetry data using custom-built JSON dashboards (`clonecloud-dashboard.json`).
*   **Real-Time Dashboard Metrics:** The custom CloneCloud React UI pulls this telemetry data to display live CPU usage, Memory limits, HTTP Request rates, and active Pod counts.
*   **NS-3 FlowMonitor Integration:** Further extends the project's analytical capabilities by integrating with **NS-3 simulation scripts** to monitor low-level network Quality of Service (QoS) parameters—specifically tracking throughput, delay, jitter, and packet loss rates.

---

## 🎨 6. CloneCloud UI Command Center

The control plane is an aesthetically premium, glassmorphic React dashboard featuring:
*   **Pipeline Status:** Real-time visibility into Jenkins build stages and compilation logs.
*   **Kubernetes Explorer:** Live tracking of Kubernetes ReplicaSets, namespace resource allocations, and pod health statuses.
*   **Security Suite:** Summarizes the Trivy and npm audit results, categorizing vulnerabilities by severity (Critical, High, Medium).

---

## 💻 7. Technology Stack Summary

| Layer | Technologies |
| :--- | :--- |
| **Container Orchestration** | Kubernetes, Helm, Kind, Docker |
| **CI/CD Automation** | Jenkins (Declarative Pipelines) |
| **Security & Compliance** | Trivy Vulnerability Scanner |
| **Observability & Analytics** | Prometheus, Grafana, NS-3 FlowMonitor |
| **Frontend Ecosystem** | React.js, Vite, Nginx, Vanilla CSS (Glassmorphism UI) |
| **Backend & APIs** | Node.js, Express.js |
| **Database** | MongoDB (StatefulSets) |

---

> **Note on Portfolio Usage:** This project highlights a deep understanding of full-lifecycle software engineering, shifting security to the left, guaranteeing high availability via Kubernetes, and delivering profound insights through unified observability.

---

## 🔐 8. Jenkins Access & Credentials (Demo Environment)

> **For Reviewer / Evaluator Use Only**

### 🌐 Jenkins Dashboard URL
```
http://localhost:8080
```
> If running on a remote VM, replace `localhost` with the server's IP address (e.g. `http://<your-ip>:8080`).

### 🔑 Login Credentials
| Field    | Value     |
|:---------|:----------|
| Username | `admin`   |
| Password | `admin`   |

> **First-time setup:** If Jenkins prompts for an initial admin password, run:
> ```bash
> sudo cat /var/lib/jenkins/secrets/initialAdminPassword
> ```

---

## 🎬 9. Live Pipeline Demo — What to Show the Reviewer

When a reviewer asks **"show me the pipeline"**, follow these steps:

### Step 1 — Open Jenkins
- Navigate to `http://localhost:8080`
- Login with `admin` / `admin`

### Step 2 — Find the Pipeline Job
- On the Jenkins dashboard, click the pipeline named **`CloneCloud-PowerHub-Pipeline`** (or the job you created from the Jenkinsfile).
- Click **"Build Now"** on the left sidebar to trigger a fresh run.

### Step 3 — Walk Through the 8 Stages (Live Console)
Click the **running build number** → then click **"Console Output"** to show logs. Narrate each stage:

| Stage | What it Does | What to Say |
|:------|:-------------|:------------|
| **Stage 1 — Checkout** | Clones PowerHub from GitHub, injects prod env vars | *"We pull the latest source and override API URLs for production routing."* |
| **Stage 2 — Build** | Runs `npm ci` for backend & frontend in parallel | *"Parallel builds for both Node.js backend and React frontend — saves time."* |
| **Stage 3 — Security Scan** | Runs `npm audit` + Trivy for HIGH/CRITICAL CVEs | *"This is our 'shift-left' security step — we catch vulnerabilities before building any image."* |
| **Stage 4 — Docker Build** | Builds `powerhub/backend:latest` and `powerhub/frontend:latest` | *"Multi-stage Dockerfiles keep images lean and production-ready."* |
| **Stage 5 — Kind Load** | Loads images directly into the local Kind Kubernetes cluster | *"No external registry needed — we inject images straight into the cluster nodes."* |
| **Stage 6 — Helm Deploy** | `helm upgrade --install` into `clonecloud-main` namespace | *"Infrastructure-as-code using Helm charts — idempotent, repeatable deployments."* |
| **Stage 7 — Verification** | `kubectl rollout status` + pod health checks | *"Zero-downtime verification — we don't mark success until pods are provably healthy."* |
| **Stage 8 — Summary** | Prints live endpoints for frontend, backend, Prometheus, Grafana | *"The pipeline outputs actionable URLs so the team knows exactly where to go."* |

### Step 4 — Show the Security Report Artifact
- After the build, go to the **build page → "Build Artifacts"**
- Open `security-report.txt` — shows npm audit + Trivy CVE results.

### Step 5 — Show Kubernetes State (bonus points)
Open a terminal alongside and run:
```bash
kubectl get all -n clonecloud-main
kubectl get pods -n clonecloud-main -o wide
```
This proves the pipeline actually deployed to Kubernetes — not just a simulation.

### Step 6 — Show the CloneCloud Dashboard
- Open `http://localhost:5173` (CloneCloud React UI)
- Navigate to **"CI/CD Pipeline"** tab — shows real-time stage status
- Navigate to **"Kubernetes"** tab — shows live pod/replica counts
- Navigate to **"Security Suite"** — shows Trivy scan summary

---

> 💡 **Tip:** If the reviewer asks *"what happens when a service crashes?"*, go to the **"Crash Lab"** tab in the CloneCloud UI, crash a service, and show the auto-recovery watchdog restoring it to `HEALTHY` status.
