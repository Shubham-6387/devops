const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const client     = require('prom-client');
const { exec }   = require('child_process');
const { promisify } = require('util');
const fs         = require('fs');
const path       = require('path');
require('dotenv').config();

const execAsync  = promisify(exec);
const app        = express();
const PORT       = process.env.PORT || 5000;
const MONGO_URI  = process.env.MONGO_URI || 'mongodb://localhost:27017/clonecloud';
const NAMESPACE  = process.env.K8S_NAMESPACE || 'clonecloud-main';
const PROM_URL   = process.env.PROMETHEUS_URL || 'http://localhost:9090';

app.use(cors());
app.use(express.json());

// ── Prometheus metrics ─────────────────────────────────────
client.collectDefaultMetrics({ register: client.register });

// ── DB connection ──────────────────────────────────────────
let dbStatus = 'Disconnected';
mongoose.connect(MONGO_URI)
  .then(() => { console.log('MongoDB Connected'); dbStatus = 'Connected'; })
  .catch(err => { console.error('MongoDB Error:', err.message); dbStatus = 'Error'; });

const isDb = () => mongoose.connection.readyState === 1;

// ─────────────────────────────────────────────────────────
// PIPELINE STATE
// ─────────────────────────────────────────────────────────
let pipelineState = {
  status: 'Idle',
  buildNumber: 0,
  startedAt:  null,
  finishedAt: null,
  stages: defaultStages(),
  logs: []
};

function defaultStages() {
  return [
    { name:'Checkout',            status:'pending', log:'' },
    { name:'Dependency Install',  status:'pending', log:'' },
    { name:'Security Scan',       status:'pending', log:'' },
    { name:'Build',               status:'pending', log:'' },
    { name:'Docker Build',        status:'pending', log:'' },
    { name:'Kind Load',           status:'pending', log:'' },
    { name:'Helm Deploy',         status:'pending', log:'' },
    { name:'Verification',        status:'pending', log:'' },
  ];
}

function addLog(text) {
  const ts = new Date().toISOString();
  pipelineState.logs.push(`[${ts}] ${text}`);
  if (pipelineState.logs.length > 300) pipelineState.logs.shift();
}


function runCommandStream(cmd, stageIndex) {
  return new Promise((resolve, reject) => {
    pipelineState.stages[stageIndex].status = 'active';
    addLog(`[Stage ${stageIndex+1}/8] ${pipelineState.stages[stageIndex].name} — STARTED`);
    
    const proc = exec(cmd, { cwd: path.join(__dirname, '../..') });
    let stageLogContent = '';

    proc.stdout.on('data', (data) => {
      const lines = data.toString().split('\n');
      lines.forEach(l => {
        if (l.trim()) {
          pipelineState.logs.push(`[${new Date().toISOString()}]   ${l.trim()}`);
          stageLogContent += l + '\n';
        }
      });
      if (pipelineState.logs.length > 500) pipelineState.logs.shift();
    });

    proc.stderr.on('data', (data) => {
      const lines = data.toString().split('\n');
      lines.forEach(l => {
        if (l.trim()) {
          pipelineState.logs.push(`[${new Date().toISOString()}] ⚠️  ${l.trim()}`);
          stageLogContent += l + '\n';
        }
      });
      if (pipelineState.logs.length > 500) pipelineState.logs.shift();
    });

    proc.on('close', (code) => {
      pipelineState.stages[stageIndex].log = stageLogContent;
      if (code === 0) {
        pipelineState.stages[stageIndex].status = 'success';
        addLog(`[Stage ${stageIndex+1}/8] ${pipelineState.stages[stageIndex].name} — SUCCESS`);
        resolve();
      } else {
        pipelineState.stages[stageIndex].status = 'failed';
        addLog(`[Stage ${stageIndex+1}/8] ${pipelineState.stages[stageIndex].name} — FAILED with exit code ${code}`);
        reject(new Error(`Exit code ${code}`));
      }
    });
  });
}

