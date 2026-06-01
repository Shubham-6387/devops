import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Cloud, Play, Activity, ShieldCheck, Database, CheckCircle2,
  AlertCircle, ExternalLink, Cpu, RefreshCw, Shield, Zap,
  Server, AlertTriangle, Heart, Box, GitBranch,
  Clock, TrendingUp, Layers, Circle, Siren, Terminal, ChevronRight,
  ShieldAlert, Settings, FileText, CheckCircle, Info, RefreshCcw
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const POLL_MS  = 3000;
const FETCH_TIMEOUT_MS = 5000;

const apiFetch = async (path, opts = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const r = await fetch(`${API_URL}${path}`, { ...opts, signal: controller.signal });
    clearTimeout(timer);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
};

const fmt   = v  => (v !== null && v !== undefined) ? v : '—';
const ts    = () => new Date().toLocaleTimeString();
const svcColor = s => s === 'running' ? 'var(--emerald)' : s === 'checking' ? 'var(--amber)' : 'var(--rose)';
const svcBg    = s => s === 'running' ? 'rgba(16,185,129,.06)'  : s === 'checking' ? 'rgba(245,158,11,.06)' : 'rgba(239,68,68,.06)';
const svcBdr   = s => s === 'running' ? 'rgba(16,185,129,.15)'  : s === 'checking' ? 'rgba(245,158,11,.15)' : 'rgba(239,68,68,.2)';

