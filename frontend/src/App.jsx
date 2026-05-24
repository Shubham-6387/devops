import React, { useState, useEffect, useRef } from 'react';
import { 
  Cloud, 
  Play, 
  Plus, 
  Trash2, 
  Activity, 
  ShieldCheck, 
  Database, 
  Terminal, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ExternalLink,
  Cpu,
  Layers,
  RefreshCw
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function App() {
  // State for Tasks
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    status: 'Todo',
    priority: 'Medium'
  });

  // State for Health Checks
  const [backendHealth, setBackendHealth] = useState('Checking');
  const [mongoHealth, setMongoHealth] = useState('Checking');
  const [uptime, setUptime] = useState(0);

  // State for DevSecOps Pipeline Simulator
  const [pipelineStatus, setPipelineStatus] = useState('Idle'); // 'Idle', 'Running', 'Passed', 'Failed'
  const [activeStep, setActiveStep] = useState(-1);
  const [pipelineSteps, setPipelineSteps] = useState([
    { name: 'Source Checkout', desc: 'Pull latest code from Github repository', status: 'pending' },
    { name: 'Security Scanning', desc: 'Execute npm audit & Trivy container scans', status: 'pending' },
    { name: 'Docker Build', desc: 'Build multi-stage production container images', status: 'pending' },
    { name: 'Registry Push', desc: 'Push images to secure container registry', status: 'pending' },
    { name: 'Helm Deploy', desc: 'Initiate rolling update upgrade on K8s cluster', status: 'pending' },
    { name: 'Validation Check', desc: 'Run end-to-end service integration checks', status: 'pending' }
  ]);

  // State for K8s Simulator
  const [pods, setPods] = useState([
    { name: 'clonecloud-frontend-7c9f84b6d4-a1b2c', type: 'frontend', status: 'Running', restarts: 0 },
    { name: 'clonecloud-backend-5d6e7f8a9b-x9y8z', type: 'backend', status: 'Running', restarts: 2 },
    { name: 'mongodb-0', type: 'database', status: 'Running', restarts: 0 }
  ]);
  const [k8sLogs, setK8sLogs] = useState([
    'Initializing clonecloud-main namespace...',
    'MongoDB StatefulSet storage bound successfully.',
    'Cluster IP Service bindings verified.',
    'HPA Controller loaded target metrics (CPU > 80%).'
  ]);
  const [isHealing, setIsHealing] = useState(false);

  // Telemetry/Metrics Simulation
  const [metrics, setMetrics] = useState(Array.from({ length: 15 }, () => Math.floor(Math.random() * 40) + 10));
  const logsEndRef = useRef(null);

  // Fetch Tasks and Health Check
  const fetchTasksAndHealth = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch tasks
      const res = await fetch(`${API_URL}/api/tasks`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      } else {
        throw new Error('API return status not OK');
      }

      // 2. Health check
      const healthRes = await fetch(`${API_URL}/health`);
      if (healthRes.ok) {
        const health = await healthRes.json();
        setBackendHealth('Connected');
        setMongoHealth(health.mongodb === 'Connected' ? 'Connected' : 'Disconnected');
        setUptime(Math.floor(health.uptime) || 0);
      } else {
        setBackendHealth('Connected');
        setMongoHealth('Disconnected');
      }
    } catch (err) {
      console.log('Unable to reach backend API, using local simulation storage.');
      // Local simulated fetch
      setBackendHealth('Disconnected');
      setMongoHealth('Disconnected');
      // Set some initial fallback tasks if state is empty
      if (tasks.length === 0) {
        setTasks([
          {
            _id: 'local-1',
            title: 'Initialize CloneCloud Repository',
            description: 'Set up directory structure, React frontend, Express backend, and Helm configs.',
            status: 'Done',
            priority: 'High',
            createdAt: new Date()
          },
          {
            _id: 'local-2',
            title: 'Configure Kubernetes Cluster',
            description: 'Prepare K8s namespaces, secrets, and Helm values.',
            status: 'In Progress',
            priority: 'Medium',
            createdAt: new Date()
          },
          {
            _id: 'local-3',
            title: 'Integrate Prometheus & Grafana Monitoring',
            description: 'Deploy Prometheus server and configure Grafana dashboards.',
            status: 'Todo',
            priority: 'Low',
            createdAt: new Date()
          }
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksAndHealth();
    // Refresh health and tasks every 10 seconds
    const interval = setInterval(fetchTasksAndHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  // Update telemetry chart simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => [...prev.slice(1), Math.floor(Math.random() * 60) + 15]);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [k8sLogs]);

  // Create Task Action
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    try {
      const res = await fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask)
      });
      if (res.ok) {
        const saved = await res.json();
        setTasks(prev => [saved, ...prev]);
      } else {
        throw new Error('Create request failed');
      }
    } catch (err) {
      // Fallback local update
      const localNew = {
        _id: `local-${Date.now()}`,
        ...newTask,
        createdAt: new Date()
      };
      setTasks(prev => [localNew, ...prev]);
      addK8sLog(`Simulated local task created: "${newTask.title}"`);
    }

    setNewTask({ title: '', description: '', status: 'Todo', priority: 'Medium' });
    setShowAddModal(false);
  };

  // Delete Task Action
  const handleDeleteTask = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/tasks/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setTasks(prev => prev.filter(t => t._id !== id));
      } else {
        throw new Error('Delete failed');
      }
    } catch (err) {
      // Fallback local delete
      setTasks(prev => prev.filter(t => t._id !== id));
      addK8sLog(`Simulated local task deleted.`);
    }
  };

  // Move Task Action (Promote / Demote Status)
  const handleMoveTask = async (task, direction) => {
    const statuses = ['Todo', 'In Progress', 'Done'];
    const currentIndex = statuses.indexOf(task.status);
    let nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= statuses.length) return;

    const nextStatus = statuses[nextIndex];
    try {
      const res = await fetch(`${API_URL}/api/tasks/${task._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        const updated = await res.json();
        setTasks(prev => prev.map(t => t._id === task._id ? updated : t));
      } else {
        throw new Error('Update failed');
      }
    } catch (err) {
      // Fallback local update
      setTasks(prev => prev.map(t => t._id === task._id ? { ...t, status: nextStatus } : t));
      addK8sLog(`Simulated local task transition: "${task.title}" to ${nextStatus}`);
    }
  };

  // Add a line to simulator logs
  const addK8sLog = (text) => {
    const time = new Date().toLocaleTimeString();
    setK8sLogs(prev => [...prev, `[${time}] ${text}`]);
  };

  // DevSecOps Pipeline Simulation trigger
  const runPipelineDemo = () => {
    if (pipelineStatus === 'Running') return;
    setPipelineStatus('Running');
    setActiveStep(0);
    
    // Reset steps
    setPipelineSteps(prev => prev.map(step => ({ ...step, status: 'pending' })));

    let step = 0;
    addK8sLog('--- Jenkins CI/CD Pipeline Triggered ---');
    
    const runStep = () => {
      if (step >= pipelineSteps.length) {
        setPipelineStatus('Passed');
        setActiveStep(-1);
        addK8sLog('--- CI/CD Pipeline Completed Successfully: Deployment Verified ---');
        return;
      }

      setPipelineSteps(prev => prev.map((s, idx) => {
        if (idx === step) return { ...s, status: 'active' };
        if (idx < step) return { ...s, status: 'success' };
        return s;
      }));

      // Stage specific logs
      const stepMessages = [
        'Checking out source code branch: clonecloud-main...',
        'Running vulnerability scanner (Trivy)... No Critical vulnerabilities found. audit checks ok.',
        'Building docker build artifacts. frontend:latest & backend:latest tag created.',
        'Pushing layers to registry: containerd.io/clonecloud/apps...',
        'Executing helm upgrade --install clonecloud ./helm/clonecloud...',
        'Running ingress verify checks: http://clonecloud.local returns HTTP 200.'
      ];
      addK8sLog(`Pipeline Stage [${step + 1}/${pipelineSteps.length}] - ${stepMessages[step]}`);

      step++;
      setTimeout(runStep, 1500);
    };

    runStep();
  };

  // Kubernetes Self-Healing Simulation
  const simulateSelfHealing = () => {
    if (isHealing) return;
    setIsHealing(true);
    
    // Locate backend pod
    const backendIdx = pods.findIndex(p => p.type === 'backend');
    if (backendIdx === -1) return;

    const targetPodName = pods[backendIdx].name;

    addK8sLog(`CRITICAL: Triggering deletion command: kubectl delete pod ${targetPodName} -n clonecloud-main`);

    // Step 1: Pod goes into Terminating status
    setPods(prev => prev.map(p => p.type === 'backend' ? { ...p, status: 'Terminating' } : p));
    addK8sLog(`K8s: Pod ${targetPodName} changed status to Terminating.`);

    // Step 2: Pod is gone, ReplicaSet notices mismatch
    setTimeout(() => {
      setPods(prev => prev.map(p => p.type === 'backend' ? { ...p, status: 'Missing' } : p));
      addK8sLog(`K8s Warning: ReplicaSet clonecloud-backend count is 0/1. Desired: 1.`);
    }, 1500);

    // Step 3: ReplicaSet starts new pod (Pending status)
    setTimeout(() => {
      const newPodName = `clonecloud-backend-5d6e7f8a9b-` + Math.random().toString(36).substring(2, 7);
      setPods(prev => prev.map(p => p.type === 'backend' ? { 
        name: newPodName, 
        type: 'backend', 
        status: 'Pending', 
        restarts: p.restarts + 1 
      } : p));
      addK8sLog(`K8s: Controller scheduling new backend pod on node-1... status: Pending`);
    }, 3000);

    // Step 4: Container starting / Recreating
    setTimeout(() => {
      addK8sLog(`K8s: pulling image containerd.io/clonecloud/backend:latest...`);
      setPods(prev => prev.map(p => p.type === 'backend' ? { ...p, status: 'Recreating' } : p));
    }, 4500);

    // Step 5: Pod is running and Healthy
    setTimeout(() => {
      setPods(prev => prev.map(p => p.type === 'backend' ? { ...p, status: 'Running' } : p));
      addK8sLog(`K8s: Pod initialized. Readiness probe passed. Added back to target backend-service pool.`);
      setIsHealing(false);
    }, 6000);
  };

  // Helper for grouping tasks by status
  const getTasksByStatus = (status) => {
    return tasks.filter(task => task.status === status);
  };

  return (
    <div className="app-container">
      {/* Header section */}
      <header className="app-header glass-panel">
        <div className="brand-section">
          <div className="brand-icon">
            <Cloud size={24} />
          </div>
          <div>
            <h1 className="brand-title">CloneCloud</h1>
            <span className="brand-badge">DevSecOps Platform</span>
          </div>
        </div>

        <div className="system-status-pills">
          <div className="status-pill">
            <span>Backend:</span>
            <div className={`status-dot ${backendHealth === 'Connected' ? 'online' : backendHealth === 'Checking' ? 'warning' : 'offline'}`}></div>
            <span style={{ fontWeight: 500 }}>{backendHealth}</span>
          </div>
          <div className="status-pill">
            <span>MongoDB:</span>
            <div className={`status-dot ${mongoHealth === 'Connected' ? 'online' : mongoHealth === 'Checking' ? 'warning' : 'offline'}`}></div>
            <span style={{ fontWeight: 500 }}>{mongoHealth}</span>
          </div>
        </div>
      </header>

      {/* Hero statistics grid */}
      <section className="stats-grid" id="stats-section">
        <div className="stat-card glass-panel cyan">
          <div className="stat-header">
            <span>Total Task Items</span>
            <Layers size={16} className="text-cyan" />
          </div>
          <div className="stat-value">{tasks.length}</div>
          <div className="stat-subtext">Active operational state</div>
        </div>

        <div className="stat-card glass-panel purple">
          <div className="stat-header">
            <span>K8s Active Pods</span>
            <Activity size={16} className="text-purple" />
          </div>
          <div className="stat-value">{pods.filter(p => p.status === 'Running').length} / {pods.length}</div>
          <div className="stat-subtext">Self-healing cluster ready</div>
        </div>

        <div className="stat-card glass-panel emerald">
          <div className="stat-header">
            <span>Deployment Status</span>
            <CheckCircle2 size={16} className="text-emerald" />
          </div>
          <div className="stat-value" style={{ fontSize: '20px', lineHeight: '36px' }}>
            {pipelineStatus === 'Passed' ? 'VERIFIED' : pipelineStatus === 'Running' ? 'BUILDING' : 'STABLE'}
          </div>
          <div className="stat-subtext">Version: v1.1.2 (Helm)</div>
        </div>

        <div className="stat-card glass-panel amber">
          <div className="stat-header">
            <span>HPA Target Load</span>
            <Cpu size={16} className="text-amber" />
          </div>
          <div className="stat-value">14%</div>
          <div className="stat-subtext">Replicas: min 1 / max 5</div>
        </div>
      </section>

      {/* Main dashboard grid */}
      <main className="dashboard-layout">
        {/* Left Side: Tasks Board */}
        <section className="board-container">
          <div className="board-header-row">
            <h2 className="section-title">TaskFlow Board</h2>
            <button 
              id="add-task-btn"
              className="btn-primary" 
              onClick={() => setShowAddModal(true)}
            >
              <Plus size={16} /> Add New Task
            </button>
          </div>

          <div className="board-columns">
            {/* Column: To Do */}
            <div className="column">
              <div className="column-header">
                <span className="column-title"><Layers size={14} /> To Do</span>
                <span className="column-count">{getTasksByStatus('Todo').length}</span>
              </div>
              <div className="column-list">
                {getTasksByStatus('Todo').map(task => (
                  <div key={task._id} className="task-card">
                    <div className="task-title">{task.title}</div>
                    {task.description && <div className="task-desc">{task.description}</div>}
                    <div className="task-meta">
                      <span className={`priority-badge ${task.priority.toLowerCase()}`}>{task.priority}</span>
                      <div className="task-actions">
                        <button className="icon-btn" onClick={() => handleMoveTask(task, 1)} title="Move to In Progress">
                          <ArrowRight size={14} />
                        </button>
                        <button className="icon-btn delete" onClick={() => handleDeleteTask(task._id)} title="Delete Task">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column: In Progress */}
            <div className="column">
              <div className="column-header">
                <span className="column-title"><Activity size={14} /> In Progress</span>
                <span className="column-count">{getTasksByStatus('In Progress').length}</span>
              </div>
              <div className="column-list">
                {getTasksByStatus('In Progress').map(task => (
                  <div key={task._id} className="task-card">
                    <div className="task-title">{task.title}</div>
                    {task.description && <div className="task-desc">{task.description}</div>}
                    <div className="task-meta">
                      <span className={`priority-badge ${task.priority.toLowerCase()}`}>{task.priority}</span>
                      <div className="task-actions">
                        <button className="icon-btn" onClick={() => handleMoveTask(task, -1)} title="Move to Todo">
                          <ArrowLeft size={14} />
                        </button>
                        <button className="icon-btn" onClick={() => handleMoveTask(task, 1)} title="Move to Done">
                          <ArrowRight size={14} />
                        </button>
                        <button className="icon-btn delete" onClick={() => handleDeleteTask(task._id)} title="Delete Task">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column: Done */}
            <div className="column">
              <div className="column-header">
                <span className="column-title"><CheckCircle2 size={14} /> Completed</span>
                <span className="column-count">{getTasksByStatus('Done').length}</span>
              </div>
              <div className="column-list">
                {getTasksByStatus('Done').map(task => (
                  <div key={task._id} className="task-card">
                    <div className="task-title">{task.title}</div>
                    {task.description && <div className="task-desc">{task.description}</div>}
                    <div className="task-meta">
                      <span className={`priority-badge ${task.priority.toLowerCase()}`}>{task.priority}</span>
                      <div className="task-actions">
                        <button className="icon-btn" onClick={() => handleMoveTask(task, -1)} title="Move to In Progress">
                          <ArrowLeft size={14} />
                        </button>
                        <button className="icon-btn delete" onClick={() => handleDeleteTask(task._id)} title="Delete Task">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Right Side: DevSecOps Controls */}
        <aside className="side-panels">
          {/* DevSecOps Pipeline widget */}
          <div className="glass-panel">
            <h3 className="panel-title">
              <ShieldCheck className="text-cyan" size={18} /> DevSecOps Pipeline
            </h3>
            <div className="pipeline-content">
              <div className="pipeline-steps">
                {pipelineSteps.map((step, idx) => (
                  <div 
                    key={step.name} 
                    className={`pipeline-step ${idx === activeStep ? 'active' : ''} ${step.status === 'success' ? 'success' : step.status === 'failed' ? 'failed' : ''}`}
                  >
                    <div className="step-node"></div>
                    <div className="step-info">
                      <span className="step-name">{step.name}</span>
                      <span className="step-desc">{step.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <button 
                id="run-pipeline-btn"
                className="btn-primary" 
                style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}
                onClick={runPipelineDemo}
                disabled={pipelineStatus === 'Running'}
              >
                <Play size={14} /> {pipelineStatus === 'Running' ? 'Orchestrating Build...' : 'Trigger Pipeline Build'}
              </button>
            </div>
          </div>

          {/* Self-Healing Kubernetes panel */}
          <div className="glass-panel">
            <h3 className="panel-title">
              <Activity className="text-purple" size={18} /> K8s Self-Healing Simulator
            </h3>
            <div className="k8s-content">
              <div className="pod-list">
                {pods.map(pod => (
                  <div key={pod.name} className="pod-item">
                    <span className="pod-name">{pod.name}</span>
                    <span className={`pod-status ${pod.status.toLowerCase()}`}>
                      {pod.status} {pod.restarts > 0 && `(R:${pod.restarts})`}
                    </span>
                  </div>
                ))}
              </div>

              <div className="logs-box">
                {k8sLogs.map((log, idx) => (
                  <div key={idx}>{log}</div>
                ))}
                <div ref={logsEndRef} />
              </div>

              <button 
                id="kill-pod-btn"
                className="btn-secondary"
                style={{ width: '100%', borderColor: 'var(--accent-rose)', color: 'var(--accent-rose)' }}
                onClick={simulateSelfHealing}
                disabled={isHealing}
              >
                <RefreshCw size={14} style={{ marginRight: '6px', animation: isHealing ? 'spin 1.5s infinite linear' : 'none' }} />
                Simulate Crash (Kill Backend Pod)
              </button>
            </div>
          </div>

          {/* Observability Panel */}
          <div className="glass-panel">
            <h3 className="panel-title">
              <Database className="text-amber" size={18} /> Prometheus telemetry
            </h3>
            <div className="obs-content">
              <div className="metric-chart-sim">
                {metrics.map((val, idx) => (
                  <div 
                    key={idx} 
                    className="bar-sim" 
                    style={{ height: `${val}%` }}
                    title={`Request rate: ${val} req/sec`}
                  ></div>
                ))}
              </div>
              <div className="obs-links">
                <a href="http://localhost:9090" target="_blank" rel="noreferrer" className="obs-btn">
                  Prometheus <ExternalLink size={12} />
                </a>
                <a href="http://localhost:3001" target="_blank" rel="noreferrer" className="obs-btn">
                  Grafana <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* Task Modal Overlay */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <h3 style={{ fontSize: '18px' }}>Create DevSecOps Task</h3>
              <button className="icon-btn" onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCreateTask}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label htmlFor="task-title">Task Name</label>
                <input 
                  id="task-title"
                  type="text" 
                  className="form-control" 
                  value={newTask.title} 
                  onChange={e => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Set up SonarQube quality gate"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label htmlFor="task-desc">Description</label>
                <textarea 
                  id="task-desc"
                  className="form-control" 
                  rows="3"
                  value={newTask.description}
                  onChange={e => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Details about task objectives and tools involved..."
                ></textarea>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div className="form-group">
                  <label htmlFor="task-status">Status</label>
                  <select 
                    id="task-status"
                    className="form-control"
                    value={newTask.status}
                    onChange={e => setNewTask(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="Todo">Todo</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Completed</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="task-priority">Priority</label>
                  <select 
                    id="task-priority"
                    className="form-control"
                    value={newTask.priority}
                    onChange={e => setNewTask(prev => ({ ...prev, priority: e.target.value }))}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" id="submit-task-btn" className="btn-primary">
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