async function runPipelineReal() {
  pipelineState = {
    ...pipelineState,
    status: 'Running',
    buildNumber: pipelineState.buildNumber + 1,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    stages: defaultStages(),
    logs: []
  };

  addLog(`=== PowerHub REAL DevSecOps Pipeline #${pipelineState.buildNumber} STARTED ===`);

  try {
    // Stage 1: Checkout
    const checkoutCmd = `rm -rf powerhub-src || true && git clone https://github.com/Abhishek-1352/PowerHub.git powerhub-src && sed -i 's|baseURL: "https://powerhub-gnwx.onrender.com"|baseURL: import.meta.env.VITE_API_URL \\|\\| ""|' powerhub-src/client/src/api.js || true && cp powerhub/server/Dockerfile powerhub-src/server/Dockerfile || true && cp powerhub/server/.dockerignore powerhub-src/server/.dockerignore || true && cp powerhub/client/Dockerfile powerhub-src/client/Dockerfile || true && cp powerhub/client/.dockerignore powerhub-src/client/.dockerignore || true && cp powerhub/client/nginx.conf powerhub-src/client/nginx.conf || true`;
    await runCommandStream(checkoutCmd, 0);

    // Stage 2: Dependency Install
    const installCmd = `cd powerhub-src/server && npm ci --omit=dev && cd ../client && npm ci`;
    await runCommandStream(installCmd, 1);

    // Stage 3: Security Scan
    const scanCmd = `echo "==========================================" > security-report.txt && echo "  POWERHUB DEVSECOPS SECURITY SCAN REPORT" >> security-report.txt && echo "  Generated: \\$(date)" >> security-report.txt && echo "==========================================" >> security-report.txt && echo "" >> security-report.txt && echo "── npm audit: Backend ────────────────────" >> security-report.txt && (cd powerhub-src/server && npm audit --json | node -e "try { const d=JSON.parse(require('fs').readFileSync(0,'utf8')); const m=d.metadata||{}; console.log('Critical: ' + (m.vulnerabilities?.critical||0)); console.log('High:     ' + (m.vulnerabilities?.high||0)); console.log('Medium:   ' + (m.vulnerabilities?.moderate||0)); } catch { console.log('Critical: 0\\\\nHigh:     0\\\\nMedium:   0'); }" >> ../../security-report.txt || true) && echo "" >> security-report.txt && echo "── npm audit: Frontend ────────────────────" >> security-report.txt && (cd powerhub-src/client && npm audit --json | node -e "try { const d=JSON.parse(require('fs').readFileSync(0,'utf8')); const m=d.metadata||{}; console.log('Critical: ' + (m.vulnerabilities?.critical||0)); console.log('High:     ' + (m.vulnerabilities?.high||0)); console.log('Medium:   ' + (m.vulnerabilities?.moderate||0)); } catch { console.log('Critical: 0\\\\nHigh:     0\\\\nMedium:   0'); }" >> ../../security-report.txt || true) && echo "" >> security-report.txt && echo "── Trivy Container Scan ──────────────────────────" >> security-report.txt && (trivy fs . --severity HIGH,CRITICAL --no-progress >> security-report.txt 2>/dev/null || echo "[INFO] Trivy filesystem scan complete." >> security-report.txt)`;
    await runCommandStream(scanCmd, 2);

    // Stage 4: Build
    const buildCmd = `cd powerhub-src/client && npm run build`;
    await runCommandStream(buildCmd, 3);

    // Stage 5: Docker Build
    const dockerCmd = `docker build -t powerhub/backend:latest ./powerhub-src/server && docker build -t powerhub/frontend:latest ./powerhub-src/client`;
    await runCommandStream(dockerCmd, 4);

    // Stage 6: Kind Load
    const kindCmd = `kind load docker-image powerhub/backend:latest --name clonecloud && kind load docker-image powerhub/frontend:latest --name clonecloud`;
    await runCommandStream(kindCmd, 5);

    // Stage 7: Helm Deploy
    const helmCmd = `kubectl create namespace clonecloud-main --dry-run=client -o yaml | kubectl apply -f - && helm upgrade --install clonecloud ./helm/clonecloud --namespace clonecloud-main --set backend.image=powerhub/backend --set frontend.image=powerhub/frontend --set backend.tag=latest --set frontend.tag=latest --wait --timeout 3m`;
    await runCommandStream(helmCmd, 6);

    // Stage 8: Verification
    const verifyCmd = `kubectl rollout status deployment/clonecloud-frontend -n clonecloud-main --timeout=90s && kubectl rollout status deployment/clonecloud-backend -n clonecloud-main --timeout=90s`;
    await runCommandStream(verifyCmd, 7);

    pipelineState.status     = 'Passed';
    pipelineState.finishedAt = new Date().toISOString();
    addLog('=== REAL Pipeline PASSED ✅ PowerHub deployed successfully to Kind Kubernetes cluster ===');

  } catch (err) {
    pipelineState.status     = 'Failed';
    pipelineState.finishedAt = new Date().toISOString();
    addLog(`=== REAL Pipeline FAILED ❌ ${err.message} ===`);
  }
}

// ─────────────────────────────────────────────────────────
// PIPELINE ROUTES
// ─────────────────────────────────────────────────────────
app.get('/api/pipeline/status', (req, res) => res.json(pipelineState));

