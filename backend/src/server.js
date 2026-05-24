const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const client = require('prom-client');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/clonecloud';

// Middleware
app.use(cors());
app.use(express.json());

// Prometheus Metrics Setup
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ register: client.register });

// Custom Prometheus Metrics
const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in microseconds',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const taskCounter = new client.Counter({
  name: 'clonecloud_tasks_created_total',
  help: 'Total number of tasks created in the system'
});

const taskDeletionCounter = new client.Counter({
  name: 'clonecloud_tasks_deleted_total',
  help: 'Total number of tasks deleted in the system'
});

// Middleware to measure request duration
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    httpRequestDurationMicroseconds
      .labels(req.method, route, res.statusCode)
      .observe(duration);
  });
  next();
});

// Schema definition
const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['Todo', 'In Progress', 'Done'], default: 'Todo' },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  createdAt: { type: Date, default: Date.now }
});

const Task = mongoose.model('Task', taskSchema);

// Database Connection
let dbStatus = 'Disconnected';
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('MongoDB Connected Successfully');
    dbStatus = 'Connected';
    
    // Seed initial tasks if MongoDB collection is empty
    try {
      const taskCount = await Task.countDocuments();
      if (taskCount === 0) {
        console.log('Seeding initial tasks into database...');
        await Task.insertMany([
          {
            title: 'Initialize CloneCloud Repository',
            description: 'Set up directory structure, React frontend, Express backend, and Helm configs.',
            status: 'Done',
            priority: 'High'
          },
          {
            title: 'Configure Kubernetes Cluster',
            description: 'Prepare K8s namespaces, secrets, and Helm values.',
            status: 'In Progress',
            priority: 'Medium'
          },
          {
            title: 'Integrate Prometheus & Grafana Monitoring',
            description: 'Deploy Prometheus server and configure Grafana dashboards.',
            status: 'Todo',
            priority: 'Low'
          }
        ]);
        console.log('Database seeded successfully.');
      }
    } catch (seedErr) {
      console.error('Database seeding failed:', seedErr.message);
    }
  })
  .catch((err) => {
    console.error('MongoDB Connection Error:', err.message);
    dbStatus = 'Error';
  });

// Fallback task store in-memory in case MongoDB is down (improves robustness for demos)
let localTasks = [
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
];

// Helper to determine if DB is active
const isDbConnected = () => mongoose.connection.readyState === 1;

// REST API Routes
// GET /api/tasks
app.get('/api/tasks', async (req, res) => {
  try {
    if (isDbConnected()) {
      const tasks = await Task.find().sort({ createdAt: -1 });
      return res.json(tasks);
    } else {
      return res.json(localTasks);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/tasks
app.post('/api/tasks', async (req, res) => {
  const { title, description, status, priority } = req.body;
  try {
    taskCounter.inc();
    if (isDbConnected()) {
      const newTask = new Task({ title, description, status, priority });
      const savedTask = await newTask.save();
      return res.status(201).json(savedTask);
    } else {
      const newTask = {
        _id: 'local-' + Date.now(),
        title,
        description,
        status: status || 'Todo',
        priority: priority || 'Medium',
        createdAt: new Date()
      };
      localTasks.unshift(newTask);
      return res.status(201).json(newTask);
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/tasks/:id
app.delete('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  try {
    taskDeletionCounter.inc();
    if (isDbConnected() && !id.startsWith('local-')) {
      const deletedTask = await Task.findByIdAndDelete(id);
      if (!deletedTask) {
        return res.status(404).json({ error: 'Task not found' });
      }
      return res.json({ message: 'Task deleted successfully', task: deletedTask });
    } else {
      const initialLength = localTasks.length;
      localTasks = localTasks.filter(task => task._id !== id);
      if (localTasks.length === initialLength) {
        return res.status(404).json({ error: 'Task not found' });
      }
      return res.json({ message: 'Task deleted successfully' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/tasks/:id (to update status/priority/details)
app.patch('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    if (isDbConnected() && !id.startsWith('local-')) {
      const updatedTask = await Task.findByIdAndUpdate(id, updates, { new: true });
      if (!updatedTask) return res.status(404).json({ error: 'Task not found' });
      return res.json(updatedTask);
    } else {
      const index = localTasks.findIndex(task => task._id === id);
      if (index === -1) return res.status(404).json({ error: 'Task not found' });
      localTasks[index] = { ...localTasks[index], ...updates };
      return res.json(localTasks[index]);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  const dbState = isDbConnected() ? 'Connected' : dbStatus;
  res.json({
    status: 'UP',
    timestamp: new Date(),
    mongodb: dbState,
    uptime: process.uptime()
  });
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