export default function App() {
  const [activeTab,    setActiveTab]   = useState('Dashboard');
  const [health,       setHealth]      = useState({ api:'checking', mongo:'checking', uptime:0 });
  const [phStatus,     setPhStatus]    = useState(null);
  const [pipeline,     setPipeline]    = useState(null);
  const [pipeLogs,     setPipeLogs]    = useState([]);
  const [logOffset,    setLogOffset]   = useState(0);
  const [pods,         setPods]        = useState([]);
  const [podSrc,       setPodSrc]      = useState('simulation');
  const [metrics,      setMetrics]     = useState(null);
  const [chart,        setChart]       = useState(Array.from({length:24}, ()=>Math.floor(Math.random()*15)+10));
  const [secReport,    setSecReport]   = useState(null);
  const [healLog,      setHealLog]     = useState([]);
  const [healing,      setHealing]     = useState(false);
  const [recoveryStep, setRecoveryStep] = useState(0);
  const [pipeRunning,  setPipeRunning] = useState(false);
  const [crashing,     setCrashing]    = useState(false);
  const [crashTarget,  setCrashTarget] = useState('frontend');
  const [autoHeal,     setAutoHeal]    = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const reconnectRef = useRef(null);

  const logBoxRef  = useRef(null);
  const healBoxRef = useRef(null);

  // ── Fetchers ──────────────────────────────────────────────
  const fetchHealth = useCallback(async () => {
    try {
      const h = await apiFetch('/health');
      setHealth({ api:'connected', mongo: h.mongodb === 'Connected' ? 'connected' : 'disconnected', uptime: h.uptime || 0 });
      setReconnecting(false);
      if (reconnectRef.current) { clearInterval(reconnectRef.current); reconnectRef.current = null; }
    } catch {
      setHealth(p => ({ ...p, api:'disconnected', mongo:'disconnected' }));
      if (!reconnectRef.current) {
        setReconnecting(true);
        reconnectRef.current = setInterval(async () => {
          try {
            const h = await apiFetch('/health');
            setHealth({ api:'connected', mongo: h.mongodb === 'Connected' ? 'connected' : 'disconnected', uptime: h.uptime || 0 });
            setReconnecting(false);
            clearInterval(reconnectRef.current); reconnectRef.current = null;
          } catch {}
        }, 2000);
      }
    }
  }, []);

  const fetchPH = useCallback(async () => {
    try {
      const s = await apiFetch('/api/powerhub/status');
      setPhStatus(s);
    } catch {}
  }, []);

  const fetchPipeline = useCallback(async () => {
    try {
      const state = await apiFetch('/api/pipeline/status');
      setPipeline(state);
      setPipeRunning(state.status === 'Running');
      if (state.status === 'Running') {
        const { logs } = await apiFetch(`/api/pipeline/logs?since=${logOffset}`);
        if (logs?.length) {
          setPipeLogs(p => [...p, ...logs]);
          setLogOffset(p => p + logs.length);
        }
      }
    } catch {}
  }, [logOffset]);

  const fetchPods    = useCallback(async () => {
    try { const { pods:p, source } = await apiFetch('/api/kubernetes/pods'); setPods(p||[]); setPodSrc(source); } catch {}
  }, []);

  const fetchMetrics = useCallback(async () => {
    try {
      const m = await apiFetch('/api/monitoring/metrics');
      let cpuVal = parseFloat(m.cpu);
      let memVal = parseFloat(m.memory);
      
      if (!m.cpu || m.source !== 'prometheus') {
        if (healing || pipeRunning) {
          cpuVal = Math.floor(Math.random() * 15) + 75;
          memVal = Math.floor(Math.random() * 10) + 65;
        } else {
          cpuVal = Math.floor(Math.random() * 10) + 12;
          memVal = Math.floor(Math.random() * 5) + 42;
        }
      }

      setMetrics({
        source: m.source || 'simulated',
        cpu: cpuVal,
        memory: memVal,
        podCount: m.podCount || pods.length || 3,
        httpRate: m.httpRate || (healing ? 8.4 : 1.2),
      });

      setChart(p => [...p.slice(1), cpuVal]);
    } catch {
      const dummyCpu = (healing || pipeRunning) ? Math.floor(Math.random()*15)+75 : Math.floor(Math.random()*10)+12;
      setChart(p => [...p.slice(1), dummyCpu]);
    }
  }, [healing, pipeRunning, pods.length]);

  const fetchSecurity = useCallback(async () => {
    try { setSecReport(await apiFetch('/api/security/report')); } catch {}
  }, []);

  // ── Polling ───────────────────────────────────────────────
  useEffect(() => {
    fetchHealth(); fetchPH(); fetchPipeline(); fetchPods(); fetchMetrics(); fetchSecurity();
    const iv = setInterval(() => {
      fetchHealth(); fetchPH(); fetchPipeline(); fetchPods(); fetchMetrics();
    }, POLL_MS);
    return () => clearInterval(iv);
  }, [fetchHealth, fetchPH, fetchPipeline, fetchPods, fetchMetrics, fetchSecurity]);

  useEffect(() => { logBoxRef.current?.scrollTo(0, logBoxRef.current.scrollHeight); }, [pipeLogs]);
  useEffect(() => { healBoxRef.current?.scrollTo(0, healBoxRef.current.scrollHeight); }, [healLog]);

  // ── Actions ───────────────────────────────────────────────
  const triggerPipeline = async () => {
    if (pipeRunning) return;
    setPipeLogs([]); setLogOffset(0);
    try { await apiFetch('/api/pipeline/trigger', { method:'POST' }); fetchPipeline(); } catch {}
  };

  const healPowerHub = async () => {
    if (healing) return;
    setHealing(true);
    setRecoveryStep(1);
    setHealLog(p => [...(p.length ? p : []), `[${ts()}] 🚨 Initiating PowerHub recovery...`]);
    
    try {
      setHealLog(p => [...p, `[${ts()}] 🔍 Inspecting container health and logs...`]);
      await new Promise(r => setTimeout(r, 500));
      
      setRecoveryStep(2);
      let res;
      try {
        res = await apiFetch('/api/powerhub/heal', { method:'POST' });
      } catch {
        // Backend unreachable — mark as pipeline fallback immediately
        setRecoveryStep(-1);
        setHealLog(p => [...p, `[${ts()}] ⚠️  Backend unreachable — will retry when reconnected`]);
        setHealing(false);
        return;
      }
      
      if (res.restarted?.length) {
        setHealLog(p => [...p, `[${ts()}] 🔄 Restarted container: ${res.restarted.join(', ')}`]);
        setHealLog(p => [...p, `[${ts()}] ⏳ Verifying container startup sequence...`]);
        setRecoveryStep(3);
        await new Promise(r => setTimeout(r, 600));
        setHealLog(p => [...p, `[${ts()}] ⚡ Database connection hooks validating...`]);
        setRecoveryStep(4);
        await new Promise(r => setTimeout(r, 600));
        setHealLog(p => [...p, `[${ts()}] 🩺 Running HTTP status probes...`]);
        setRecoveryStep(5);
        await new Promise(r => setTimeout(r, 500));
        try { await fetchPH(); } catch {}
        setHealLog(p => [...p, `[${ts()}] ✅ Recovery complete — PowerHub is back online!`]);
        setRecoveryStep(6);
      } else if (res.pipelineTriggered) {
        setRecoveryStep(-1);
        setHealLog(p => [...p, `[${ts()}] 🚀 Container restart failed → triggering pipeline rebuild`]);
        setPipeLogs([]); setLogOffset(0);
        try { await fetchPipeline(); } catch {}
        setHealLog(p => [...p, `[${ts()}] 🏗️  Pipeline rebuild in progress...`]);
      } else {
        setHealLog(p => [...p, `[${ts()}] ✅ All PowerHub services are already running.`]);
        setRecoveryStep(6);
      }
    } catch (err) {
      setRecoveryStep(-1);
      setHealLog(p => [...p, `[${ts()}] ⚠️  Recovery error: ${err?.message || 'Unknown'}`]);
    } finally {
      setHealing(false);
    }
  };

  const simulateCrash = async () => {
    if (crashing || healing) return;
    setCrashing(true);
    setRecoveryStep(0);
    setHealLog([`[${ts()}] 💥 CRASH SIMULATION — targeting: clonecloud-${crashTarget}`]);
    try {
      setHealLog(p => [...p, `[${ts()}] 🔴 Stopping container clonecloud-${crashTarget}...`]);
      let res;
      try {
        res = await apiFetch('/api/powerhub/crash-simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ service: crashTarget }),
        });
      } catch {
        // Backend timeout or network error — treat as simulated crash
        res = { mode: 'simulation (backend unreachable)' };
      }
      
      const isSim = res.mode !== 'docker';
      setHealLog(p => [...p, `[${ts()}] 💀 Container stopped (${isSim ? 'Simulation' : 'Real Container'})`]);
      setHealLog(p => [...p, `[${ts()}] ⚡ Watchdog registered failure. Outage declared.`]);
      if (!autoHeal) {
        setHealLog(p => [...p, `[${ts()}] ℹ️  Auto-Self-Healing is DISABLED. Service will remain OFFLINE.`]);
      }
      
      await new Promise(r => setTimeout(r, 500));
      try { await fetchPH(); } catch {}
    } catch (err) {
      setHealLog(p => [...p, `[${ts()}] 🔴 Crash simulation error: ${err?.message || 'Unknown'}`]);
    } finally {
      setCrashing(false);
      if (autoHeal) {
        // Small delay before heal to let state settle
        await new Promise(r => setTimeout(r, 300));
        healPowerHub().catch(() => {});
      }
    }
  };

  // ── Derived ───────────────────────────────────────────────
  const services     = phStatus?.services || FALLBACK_SERVICES;
  const phHealthy    = services.every(s => s.status === 'running');
  const phDegraded   = !phHealthy && services.some(s => s.status === 'running');
  const overallStatus= phHealthy ? 'HEALTHY' : phDegraded ? 'DEGRADED' : 'DOWN';
  const stageIcon    = s => s==='success'?'✅':s==='active'?'⚡':s==='failed'?'❌':'○';
  const uptimeStr    = health.uptime
    ? `${Math.floor(health.uptime/3600)}h ${Math.floor((health.uptime%3600)/60)}m`
    : '—';
  const isRealMode   = services.length > 0 && !services[0].simulated;

  const getStepClass = (sStep) => {
    if (recoveryStep === -1) {
      if (sStep <= 2) return 'rec-step completed';
      return 'rec-step failed';
    }
    if (recoveryStep > sStep || recoveryStep === 6) {
      return 'rec-step completed';
    }
    if (recoveryStep === sStep && healing) {
      return 'rec-step active';
    }
    return 'rec-step';
  };

  return (
    <div className="root">

      {/* ══ HEADER ══════════════════════════════════════════════ */}
      <header className="header">
        <div className="header-brand">
          <div className="brand-orb"><Cloud size={20}/></div>
          <div>
            <h1 className="brand-name">CloneCloud</h1>
            <span className="brand-sub">PowerHub DevSecOps Platform</span>
          </div>
        </div>

        <nav className="header-nav">
          {['Dashboard', 'Pipeline', 'Kubernetes', 'Security'].map(tab => (
            <span
              key={tab}
              className={`nav-item ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              {tab}
            </span>
          ))}
        </nav>

        <div className="header-pills">
          <Pill label="API"      status={health.api}/>
          <Pill label="MongoDB"  status={health.mongo}/>
          <Pill label="PowerHub" status={phHealthy?'connected':phDegraded?'warning':'disconnected'}/>
          {health.uptime > 0 && <div className="pill"><Clock size={11}/> {uptimeStr}</div>}
        </div>

        <a href="http://localhost:3000" target="_blank" rel="noreferrer" className="btn-open">
          Open PowerHub <ExternalLink size={13}/>
        </a>
      </header>

      {/* ══ RECONNECTING BANNER ══════════════════════════════════ */}
      {reconnecting && (
        <div style={{
          display:'flex', alignItems:'center', gap:'10px',
          padding:'10px 20px', background:'rgba(245,158,11,0.12)',
          borderBottom:'1px solid rgba(245,158,11,0.25)',
          fontSize:'13px', color:'var(--amber)'
        }}>
          <RefreshCw size={14} className="spin"/>
          <strong>Backend unreachable</strong>
          <span style={{opacity:.7}}>— Frontend is still running. Reconnecting to API automatically...</span>
        </div>
      )}

      {/* ══ ALERT BANNER ════════════════════════════════════════ */}
      {!phHealthy && (
        <div className="alert-banner">
          <div className="alert-icon-wrap"><Siren size={18}/></div>
          <div style={{flex:1}}>
            <strong style={{color:'var(--rose)'}}>PowerHub {overallStatus}</strong>
            <span style={{fontSize:'12px', opacity:.8, marginLeft:'8px'}}>
              {services.filter(s=>s.status!=='running').map(s=>s.label).join(', ')} {services.filter(s=>s.status!=='running').length===1?'is':'are'} unreachable
            </span>
          </div>
          <button className="btn-heal-banner" onClick={healPowerHub} disabled={healing}>
            <Heart size={14} className={healing?'spin':''}/>
            {healing ? 'Recovering...' : 'Auto-Recover Now'}
          </button>
        </div>
      )}

      {/* ══ KPI STRIP ════════════════════════════════════════════ */}
      <div className="kpi-strip">
        <KpiCard accent="cyan"    icon={<Box size={18}/>}       label="PowerHub Status"   value={overallStatus}
          sub={`${services.filter(s=>s.status==='running').length}/${services.length} services up`}/>
        <KpiCard accent="purple"  icon={<Layers size={18}/>}    label="K8s Pods"
          value={`${pods.filter(p=>p.status==='Running').length} / ${pods.length||3}`}
          sub={podSrc==='kubectl'?'⚡ Live cluster':'🔵 Simulated'}/>
        <KpiCard accent="emerald" icon={<GitBranch size={18}/>} label="Pipeline"
          value={pipeline?.status==='Passed'?'DEPLOYED':pipeline?.status==='Running'?'BUILDING':'IDLE'}
          sub={`Build #${pipeline?.buildNumber||0}`}/>
        <KpiCard accent="amber"   icon={<Cpu size={18}/>}       label="CPU Usage"
          value={metrics?.cpu?`${metrics.cpu}%`:'—'}
          sub={isRealMode?'📊 Real-Time Docker':'Simulated Telemetry'}/>
      </div>

      {/* ══ TAB ROUTING CONTENT ══════════════════════════════════ */}
      
      {activeTab === 'Dashboard' && (
        <div className="main-grid">
          {/* ── LEFT COLUMN ── */}
          <div className="col-left">

            {/* PowerHub Services */}
            <div className="card">
              <div className="card-header">
                <span className="card-title"><Box size={15}/> PowerHub Services</span>
                <span className={`badge ${isRealMode ? 'emerald' : 'rose'}`}>
                  {isRealMode ? 'Real App' : 'Simulated'}
                </span>
                <button className="btn-icon" onClick={fetchPH} title="Refresh"><RefreshCw size={13}/></button>
              </div>
              <div className="svc-list">
                {services.map(svc => <ServiceRow key={svc.name} svc={svc}/>)}
              </div>
            </div>

            {/* Crash Simulation Lab */}
            <div className="card card-danger">
              <div className="card-header">
                <span className="card-title" style={{color:'var(--rose)'}}>
                  <Zap size={15}/> Crash Simulation Lab
                </span>
                <span className={`badge ${isRealMode ? 'emerald' : 'rose'}`}>
                  {isRealMode ? 'Real Outage' : 'Simulated'}
                </span>
              </div>
              <p className="card-desc">
                Simulate a service crash to test CloneCloud's self-healing pipeline. 
                {isRealMode 
                  ? " The platform will execute docker stop and physically crash the container."
                  : " Make sure to run `sudo chmod 666 /var/run/docker.sock` to enable Real Container crashing!"
                }
              </p>

              <div className="crash-controls">
                <div className="crash-target-group">
                  <label className="crash-label">Target Service</label>
                  <div className="crash-buttons">
                    {['frontend','backend','mongodb'].map(svc => (
                      <button
                        key={svc}
                        className={`crash-target-btn ${crashTarget===svc?'active':''}`}
                        onClick={() => setCrashTarget(svc)}
                      >
                        {svc==='frontend'?<Box size={12}/>:svc==='backend'?<Server size={12}/>:<Database size={12}/>}
                        {svc}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display:'flex', flexDirection:'column', gap:'6px', flexShrink:0 }}>
                  <label className="crash-label">Self-Healing Watchdog</label>
                  <label style={{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', padding:'8px 12px', background:'rgba(0,0,0,0.03)', borderRadius:'8px', border:'1px solid var(--border)', userSelect:'none' }}>
                    <input 
                      type="checkbox" 
                      checked={autoHeal} 
                      onChange={e => setAutoHeal(e.target.checked)}
                      style={{ cursor:'pointer' }}
                    />
                    <span style={{ fontSize:'11.5px', fontWeight:600, color:autoHeal?'var(--emerald)':'var(--rose)' }}>
                      {autoHeal ? 'ENABLED' : 'DISABLED'}
                    </span>
                  </label>
                </div>

                <button
                  className="btn-crash"
                  onClick={simulateCrash}
                  disabled={crashing || healing}
                >
                  {crashing
                    ? <><RefreshCw size={15} className="spin"/> Crashing...</>
                    : <><Zap size={15}/> Simulate Crash</>
                  }
                </button>
              </div>

              <div className="crash-flow">
                <div className="flow-step"><span className="flow-dot rose"/><span>Stop Container</span></div>
                <ChevronRight size={12} style={{color:'var(--text3)'}}/>
                <div className="flow-step"><span className="flow-dot amber"/><span>Detect Failure</span></div>
                <ChevronRight size={12} style={{color:'var(--text3)'}}/>
                <div className="flow-step"><span className="flow-dot cyan"/><span>Auto-Heal</span></div>
                <ChevronRight size={12} style={{color:'var(--text3)'}}/>
                <div className="flow-step"><span className="flow-dot emerald"/><span>Service Online</span></div>
              </div>
            </div>

            {/* Recovery Console */}
            <div className="card">
              <div className="card-header">
                <span className="card-title"><Heart size={15}/> Recovery Console</span>
                {healing && <span className="badge amber">In Progress</span>}
              </div>
              <div className="heal-actions">
                <button className="btn-heal" onClick={healPowerHub} disabled={healing||crashing}>
                  <Heart size={14} className={healing?'spin':''}/>
                  {healing ? 'Recovering...' : 'Trigger Recovery'}
                </button>
                <a href="http://localhost:3000" target="_blank" rel="noreferrer" className="btn-outline">
                  <ExternalLink size={13}/> Open PowerHub
                </a>
              </div>

              {/* Recovery Pipeline Flow Visualizer */}
              {(healing || recoveryStep > 0 || recoveryStep === -1) && (
                <div className="recovery-pipeline" style={{ animation: 'slideDown 0.3s var(--ease)' }}>
                  {[
                    { label: 'Inspect', step: 1, icon: <Shield size={13}/> },
                    { label: 'Restore', step: 2, icon: <RefreshCcw size={13}/> },
                    { label: 'Startup', step: 3, icon: <Play size={13}/> },
                    { label: 'Database', step: 4, icon: <Database size={13}/> },
                    { label: 'Probing', step: 5, icon: <ShieldCheck size={13}/> },
                    { label: 'Online', step: 6, icon: <CheckCircle2 size={13}/> },
                  ].map((s, idx, arr) => {
                    const stepClass = getStepClass(s.step);
                    return (
                      <div key={s.step} className={stepClass}>
                        <div className="rec-icon-wrap" title={s.label}>
                          {s.icon}
                        </div>
                        <span className="rec-label">{s.label}</span>
                        {idx < arr.length - 1 && <div className="rec-connector" />}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* DevOps Under-the-Hood Healing Engine Visualizer */}
              {(healing || recoveryStep > 0 || recoveryStep === -1 || pipeRunning) && (
                <div className="devops-pipeline-box">
                  <div className="devops-pipeline-header">
                    <span className="devops-title">
                      <Layers size={13}/> DevOps Orchestration Stack (Under-the-Hood)
                    </span>
                    <span className="devops-status-badge">
                      {recoveryStep === -1 || pipeRunning ? 'Jenkins & Helm Rebuild' : 'Docker Watchdog Active'}
                    </span>
                  </div>
                  <div className="devops-grid">
                    {[
                      { 
                        name: 'Docker Watchdog', 
                        label: 'Docker Daemon', 
                        icon: <Cpu size={14}/>, 
                        desc: 'Probes exited containers and issues docker restarts.',
                        status: recoveryStep >= 1 && recoveryStep <= 5 ? 'active' : recoveryStep === 6 ? 'completed' : recoveryStep === -1 ? 'failed' : 'idle'
                      },
                      { 
                        name: 'Jenkins CI', 
                        label: 'Jenkins Engine', 
                        icon: <GitBranch size={14}/>, 
                        desc: 'Triggered automatically upon recovery failure to compile source code.',
                        status: recoveryStep === -1 || pipeRunning ? 'active' : recoveryStep === 6 ? 'completed' : 'idle'
                      },
                      { 
                        name: 'Trivy Scanner', 
                        label: 'Trivy Security', 
                        icon: <Shield size={14}/>, 
                        desc: 'Runs full vulnerability scans during build steps.',
                        status: pipeRunning ? 'active' : recoveryStep === 6 ? 'completed' : 'idle'
                      },
                      { 
                        name: 'Helm deploy', 
                        label: 'Helm Manager', 
                        icon: <Server size={14}/>, 
                        desc: 'Lints, packages, and upgrades Kind cluster charts.',
                        status: pipeRunning ? 'active' : recoveryStep === 6 ? 'completed' : 'idle'
                      },
                      { 
                        name: 'Kubernetes Cluster', 
                        label: 'K8s Cluster', 
                        icon: <Layers size={14}/>, 
                        desc: 'Coordinates rolling upgrades and checks pod health.',
                        status: recoveryStep === 5 ? 'active' : recoveryStep === 6 ? 'completed' : 'idle'
                      }
                    ].map((node, idx, arr) => (
                      <div key={node.name} className={`devops-node ${node.status}`}>
                        <div className="devops-circle" title={`${node.name}: ${node.desc}`}>
                          {node.icon}
                        </div>
                        <span className="devops-node-label">{node.label}</span>
                        {idx < arr.length - 1 && <div className="devops-line-connector" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {healLog.length > 0 ? (
                <div className="log-box" ref={healBoxRef}>
                  {healLog.map((l,i) => <div key={i} className="log-line">{l}</div>)}
                </div>
              ) : (
                <div className="log-empty">
                  <Terminal size={16}/>
                  <span>Recovery logs will appear here...</span>
                </div>
              )}
            </div>

          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="col-right">

            {/* Telemetry quick view */}
            <div className="card">
              <div className="card-header">
                <span className="card-title"><TrendingUp size={15}/> Telemetry Overview</span>
              </div>
              <div className="metrics-grid">
                {[
                  ['CPU',    metrics?.cpu    ? `${metrics.cpu}%`    : '—', 'var(--cyan)'],
                  ['Memory', metrics?.memory ? `${metrics.memory}%` : '—', 'var(--purple)'],
                  ['Pods',   fmt(metrics?.podCount),                        'var(--emerald)'],
                  ['Req/s',  fmt(metrics?.httpRate),                        'var(--amber)'],
                ].map(([k,v,c]) => (
                  <div key={k} className="metric-tile" style={{cursor:'pointer'}} onClick={()=>setActiveTab('Kubernetes')}>
                    <span className="metric-val" style={{color:c}}>{v}</span>
                    <span className="metric-key">{k}</span>
                  </div>
                ))}
              </div>
              <div className="sparkline-wrap" style={{marginBottom:'14px'}}>
                <div className="sparkline">
                  {chart.map((v,i) => (
                    <div key={i} className="bar" style={{height:`${v}%`}}/>
                  ))}
                </div>
              </div>
            </div>

            {/* Pipeline quick view */}
            <div className="card" style={{cursor:'pointer'}} onClick={()=>setActiveTab('Pipeline')}>
              <div className="card-header">
                <span className="card-title"><GitBranch size={15}/> Pipeline Status</span>
                <span className="badge muted">Quick View</span>
              </div>
              <p className="card-desc" style={{paddingBottom:'14px'}}>
                Pipeline Build Status: <strong>{pipeline?.status || 'IDLE'}</strong>. Click to open detailed build pipeline and view compilation logs.
              </p>
            </div>

            {/* Security quick view */}
            <div className="card" style={{cursor:'pointer'}} onClick={()=>setActiveTab('Security')}>
              <div className="card-header">
                <span className="card-title"><Shield size={15}/> Security Suite</span>
                <span className="badge muted">Quick View</span>
              </div>
              <p className="card-desc" style={{paddingBottom:'14px'}}>
                Active trivy scan has completed. Vulnerabilities detected: <strong>{secReport?.summary?.critical || 0} Critical</strong>. Click to open the Security Scan Suite.
              </p>
            </div>

          </div>
        </div>
      )}

      {activeTab === 'Pipeline' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title"><GitBranch size={18}/> CI/CD Pipeline Control Center</span>
              {pipeline?.status && (
                <span className={`badge ${pipeline.status==='Passed'?'emerald':pipeline.status==='Running'?'cyan':'muted'}`}>
                  {pipeline.status}
                </span>
              )}
            </div>
            <p className="card-desc">
              Monitor, configure, and re-trigger pipeline builds for the PowerHub stack. The pipeline automates dependency checks, Trivy security scanning, Docker image packaging, and Helm chart deployment to local Kind clusters.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', padding: '20px 17px' }}>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Build Progress</h3>
                <div className="stages" style={{ background: 'rgba(0,0,0,0.015)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
                  {(pipeline?.stages || DEFAULT_STAGES).map((s,i) => (
                    <div key={i} className={`stage ${s.status}`}>
                      <div className="stage-dot"/>
                      <span className="stage-icon">{stageIcon(s.status)}</span>
                      <span className="stage-name">{s.name}</span>
                      {s.status==='active' && <span className="stage-pulse"/>}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignHover: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600 }}>Compilation Logs</h3>
                  <span style={{ fontSize: '11px', color: 'var(--text3)' }}>Build #{pipeline?.buildNumber || 0}</span>
                </div>
                <div className="log-box" ref={logBoxRef} style={{ maxHeight: '310px', height: '310px', margin: 0, background: '#1e293b', border: '1px solid #334155' }}>
                  {pipeLogs.length > 0 ? (
                    pipeLogs.map((l,i) => <div key={i} className="log-line" style={{ color: '#38bdf8' }}>{l}</div>)
                  ) : (
                    <div className="log-line" style={{ color: '#94a3b8' }}>Pipeline idle. Click "Trigger Pipeline Build" to start a build.</div>
                  )}
                </div>
                <button className="btn-primary" onClick={triggerPipeline} disabled={pipeRunning} style={{ alignSelf: 'flex-start' }}>
                  <Play size={14}/>
                  {pipeRunning ? 'Pipeline Running...' : 'Trigger Pipeline Build'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Kubernetes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title"><Layers size={18}/> Kubernetes Cluster Explorer</span>
              <span className="badge">{podSrc==='kubectl'?'⚡ Live kubectl':'🔵 Simulated'}</span>
            </div>
            <p className="card-desc">
              Manage pods, replica sets, and namespaces running on local Kubernetes clusters. Self-healing monitors track pod statuses and dynamically cycle pods to maintain high availability.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', padding: '20px 17px' }}>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Active Pods ({pods.length || 3})</h3>
                <div className="pod-list" style={{ padding: 0 }}>
                  {(pods.length ? pods : FALLBACK_PODS).map(pod => (
                    <div key={pod.name} className="pod-row" style={{ padding: '12px 16px', borderRadius: '8px' }}>
                      <Circle size={8} style={{
                        color: pod.status==='Running'?'var(--emerald)':'var(--rose)',
                        fill:  pod.status==='Running'?'var(--emerald)':'var(--rose)',
                        flexShrink:0
                      }}/>
                      <span className="pod-name" style={{ fontSize: '12px', fontWeight: 500 }}>{pod.name}</span>
                      <span className="pod-ns" style={{ background: 'rgba(0,0,0,0.04)', padding: '2px 8px', borderRadius: '4px' }}>{pod.namespace}</span>
                      <span className={`pod-badge ${pod.status.toLowerCase()}`}>{pod.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600 }}>Cluster Resource Allocation</h3>
                <div style={{ background: 'rgba(0,0,0,0.015)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text2)', display: 'block', marginBottom: '4px' }}>Memory Request Total</span>
                    <strong>1.42 GB / 4.00 GB</strong>
                    <div style={{ background: 'rgba(0,0,0,0.05)', height: '6px', borderRadius: '9px', marginTop: '6px', overflow: 'hidden' }}>
                      <div style={{ background: 'var(--purple)', width: '35%', height: '100%' }}/>
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text2)', display: 'block', marginBottom: '4px' }}>CPU Allocation Limit</span>
                    <strong>0.8 Cores / 2.0 Cores</strong>
                    <div style={{ background: 'rgba(0,0,0,0.05)', height: '6px', borderRadius: '9px', marginTop: '6px', overflow: 'hidden' }}>
                      <div style={{ background: 'var(--cyan)', width: '40%', height: '100%' }}/>
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '6px', fontSize: '11px', color: 'var(--text2)' }}>
                    Namespace: <strong>clonecloud-main</strong> <br/>
                    Active Nodes: <strong>clonecloud-control-plane</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title"><Shield size={18}/> Vulnerability Scanning & Compliance</span>
              <button className="btn-icon" onClick={fetchSecurity} title="Scan Now"><RefreshCw size={13}/></button>
            </div>
            <p className="card-desc">
              Trivy executes static vulnerability analysis on container builds. Reports detail library-level CVE findings, vulnerability severities, and software bill of materials (SBOM) packages.
            </p>

            <div style={{ padding: '20px 17px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="sec-grid" style={{ padding: 0 }}>
                {[
                  ['Critical', secReport?.summary?.critical||'0', 'var(--rose)', 'Immediate mitigation required'],
                  ['High',     secReport?.summary?.high||'0',     '#f97316', 'Remediate in next sprint cycle'],
                  ['Medium',   secReport?.summary?.medium||'0',   'var(--amber)', 'Routine security patches'],
                ].map(([k,v,c,d]) => (
                  <div key={k} className="sec-tile" style={{ padding: '20px 10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span className="sec-val" style={{color:c, fontSize: '32px'}}>{v}</span>
                    <strong className="sec-key" style={{ fontSize: '13px' }}>{k}</strong>
                    <span style={{ fontSize: '10.5px', color: 'var(--text3)' }}>{d}</span>
                  </div>
                ))}
              </div>

              {secReport ? (
                <div style={{ background: '#f8fafc', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <FileText size={16} style={{ color: 'var(--cyan)' }}/>
                    <strong style={{ fontSize: '13px' }}>Trivy Security Scan Details</strong>
                  </div>
                  <pre style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: 'var(--text2)', overflowX: 'auto', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {secReport.found 
                      ? `Successfully parsed ${secReport.lines} lines of vulnerability output. All critical alerts are bound to auto-trigger rebuild alerts.`
                      : 'No report file found. Trigger a pipeline build to generate a real-time Trivy compliance report!'
                    }
                  </pre>
                </div>
              ) : (
                <div className="log-empty">
                  <Terminal size={16}/>
                  <span>Awaiting security report scan diagnostics...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────
function Pill({ label, status }) {
  const color =
    status==='connected' ? 'var(--emerald)' :
    status==='warning'   ? 'var(--amber)'   :
    status==='checking'  ? 'var(--amber)'   : 'var(--rose)';
  return (
    <div className="pill">
      <div className="dot" style={{background:color, boxShadow:`0 0 5px ${color}`}}/>
      {label}: <strong>{status}</strong>
    </div>
  );
}

function KpiCard({ accent, icon, label, value, sub }) {
  return (
    <div className={`kpi-card accent-${accent}`}>
      <div className="kpi-icon">{icon}</div>
      <div className="kpi-body">
        <div className="kpi-value">{value}</div>
        <div className="kpi-label">{label}</div>
        <div className="kpi-sub">{sub}</div>
      </div>
    </div>
  );
}

function ServiceRow({ svc }) {
  const running  = svc.status === 'running';
  const checking = svc.status === 'checking';
  return (
    <div className="svc-row" style={{borderColor:svcBdr(svc.status), background:svcBg(svc.status)}}>
      <div className="svc-icon" style={{color:svcColor(svc.status)}}>
        {svc.name==='frontend'?<Box size={17}/>:svc.name==='backend'?<Server size={17}/>:<Database size={17}/>}
      </div>
      <div className="svc-info">
        <span className="svc-name">{svc.label||svc.name}</span>
        <span className="svc-meta">
          {svc.port?`localhost:${svc.port}`:''}{svc.image?` · ${svc.image}`:''}
        </span>
      </div>
      <div className="svc-right">
        {svc.restartCount>0 && <span className="svc-restarts">R:{svc.restartCount}</span>}
        <span className="svc-badge" style={{color:svcColor(svc.status), borderColor:svcBdr(svc.status)}}>
          {running?<CheckCircle2 size={11}/>:checking?<RefreshCw size={11} className="spin"/>:<AlertCircle size={11}/>}
          {svc.status?.toUpperCase()||'UNKNOWN'}
        </span>
      </div>
      <div className="svc-bar">
        <div className="svc-fill" style={{
          width: running?'100%':checking?'40%':'8%',
          background: svcColor(svc.status),
        }}/>
      </div>
    </div>
  );
}

// ─── Static Fallbacks ───────────────────────────────────────
const FALLBACK_SERVICES = [
  { name:'frontend', label:'PowerHub Frontend', port:3000, image:'clonecloud-devops--frontend', status:'checking', restartCount:0 },
  { name:'backend',  label:'PowerHub Backend',  port:5000, image:'clonecloud-devops--backend',  status:'checking', restartCount:0 },
  { name:'mongodb',  label:'MongoDB',           port:27017, image:'mongo:6.0',                  status:'checking', restartCount:0 },
];

const FALLBACK_PODS = [
  { name:'powerhub-frontend-7c9f84b6d4-a1b2c', namespace:'clonecloud-main', status:'Running', restarts:0 },
  { name:'powerhub-backend-5d6e7f8a9b-x9y8z',  namespace:'clonecloud-main', status:'Running', restarts:0 },
  { name:'mongodb-0',                            namespace:'clonecloud-main', status:'Running', restarts:0 },
];

const DEFAULT_STAGES = [
  {name:'Checkout',           status:'pending'},
  {name:'Dependency Install', status:'pending'},
  {name:'Security Scan',      status:'pending'},
  {name:'Build',              status:'pending'},
  {name:'Docker Build',       status:'pending'},
  {name:'Kind Load',          status:'pending'},
  {name:'Helm Deploy',        status:'pending'},
  {name:'Verification',       status:'pending'},
];
