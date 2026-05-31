import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navigation } from './components/Navigation';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Workouts from './pages/Workouts';
import ScanFood from './pages/ScanFood';
import History from './pages/History';
import ProtectedRoute from './components/ProtectedRoute';
import WorkoutProfile from './pages/WorkoutProfile';
import ExerciseLibrary from './pages/ExerciseLibrary';
import WorkoutSession from './pages/WorkoutSession';
import WeeklyPlanner from './pages/WeeklyPlanner';
import ProgressDashboard from './pages/ProgressDashboard';
import NotesReminders from './pages/NotesReminders';
import DietDashboard from './pages/DietDashboard';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-background font-sans text-foreground">
          <Navigation />
          <div className="pt-16">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/workouts" element={<Workouts />} />

              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/scan" element={<ScanFood />} />
                <Route path="/scan/history" element={<History />} />

                {/* Workout Module Routes */}
                <Route path="/workouts/profile" element={<WorkoutProfile />} />
                <Route path="/workouts/exercises" element={<ExerciseLibrary />} />
                <Route path="/workouts/session" element={<WorkoutSession />} />
                <Route path="/workouts/planner" element={<WeeklyPlanner />} />
                <Route path="/workouts/dashboard" element={<ProgressDashboard />} />
                <Route path="/workouts/notes" element={<NotesReminders />} />
                <Route path="/diet/dashboard" element={<DietDashboard />} />
              </Route>
            </Routes>
          </div>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
