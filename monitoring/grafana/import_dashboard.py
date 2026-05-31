#!/usr/bin/env python3
import json, urllib.request, urllib.error

GRAFANA_URL = "http://admin:admin@localhost:3001"
DS_UID = "PBFA97CFB590B2093"

dashboard = {
    "id": None,
    "uid": "clonecloud-main",
    "title": "CloneCloud DevSecOps Dashboard",
    "tags": ["clonecloud", "devsecops"],
    "timezone": "browser",
    "schemaVersion": 38,
    "refresh": "5s",
    "panels": [
        {
            "id": 1,
            "type": "timeseries",
            "title": "HTTP Request Rate (req/sec)",
            "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0},
            "datasource": {"type": "prometheus", "uid": DS_UID},
            "targets": [{
                "datasource": {"type": "prometheus", "uid": DS_UID},
                "expr": "sum(rate(http_request_duration_seconds_count[1m]))",
                "legendFormat": "Requests/sec",
                "refId": "A"
            }],
            "options": {"tooltip": {"mode": "single"}},
            "fieldConfig": {
                "defaults": {
                    "color": {"mode": "palette-classic"},
                    "custom": {"lineWidth": 2, "fillOpacity": 10}
                }
            }
        },
        {
            "id": 2,
            "type": "timeseries",
            "title": "API Average Latency (seconds)",
            "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0},
            "datasource": {"type": "prometheus", "uid": DS_UID},
            "targets": [{
                "datasource": {"type": "prometheus", "uid": DS_UID},
                "expr": "sum(rate(http_request_duration_seconds_sum[1m])) / sum(rate(http_request_duration_seconds_count[1m]))",
                "legendFormat": "Avg Latency",
                "refId": "A"
            }],
            "fieldConfig": {
                "defaults": {
                    "color": {"mode": "palette-classic"},
                    "custom": {"lineWidth": 2, "fillOpacity": 10},
                    "unit": "s"
                }
            }
        },
        {
            "id": 3,
            "type": "stat",
            "title": "Total Tasks Created",
            "gridPos": {"h": 4, "w": 6, "x": 0, "y": 8},
            "datasource": {"type": "prometheus", "uid": DS_UID},
            "targets": [{
                "datasource": {"type": "prometheus", "uid": DS_UID},
                "expr": "clonecloud_tasks_created_total",
                "legendFormat": "Tasks Created",
                "refId": "A"
            }],
            "options": {"colorMode": "background", "graphMode": "area", "textMode": "auto"},
            "fieldConfig": {"defaults": {"color": {"mode": "thresholds"},
                "thresholds": {"steps": [{"color": "green", "value": None}]}}}
        },
        {
            "id": 4,
            "type": "stat",
            "title": "Total Tasks Deleted",
            "gridPos": {"h": 4, "w": 6, "x": 6, "y": 8},
            "datasource": {"type": "prometheus", "uid": DS_UID},
            "targets": [{
                "datasource": {"type": "prometheus", "uid": DS_UID},
                "expr": "clonecloud_tasks_deleted_total",
                "legendFormat": "Tasks Deleted",
                "refId": "A"
            }],
            "options": {"colorMode": "background", "graphMode": "area", "textMode": "auto"},
            "fieldConfig": {"defaults": {"color": {"mode": "thresholds"},
                "thresholds": {"steps": [{"color": "red", "value": None}]}}}
        },
        {
            "id": 5,
            "type": "gauge",
            "title": "Active Backend Pods",
            "gridPos": {"h": 4, "w": 6, "x": 12, "y": 8},
            "datasource": {"type": "prometheus", "uid": DS_UID},
            "targets": [{
                "datasource": {"type": "prometheus", "uid": DS_UID},
                "expr": "count(kube_pod_status_ready{namespace=\"clonecloud-main\",condition=\"true\"})",
                "legendFormat": "Running Pods",
                "refId": "A"
            }],
            "options": {"reduceOptions": {"calcs": ["lastNotNull"]}, "showThresholdLabels": False, "showThresholdMarkers": True},
            "fieldConfig": {"defaults": {"min": 0, "max": 10,
                "thresholds": {"steps": [{"color": "red", "value": 0}, {"color": "yellow", "value": 3}, {"color": "green", "value": 5}]}}}
        },
        {
            "id": 6,
            "type": "timeseries",
            "title": "Node CPU Usage",
            "gridPos": {"h": 8, "w": 12, "x": 0, "y": 12},
            "datasource": {"type": "prometheus", "uid": DS_UID},
            "targets": [{
                "datasource": {"type": "prometheus", "uid": DS_UID},
                "expr": "100 - (avg by(instance) (rate(node_cpu_seconds_total{mode=\"idle\"}[1m])) * 100)",
                "legendFormat": "CPU %",
                "refId": "A"
            }],
            "fieldConfig": {
                "defaults": {
                    "unit": "percent",
                    "min": 0, "max": 100,
                    "color": {"mode": "palette-classic"},
                    "custom": {"lineWidth": 2, "fillOpacity": 10}
                }
            }
        },
        {
            "id": 7,
            "type": "timeseries",
            "title": "Node Memory Usage",
            "gridPos": {"h": 8, "w": 12, "x": 12, "y": 12},
            "datasource": {"type": "prometheus", "uid": DS_UID},
            "targets": [{
                "datasource": {"type": "prometheus", "uid": DS_UID},
                "expr": "(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100",
                "legendFormat": "Memory %",
                "refId": "A"
            }],
            "fieldConfig": {
                "defaults": {
                    "unit": "percent",
                    "min": 0, "max": 100,
                    "color": {"mode": "palette-classic"},
                    "custom": {"lineWidth": 2, "fillOpacity": 10}
                }
            }
        }
    ],
    "time": {"from": "now-15m", "to": "now"}
}

payload = json.dumps({
    "dashboard": dashboard,
    "overwrite": True,
    "folderId": 0,
    "message": "Imported by CloneCloud automation"
}).encode("utf-8")

req = urllib.request.Request(
    "http://localhost:3001/api/dashboards/db",
    data=payload,
    headers={
        "Content-Type": "application/json",
        "Authorization": "Basic YWRtaW46YWRtaW4="  # admin:admin base64
    },
    method="POST"
)
try:
    with urllib.request.urlopen(req) as resp:
        result = json.loads(resp.read())
        print(f"Dashboard imported successfully!")
        print(f"URL: http://localhost:3001{result.get('url', '')}")
except urllib.error.HTTPError as e:
    body = e.read().decode()
    print(f"Error {e.code}: {body}")