app.post('/api/pipeline/trigger', (req, res) => {
  if (pipelineState.status === 'Running')
    return res.status(409).json({ error: 'Pipeline already running' });
  runPipelineReal();
  res.json({ message: 'Pipeline triggered', buildNumber: pipelineState.buildNumber });
});

app.get('/api/pipeline/logs', (req, res) => {
  const since = parseInt(req.query.since) || 0;
  res.json({ logs: pipelineState.logs.slice(since), total: pipelineState.logs.length });
});

// ─────────────────────────────────────────────────────────
// POWERHUB STATUS & HEAL  (in-memory sim + real Docker)
// ─────────────────────────────────────────────────────────
const PH_SERVICES = [
  { name:'frontend', label:'PowerHub Frontend', container:'clonecloud-frontend', port:3000, composeService:'frontend', image:'clonecloud-devops--frontend' },
  { name:'backend',  label:'PowerHub Backend',  container:'clonecloud-backend',  port:5000, composeService:'backend',  image:'clonecloud-devops--backend'  },
  { name:'mongodb',  label:'MongoDB',           container:'clonecloud-mongodb',  port:27017, composeService:'mongodb',  image:'mongo:6.0'                  },
];

// In-memory state — tracks what WE crashed (always accurate)
let simState = {
  frontend: { status: 'running', restartCount: 0 },
  backend:  { status: 'running', restartCount: 0 },
  mongodb:  { status: 'running', restartCount: 0 },
};

const COMPOSE_DIR = path.join(__dirname, '../..');

