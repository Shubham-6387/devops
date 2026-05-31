import { useEffect, useState } from "react";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  RadialLinearScale
} from 'chart.js';
import { Doughnut, Line, Bar, Radar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function DietDashboard() {
  const [diet, setDiet] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const token = user ? user.token : null;
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const [dietRes, analyticsRes] = await Promise.all([
          axios.get("/api/diet/summary", config),
          axios.get("/api/diet/analytics", config)
        ]);

        setDiet(dietRes.data);
        setAnalytics(analyticsRes.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Failed to load dashboard data.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const saveToHistory = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      await axios.post("/api/diet/save", diet, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      alert("Diet Plan saved to History!");
    } catch (err) {
      console.error(err);
      alert("Failed to save diet plan.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-10 p-6 bg-red-50 border border-red-200 rounded-lg text-center">
        <h3 className="text-xl font-bold text-red-700 mb-2">Oops! Something went wrong</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  // --- CHART CONFIGURATIONS (THEMED) ---

  const commonChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#e5e7eb' } },
      title: { color: '#e5e7eb' }
    },
    scales: {
      x: { ticks: { color: '#64748b' }, grid: { color: '#e2e8f0' } },
      y: { ticks: { color: '#64748b' }, grid: { color: '#e2e8f0' } }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: { labels: { color: '#0f172a' } }
    }
  }

  // 1. Calorie Trend (Line Chart)
  const calorieTrendData = {
    labels: analytics.dailyTrend.labels,
    datasets: [
      {
        label: 'Calories Consumed',
        data: analytics.dailyTrend.calorieData,
        borderColor: '#7000FF', // Neon Purple
        pointBackgroundColor: '#000',
        pointBorderColor: '#7000FF',
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(112, 0, 255, 0.4)');
          gradient.addColorStop(1, 'rgba(112, 0, 255, 0.0)');
          return gradient;
        },
        tension: 0.4,
        fill: true
      },
      {
        label: 'Daily Goal',
        data: analytics.dailyTrend.labels.map(() => diet.calories),
        borderColor: '#ffffff', // White
        borderDash: [5, 5],
        tension: 0,
        pointRadius: 0
      }
    ]
  };

  // 2. Weekly Macro Stack (Bar Chart)
  const macroStackData = {
    labels: analytics.weeklyMacros.map(m => m.day),
    datasets: [
      {
        label: 'Protein',
        data: analytics.weeklyMacros.map(m => m.protein),
        backgroundColor: '#CCFF00', // Neon Lime
        borderRadius: 4,
      },
      {
        label: 'Carbs',
        data: analytics.weeklyMacros.map(m => m.carbs),
        backgroundColor: '#ffffff', // White
        borderRadius: 4,
      },
      {
        label: 'Fats',
        data: analytics.weeklyMacros.map(m => m.fats),
        backgroundColor: '#00F0FF', // Neon Cyan
        borderRadius: 4,
      },
    ]
  };

  // 3. Health Score History (Line Chart)
  const healthTrendData = {
    labels: analytics.dailyTrend.labels,
    datasets: [
      {
        label: 'Health Score',
        data: analytics.dailyTrend.healthScoreData,
        borderColor: '#00F0FF', // Neon Cyan
        pointBackgroundColor: '#000',
        pointBorderColor: '#00F0FF',
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(0, 240, 255, 0.4)');
          gradient.addColorStop(1, 'rgba(0, 240, 255, 0.0)');
          return gradient;
        },
        tension: 0.4,
        fill: true
      }
    ]
  };

  // 4. Food Quality (Doughnut)
  const qualityData = {
    labels: ['Healthy', 'Moderate', 'Unhealthy'],
    datasets: [{
      data: [
        analytics.foodQuality.healthy,
        analytics.foodQuality.moderate,
        analytics.foodQuality.unhealthy
      ],
      backgroundColor: ['#CCFF00', '#f59e0b', '#FF003C'], // Lime, Amber, Neon Red
      borderWidth: 0
    }]
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-card backdrop-blur-xl border border-border p-8 rounded-3xl shadow-2xl">
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tight mb-2">AI & Analytics Dashboard</h1>
          <p className="text-muted-foreground">Real-time insights tailored to your metabolism.</p>
        </div>
        <div className="mt-6 md:mt-0 flex gap-3">
          <button
            onClick={saveToHistory}
            className="bg-primary text-black px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition shadow-[0_0_15px_rgba(204,255,0,0.3)] flex items-center gap-2 transform hover:scale-105 duration-200"
          >
            Save New Plan
          </button>
        </div>
      </div>

      {/* Insights Panel */}
      {analytics.insights.length > 0 && (
        <div className="grid gap-4 mb-8">
          {analytics.insights.map((insight, idx) => (
            <div key={idx} className={`p-4 rounded-xl border-l-4 flex items-center shadow-lg bg-card border border-white/10 backdrop-blur-md ${insight.type === 'success' ? 'border-l-primary text-gray-200' : 'border-l-amber-500 text-gray-200'}`}>
              <p className="font-medium text-lg">{insight.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ROW 1: Trend & Macros */}
        <div className="lg:col-span-2 bg-card backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-border">
          <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-3">
            Calorie Trend (Last 7 Days)
          </h3>
          <div className="h-64">
            <Line data={calorieTrendData} options={commonChartOptions} />
          </div>
        </div>

        <div className="bg-card backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-border">
          <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-3">
            Food Quality
          </h3>
          <div className="h-64 flex justify-center">
            <Doughnut data={qualityData} options={doughnutOptions} />
          </div>
          <div className="text-center mt-6">
            <p className="text-muted-foreground text-sm font-mono">Based on your recent scans</p>
          </div>
        </div>

        {/* ROW 2: Macro Stack & Health Score */}
        <div className="bg-card backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-border">
          <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-3">
            Weekly Macros
          </h3>
          <div className="h-64">
            <Bar data={macroStackData} options={{ ...commonChartOptions, scales: { x: { ...commonChartOptions.scales.x, stacked: true }, y: { ...commonChartOptions.scales.y, stacked: true } } }} />
          </div>
        </div>

        <div className="lg:col-span-2 bg-card backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-border">
          <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-3">
            Health Score History
          </h3>
          <div className="h-64">
            <Line data={healthTrendData} options={commonChartOptions} />
          </div>
        </div>

        {/* ROW 3: Consistency & Targets */}
        <div className="bg-card backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-border flex flex-col items-center justify-center text-center">
          <h3 className="text-xl font-bold text-foreground mb-4">Consistency Score</h3>
          <div className="relative w-40 h-40 flex items-center justify-center my-4">
            <svg className="w-full h-full transform -rotate-90 drop-shadow-[0_0_10px_rgba(112,0,255,0.5)]">
              <circle cx="80" cy="80" r="70" stroke="#e2e8f0" strokeWidth="15" fill="none" />
              <circle cx="80" cy="80" r="70" stroke="#7000FF" strokeWidth="15" fill="none" strokeDasharray={`${(analytics.consistencyScore / 100) * 440} 440`} strokeLinecap="round" />
            </svg>
            <span className="absolute text-3xl font-black text-accent">{analytics.consistencyScore}%</span>
          </div>
          <p className="text-muted-foreground text-sm mt-2">Keep logging to improve!</p>
        </div>

        <div className="lg:col-span-2 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border border-border p-8 rounded-3xl shadow-xl backdrop-blur-md">
          <h3 className="text-2xl font-black text-foreground mb-8 text-center tracking-tight">Today's Target Overview</h3>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div className="bg-muted border border-border p-6 rounded-2xl hover:bg-muted/80 transition-colors">
              <p className="text-primary font-bold mb-2 uppercase tracking-widest text-sm">Protein</p>
              <p className="text-4xl font-black text-foreground">{diet.macros.protein.grams}<span className="text-lg text-muted-foreground font-medium lowercase">g</span></p>
            </div>
            <div className="bg-muted border border-border p-6 rounded-2xl hover:bg-muted/80 transition-colors">
              <p className="text-foreground font-bold mb-2 uppercase tracking-widest text-sm">Carbs</p>
              <p className="text-4xl font-black text-foreground">{diet.macros.carbs.grams}<span className="text-lg text-muted-foreground font-medium lowercase">g</span></p>
            </div>
            <div className="bg-muted border border-border p-6 rounded-2xl hover:bg-muted/80 transition-colors">
              <p className="text-secondary font-bold mb-2 uppercase tracking-widest text-sm">Fats</p>
              <p className="text-4xl font-black text-foreground">{diet.macros.fats.grams}<span className="text-lg text-muted-foreground font-medium lowercase">g</span></p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
} 
