# CloneCloud DevSecOps Platform & PowerHub Integration

**CloneCloud** is a comprehensive, cloud-native DevSecOps automation platform built to orchestrate, deploy, secure, and monitor containerized microservices. At its core, the platform oversees **PowerHub**, a full-stack microservices application, managing its entire lifecycle from code commit to high-availability deployment.

This project demonstrates advanced expertise in cloud-native infrastructure, CI/CD automation, Kubernetes orchestration, and real-time observability.

---

## 🎯 Project Overview

The architecture flows continuously from a developer pushing code, through a robust security and integration pipeline, straight to active Kubernetes workloads monitored by dedicated telemetry scrapers. A custom real-time dashboard acts as the central control plane, giving full visibility into build statuses, cluster health, and vulnerability reports.

## ✨ Key Features & Capabilities

### 1. Automated DevSecOps CI/CD Pipeline
- **Continuous Integration**: Powered by a declarative **Jenkins** pipeline that automates the build and deployment workflow.
- **Security First**: Integrates **Trivy** to execute static vulnerability analysis on container builds. It generates detailed reports on library-level CVE findings, vulnerability severities, and software bill of materials (SBOM) before deployment.
- **Containerization & Deployment**: Automatically packages applications into multi-stage Docker images and deploys them to local Kubernetes clusters using **Helm** charts.

### 2. High-Availability Kubernetes Orchestration
- **Helm-Driven**: Utilizes custom Helm charts to blueprint deployments, services, Horizontal Pod Autoscalers (HPA), and MongoDB StatefulSets.
- **Automated Self-Healing**: Leverages Kubernetes' native reconciliation loops. The project includes a **Crash Simulation Lab** where services can be purposefully degraded to demonstrate the platform detecting failures and instantly respawning containers with zero overall downtime.

### 3. Real-Time Observability & Telemetry
- **Prometheus & Grafana Stack**: Automatically scrapes application statistics, CPU/Memory load, HTTP request rates, and pod counts.
- **NS-3 QoS Integration**: Integrates NS-3 FlowMonitor to parse and evaluate critical Quality of Service (QoS) parameters—including throughput, delay, jitter, and packet loss—to ensure network stability.

### 4. CloneCloud Control Dashboard
A visually stunning, glassmorphic **React** dashboard that serves as the command center for the DevSecOps engineer. It features:
- **Live Pipeline Visualizer**: Tracks Jenkins build stages and live compilation logs.
- **Kubernetes Explorer**: Displays active pods, replica sets, memory requests, and CPU allocations.
- **Crash Simulation & Recovery Console**: A hands-on interface to manually trigger service crashes and watch the auto-recovery watchdog restore the system.
- **Security Suite**: Displays Trivy vulnerability scanning metrics (Critical/High/Medium alerts).

### 5. PowerHub Microservices Workload
The primary application managed by the platform. PowerHub is a fully-featured fitness and health tracking application consisting of:
- **Backend API**: Node.js and Express REST endpoints connected to a MongoDB database.
- **Frontend App**: Built with React and Vite, served via an Nginx container.

---

## 🛠️ Technology Stack

| Category | Technologies |
| :--- | :--- |
| **Infrastructure & Orchestration** | Docker, Kubernetes, Helm, Kind |
| **CI/CD & Security** | Jenkins, Trivy Scanner |
| **Observability & Networking** | Prometheus, Grafana, NS-3 FlowMonitor |
| **Frontend Applications** | React.js, Vite, Vanilla CSS, Lucide React |
| **Backend & Databases** | Node.js, Express.js, MongoDB |

---

## 🚀 System Architecture Flow

```text
Developer ──> GitHub Repo ──> Jenkins Pipeline ──> Trivy Security Scan ──> Docker Build 
                                                                               │
                                                                               ▼
Prometheus Telemetry <── Grafana Dashboards <── Kubernetes Pods <── Helm Chart Deployment
```

## 💡 Impact & Portfolio Highlights
- Designed an end-to-end cloud-native architecture demonstrating the entire software delivery lifecycle.
- Built custom observability dashboards and integrated real-time self-healing workflows, showcasing a strong understanding of site reliability engineering (SRE) principles.
- Addressed security directly within the CI/CD pipeline, ensuring compliance and vulnerability mitigation before reaching production.