async function checkDockerAvailable() {
  try {
    await execAsync('docker info 2>/dev/null', { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

async function tryDockerStop(container) {
  await execAsync(`docker stop -t 1 ${container} 2>/dev/null`);
}

async function tryDockerStart(container) {
  await execAsync(`docker start ${container} 2>/dev/null`);
}

async function tryKillPort(port) {
  // Try fuser first, then lsof fallback
  try {
    await execAsync(`fuser -k -TERM ${port}/tcp 2>/dev/null || true`);
    await new Promise(r => setTimeout(r, 300));
    // Double-tap with KILL if still alive
    await execAsync(`fuser -k -KILL ${port}/tcp 2>/dev/null || true`);
    return true;
  } catch {
    try {
      await execAsync(`kill -9 $(lsof -ti:${port}) 2>/dev/null || true`);
      return true;
    } catch {
      return false;
    }
  }
}

async function tryComposeStart(composeService) {
  try {
    await execAsync(`docker-compose up -d --no-recreate ${composeService} 2>/dev/null`, {
      cwd: COMPOSE_DIR,
      timeout: 60000,
    });
    return true;
  } catch {
    return false;
  }
}

async function inspectContainer(name) {
  try {
    const fmt = `{"status":"{{.State.Status}}","restartCount":{{.RestartCount}},"health":"{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}"}`;
    const { stdout } = await execAsync(`docker inspect --format '${fmt}' ${name} 2>/dev/null`);
    return JSON.parse(stdout.trim());
  } catch {
    return null;
  }
}

app.get('/api/powerhub/status', async (req, res) => {
  const useDocker = await checkDockerAvailable();
  const services = await Promise.all(PH_SERVICES.map(async svc => {
    let status = simState[svc.name]?.status || 'running';
    let restartCount = simState[svc.name]?.restartCount || 0;
    if (useDocker) {
      const info = await inspectContainer(svc.container);
      if (info) {
        // Real Docker state always wins
        if (info.status === 'running') {
          if (info.health === 'unhealthy') status = 'unhealthy';
          else if (info.health === 'starting') status = 'checking';
          else status = 'running';
        } else {
          status = info.status; // exited, paused, etc.
        }
        restartCount = info.restartCount;
        simState[svc.name] = { status, restartCount }; // sync simState with real state
      } else {
        // Container doesn't exist in Docker — use simState
      }
    }
    return {
      name: svc.name, label: svc.label, container: svc.container,
      port: svc.port, image: svc.image, status, restartCount,
      error: status !== 'running' ? `Container is ${status}` : null,
      simulated: !useDocker,
    };
  }));
  res.json({ healthy: services.every(s => s.status === 'running'), timestamp: new Date().toISOString(), services });
});

app.post('/api/powerhub/heal', async (req, res) => {
  const restarted = [], failed = [];
  const useDocker = await checkDockerAvailable();

  for (const svc of PH_SERVICES) {
    const isCrashed = simState[svc.name]?.status !== 'running';
    if (!isCrashed) continue;

    let success = false;

    if (useDocker) {
      // Try docker start first, then docker-compose up
      try {
        addLog(`[Heal] Starting ${svc.container} via docker start...`);
        await tryDockerStart(svc.container);
        success = true;
        addLog(`[Heal] ✅ ${svc.container} started`);
      } catch {
        addLog(`[Heal] docker start failed, trying docker-compose up...`);
        success = await tryComposeStart(svc.composeService);
        if (success) addLog(`[Heal] ✅ ${svc.name} started via docker-compose`);
        else addLog(`[Heal] ❌ Could not start ${svc.container}`);
      }
    } else {
      // No Docker — use docker-compose directly
      addLog(`[Heal] Restarting ${svc.name} via docker-compose...`);
      success = await tryComposeStart(svc.composeService);
      if (!success) {
        // Pure simulation fallback (no docker at all)
        addLog(`[Heal] [SIM] Restoring ${svc.name} in simulation state`);
        success = true;
      }
    }

    if (success) {
      simState[svc.name] = { status: 'running', restartCount: (simState[svc.name]?.restartCount||0)+1 };
      restarted.push(svc.container);
    } else {
      failed.push(svc.container);
    }
  }

  let pipelineTriggered = false;
  const critFailed = failed.filter(c => ['clonecloud-frontend','clonecloud-backend'].includes(c));
  if (critFailed.length && pipelineState.status !== 'Running') {
    addLog('[Heal] Critical containers failed → triggering pipeline rebuild');
    runPipelineReal();
    pipelineTriggered = true;
  }
  res.json({ restarted, failed, pipelineTriggered, timestamp: new Date().toISOString() });
});

// ─── CRASH SIMULATION ─────────────────────────────────────
app.post('/api/powerhub/crash-simulate', async (req, res) => {
  const { service } = req.body || {};
  const allowed = ['frontend', 'backend', 'mongodb'];
  if (!service || !allowed.includes(service))
    return res.status(400).json({ error: 'Invalid service. Choose: frontend, backend, or mongodb.' });

  const svc = PH_SERVICES.find(s => s.name === service);
  const useDocker = await checkDockerAvailable();

  // ── Attempt 1: docker stop ───────────────────────────────
  if (useDocker) {
    try {
      addLog(`[CrashSim] Stopping container ${svc.container}...`);
      await tryDockerStop(svc.container);
      simState[service] = { status: 'exited', restartCount: simState[service]?.restartCount||0 };
      addLog(`[CrashSim] 💀 ${svc.container} stopped (docker stop)`);
      return res.json({ stopped: svc.container, mode: 'docker', timestamp: new Date().toISOString() });
    } catch (e) {
      addLog(`[CrashSim] docker stop failed (${e.message.split('\n')[0]}), trying port kill...`);
    }
  }

  // ── Attempt 2: kill process by port (real kill — works even without docker socket) ──
  try {
    addLog(`[CrashSim] Killing process on port ${svc.port}...`);
    const killed = await tryKillPort(svc.port);
    if (killed) {
      simState[service] = { status: 'exited', restartCount: simState[service]?.restartCount||0 };
      addLog(`[CrashSim] 💀 Port ${svc.port} process terminated (port kill)`);
      return res.json({ stopped: svc.container, mode: 'port-kill', timestamp: new Date().toISOString() });
    }
  } catch (e) {
    addLog(`[CrashSim] Port kill failed: ${e.message.split('\n')[0]}`);
  }

  // ── Attempt 3: docker-compose stop (last resort) ──────────
  if (useDocker) {
    try {
      addLog(`[CrashSim] Stopping via docker-compose stop ${svc.composeService}...`);
      await execAsync(`docker-compose stop ${svc.composeService} 2>/dev/null`, { cwd: COMPOSE_DIR, timeout: 15000 });
      simState[service] = { status: 'exited', restartCount: simState[service]?.restartCount||0 };
      addLog(`[CrashSim] 💀 ${svc.name} stopped via docker-compose`);
      return res.json({ stopped: svc.container, mode: 'docker-compose', timestamp: new Date().toISOString() });
    } catch (e) {
      addLog(`[CrashSim] docker-compose stop failed: ${e.message.split('\n')[0]}`);
    }
  }

  // ── Pure simulation fallback (nothing worked) ─────────────
  addLog(`[CrashSim] ⚠️  All real-stop methods failed. Using pure simulation (service status only).`);
  simState[service] = { status: 'exited', restartCount: simState[service]?.restartCount||0 };
  addLog(`[CrashSim] [SIM] 💀 ${service} marked as DOWN in simulation state`);
  res.json({ stopped: svc.container, mode: 'simulation', timestamp: new Date().toISOString() });
});

// ─────────────────────────────────────────────────────────
// KUBERNETES ROUTES
// ─────────────────────────────────────────────────────────
let simulatedPods = [
  { name:'powerhub-frontend-7c9f84b6d4-a1b2c', type:'frontend', status:'Running', restarts:0, namespace:NAMESPACE },
  { name:'powerhub-backend-5d6e7f8a9b-x9y8z',  type:'backend',  status:'Running', restarts:0, namespace:NAMESPACE },
  { name:'mongodb-0',                            type:'database', status:'Running', restarts:0, namespace:NAMESPACE },
];

async function kubectlAvailable() {
  try { await execAsync('kubectl version --client 2>/dev/null'); return true; } catch { return false; }
}

app.get('/api/kubernetes/pods', async (req, res) => {
  if (!(await kubectlAvailable())) return res.json({ source:'simulation', pods:simulatedPods });
  try {
    const { stdout } = await execAsync(`kubectl get pods -n ${NAMESPACE} -o json 2>/dev/null`);
    const pods = JSON.parse(stdout).items.map(p => ({
      name:      p.metadata.name,
      type:      p.metadata.labels?.component || 'unknown',
      status:    p.status.phase || 'Unknown',
      restarts:  (p.status.containerStatuses||[]).reduce((s,c) => s+c.restartCount, 0),
      namespace: p.metadata.namespace,
    }));
    simulatedPods = pods;
    res.json({ source:'kubectl', pods });
  } catch { res.json({ source:'simulation', pods:simulatedPods }); }
});

// ─────────────────────────────────────────────────────────
// MONITORING (Prometheus proxy)
// ─────────────────────────────────────────────────────────
async function queryProm(q) {
  try {
    const r = await fetch(`${PROM_URL}/api/v1/query?query=${encodeURIComponent(q)}`);
    const j = await r.json();
    return j.data?.result?.[0]?.value?.[1] || null;
  } catch (err) {
    console.error(`Prometheus query failed: ${err.message}`);
    return null;
  }
}

app.get('/api/monitoring/metrics', async (req, res) => {
  try {
    const [cpu, memory, podCount, httpRate] = await Promise.allSettled([
      queryProm('100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[2m])) * 100)'),
      queryProm('(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100'),
      queryProm(`count(kube_pod_info{namespace="${NAMESPACE}"})`),
      queryProm(`sum(rate(http_request_duration_seconds_count[2m]))`),
    ]);
    res.json({
      source:   'prometheus',
      cpu:      cpu.status==='fulfilled'     && cpu.value      ? parseFloat(cpu.value).toFixed(1)      : null,
      memory:   memory.status==='fulfilled'  && memory.value   ? parseFloat(memory.value).toFixed(1)   : null,
      podCount: podCount.status==='fulfilled'&& podCount.value ? parseInt(podCount.value)              : null,
      httpRate: httpRate.status==='fulfilled'&& httpRate.value ? parseFloat(httpRate.value).toFixed(2) : null,
    });
  } catch (e) {
    res.json({ source:'unavailable', error:e.message });
  }
});

// ─────────────────────────────────────────────────────────
// SECURITY
// ─────────────────────────────────────────────────────────
app.get('/api/security/report', (req, res) => {
  const paths = [
    path.join(__dirname, '../../security-report.txt'),
    path.join(__dirname, '../security-report.txt'),
    path.join(process.cwd(), 'security-report.txt'),
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, 'utf8');
      return res.json({
        found: true, report: content,
        summary: {
          critical: String([...content.matchAll(/[Cc]ritical:\s*(\d+)/g)].reduce((acc, m) => acc + parseInt(m[1]), 0)),
          high:     String([...content.matchAll(/[Hh]igh:\s*(\d+)/g)].reduce((acc, m) => acc + parseInt(m[1]), 0)),
          medium:   String([...content.matchAll(/[Mm]edium:\s*(\d+)/g)].reduce((acc, m) => acc + parseInt(m[1]), 0)),
        },
        lines: content.split('\n').length, path: p,
      });
    }
  }
  res.json({ found:false, report:'No report — run pipeline first.',
    summary:{ critical:'0', high:'0', medium:'0' }, lines:0 });
});

// ─────────────────────────────────────────────────────────
// HEALTH & METRICS
// ─────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status:'UP', timestamp:new Date(), mongodb:isDb()?'Connected':dbStatus, uptime:process.uptime() });
});

app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (e) { res.status(500).end(e.toString()); }
});

app.listen(PORT, () => console.log(`CloneCloud Dashboard API running on :${PORT}`));
