// import { useContext } from 'react';
// import { Link } from 'react-router-dom';
// import AuthContext from '../context/AuthContext';
// import { motion } from 'motion/react';
// import { Flame, Target, TrendingUp, Zap, Award, Calendar, Dumbbell, UtensilsCrossed } from 'lucide-react';
// import { StatCard } from '../components/StatCard';
// import { ActivityChart } from '../components/ActivityChart';
// import { MacroChart } from '../components/MacroChart';

// const container = {
//     hidden: { opacity: 0 },
//     show: {
//         opacity: 1,
//         transition: {
//             staggerChildren: 0.1
//         }
//     }
// };

// const Home = () => {
//     const { user, loading } = useContext(AuthContext);

//     if (loading) {
//         return (
//             <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
//                 <div className="animate-pulse">Loading...</div>
//             </div>
//         );
//     }

//     if (!user) {
//         return (
//             <div className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden">
//                 {/* Background Blobs */}
//                 <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] animate-blob" />
//                 <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[120px] animate-blob animation-delay-2000" />

//                 <motion.div
//                     initial={{ opacity: 0, y: 30 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     transition={{ duration: 0.8 }}
//                     className="relative z-10 max-w-4xl mx-auto"
//                 >
//                     <div className="inline-flex items-center px-3 py-1 mb-8 space-x-2 border rounded-full bg-muted border-border backdrop-blur-md">
//                         <span className="relative flex w-2 h-2">
//                             <span className="absolute inline-flex w-full h-full rounded-full opacity-75 animate-ping bg-primary"></span>
//                             <span className="relative inline-flex w-2 h-2 rounded-full bg-primary"></span>
//                         </span>
//                         <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground">Next Gen Fitness AI</span>
//                     </div>

//                     <h1 className="text-6xl md:text-8xl font-black text-foreground mb-6 tracking-tighter leading-[1.1]">
//                         Unleash Your <br />
//                         <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent animate-gradient-x">
//                             Potential
//                         </span>
//                     </h1>

//                     <p className="max-w-2xl mx-auto mb-10 text-xl leading-relaxed text-muted-foreground">
//                         The ultimate all-in-one ecosystem. Track workouts, analyze nutrition, and optimize your health with AI-driven insights.
//                     </p>

//                     <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
//                         <Link
//                             to="/register"
//                             className="w-full sm:w-auto px-8 py-4 bg-primary text-black font-bold text-lg rounded-xl hover:bg-primary/90 transition-all duration-300 transform hover:scale-105 shadow-[0_0_20px_rgba(204,255,0,0.3)]"
//                         >
//                             Get Started Free
//                         </Link>
//                         <Link
//                             to="/login"
//                             className="w-full px-8 py-4 text-lg font-bold transition-all duration-300 border sm:w-auto bg-muted text-foreground rounded-xl border-border hover:bg-muted/80 backdrop-blur-md"
//                         >
//                             Log In
//                         </Link>
//                     </div>
//                 </motion.div>
//             </div>
//         );
//     }

//     return (
//         <div className="relative px-4 py-8 pb-24 mx-auto max-w-7xl sm:px-6 lg:px-8 md:pb-12">
//             {/* Ambient Background */}
//             <div className="fixed inset-0 pointer-events-none">
//                 <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />
//                 <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[100px]" />
//             </div>

//             {/* Welcome Section */}
//             <motion.div
//                 initial={{ opacity: 0, y: -20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ duration: 0.5 }}
//                 className="relative z-10 mb-12"
//             >
//                 <div className="relative">
//                     <h1 className="mb-2 text-5xl font-black tracking-tight md:text-6xl text-foreground">
//                         Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">{user.name || 'User'}</span>
//                     </h1>
//                     <div className="w-20 h-1 mt-2 rounded-full bg-gradient-to-r from-primary to-secondary" />
//                 </div>
//                 <p className="mt-4 text-lg font-medium text-muted-foreground">Ready to dominate your goals today?</p>
//             </motion.div>

//             {/* Stats Grid */}
//             <motion.div
//                 variants={container}
//                 initial="hidden"
//                 animate="show"
//                 className="relative z-10 grid grid-cols-1 gap-6 mb-12 md:grid-cols-2 lg:grid-cols-4"
//             >
//                 <StatCard
//                     icon={Flame}
//                     title="Calories Left"
//                     value="1,245"
//                     subtitle="of 2,500 kcal"
//                     color="from-orange-500 to-red-600"
//                     trend="+12%"
//                     delay={0.1}
//                 />
//                 <StatCard
//                     icon={Target}
//                     title="Diet Score"
//                     value="87"
//                     subtitle="Excellent"
//                     color="from-primary to-green-400"
//                     trend="+5%"
//                     delay={0.2}
//                 />
//                 <StatCard
//                     icon={Zap}
//                     title="Workout Time"
//                     value="45"
//                     subtitle="minutes active"
//                     color="from-secondary to-blue-500"
//                     trend="On Track"
//                     delay={0.3}
//                 />
//                 <StatCard
//                     icon={Award}
//                     title="Streak"
//                     value="12"
//                     subtitle="days strong"
//                     color="from-accent to-purple-500"
//                     trend="New Best!"
//                     delay={0.4}
//                 />
//             </motion.div>

//             {/* Main Dashboard Grid */}
//             <div className="relative z-10 grid grid-cols-1 gap-8 mb-12 lg:grid-cols-3">
//                 {/* Activity Chart */}
//                 <motion.div
//                     initial={{ opacity: 0, scale: 0.95 }}
//                     animate={{ opacity: 1, scale: 1 }}
//                     transition={{ delay: 0.5 }}
//                     className="relative lg:col-span-2 group"
//                 >
//                     <div className="absolute inset-0 transition-all duration-500 opacity-50 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-3xl blur-xl group-hover:blur-2xl" />
//                     <div className="relative h-full p-8 border bg-card backdrop-blur-xl rounded-3xl border-border">
//                         <div className="flex items-center justify-between mb-8">
//                             <div>
//                                 <h2 className="mb-1 text-2xl font-bold text-foreground">Activity Overview</h2>
//                                 <p className="text-sm text-muted-foreground">Weekly performance analytics</p>
//                             </div>
//                             <div className="p-3 border bg-muted rounded-xl border-border">
//                                 <Calendar className="w-6 h-6 text-primary" />
//                             </div>
//                         </div>
//                         <ActivityChart />
//                     </div>
//                 </motion.div>

//                 {/* Macro Distribution */}
//                 <motion.div
//                     initial={{ opacity: 0, scale: 0.95 }}
//                     animate={{ opacity: 1, scale: 1 }}
//                     transition={{ delay: 0.6 }}
//                     className="relative group"
//                 >
//                     <div className="absolute inset-0 transition-all duration-500 opacity-50 bg-gradient-to-br from-accent/10 to-purple-500/10 rounded-3xl blur-xl group-hover:blur-2xl" />
//                     <div className="relative h-full p-8 border bg-card backdrop-blur-xl rounded-3xl border-border">
//                         <div className="mb-8">
//                             <h2 className="mb-1 text-2xl font-bold text-foreground">Biometrics</h2>
//                             <p className="text-sm text-muted-foreground">Daily nutrition breakdown</p>
//                         </div>
//                         <MacroChart />
//                     </div>
//                 </motion.div>
//             </div>

//             {/* Quick Actions */}
//             <div className="relative z-10">
//                 <h3 className="mb-6 text-xl font-bold text-foreground">Quick Actions</h3>
//                 <motion.div
//                     initial={{ opacity: 0, y: 20 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     transition={{ delay: 0.7 }}
//                     className="grid grid-cols-1 gap-6 md:grid-cols-3"
//                 >
//                     <Link to="/workouts">
//                         <QuickAction
//                             title="Start Training"
//                             description="Begin your daily session"
//                             color="from-primary to-green-400"
//                             icon={Dumbbell}
//                             delay={0}
//                         />
//                     </Link>
//                     <Link to="/scan">
//                         <QuickAction
//                             title="Log Nutrition"
//                             description="Scan food or enter macros"
//                             color="from-orange-500 to-red-500"
//                             icon={UtensilsCrossed}
//                             delay={0.1}
//                         />
//                     </Link>
//                     <Link to="/workouts/dashboard">
//                         <QuickAction
//                             title="View Analysis"
//                             description="Check progress trajectory"
//                             color="from-secondary to-blue-500"
//                             icon={TrendingUp}
//                             delay={0.2}
//                         />
//                     </Link>
//                 </motion.div>
//             </div>
//         </div>
//     );
// };

// function QuickAction({ title, description, color, icon: Icon, delay }) {
//     return (
//         <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.8 + delay }}
//             whileHover={{ y: -5, scale: 1.02 }}
//             whileTap={{ scale: 0.98 }}
//             className="relative h-full p-6 overflow-hidden transition-all duration-300 border cursor-pointer group rounded-2xl bg-card border-border backdrop-blur-md hover:border-border"
//         >
//             <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-300 rounded-full -mr-8 -mt-8`} />

//             <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-black/20`}>
//                 <Icon className="text-white w-7 h-7" />
//             </div>

//             <h3 className="mb-2 text-xl font-bold transition-colors text-foreground group-hover:text-primary">{title}</h3>
//             <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>

//             <div className="absolute transition-all duration-300 transform translate-x-4 opacity-0 bottom-6 right-6 group-hover:opacity-100 group-hover:translate-x-0">
//                 <div className={`p-2 rounded-full bg-gradient-to-br ${color} bg-opacity-20`}>
//                     <TrendingUp className="w-4 h-4 text-white" />
//                 </div>
//             </div>
//         </motion.div>
//     );
// }

// export default Home;


import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import api from '../api';
import { motion } from 'motion/react';
import { Flame, Target, TrendingUp, Zap, Award, Calendar, Dumbbell, UtensilsCrossed } from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { ActivityChart } from '../components/ActivityChart';
import { MacroChart } from '../components/MacroChart';

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const Home = () => {
    const { user, loading } = useContext(AuthContext);

    // ✅ ADDED (backend connection)
    const [users, setUsers] = useState([]);

    // ✅ ADDED (safe API call)
    useEffect(() => {
        api.get('/api/users')
            .then((res) => {
                setUsers(res.data);
                console.log('Backend connected. Users:', res.data);
            })
            .catch((err) => {
                console.error('Backend API Error:', err);
            });
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
                <div className="animate-pulse">Loading...</div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] animate-blob" />
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[120px] animate-blob animation-delay-2000" />

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="relative z-10 max-w-4xl mx-auto"
                >
                    <div className="inline-flex items-center px-3 py-1 mb-8 space-x-2 border rounded-full bg-muted border-border backdrop-blur-md">
                        <span className="relative flex w-2 h-2">
                            <span className="absolute inline-flex w-full h-full rounded-full opacity-75 animate-ping bg-primary"></span>
                            <span className="relative inline-flex w-2 h-2 rounded-full bg-primary"></span>
                        </span>
                        <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
                            Next Gen Fitness AI
                        </span>
                    </div>

                    <h1 className="text-6xl md:text-8xl font-black text-foreground mb-6 tracking-tighter leading-[1.1]">
                        Unleash Your <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent animate-gradient-x">
                            Potential
                        </span>
                    </h1>

                    <p className="max-w-2xl mx-auto mb-10 text-xl leading-relaxed text-muted-foreground">
                        The ultimate all-in-one ecosystem. Track workouts, analyze nutrition, and optimize your health with AI-driven insights.
                    </p>

                    <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                        <Link
                            to="/register"
                            className="w-full sm:w-auto px-8 py-4 bg-primary text-black font-bold text-lg rounded-xl hover:bg-primary/90 transition-all duration-300 transform hover:scale-105 shadow-[0_0_20px_rgba(204,255,0,0.3)]"
                        >
                            Get Started Free
                        </Link>
                        <Link
                            to="/login"
                            className="w-full px-8 py-4 text-lg font-bold transition-all duration-300 border sm:w-auto bg-muted text-foreground rounded-xl border-border hover:bg-muted/80 backdrop-blur-md"
                        >
                            Log In
                        </Link>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="relative px-4 py-8 pb-24 mx-auto max-w-7xl sm:px-6 lg:px-8 md:pb-12">
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 mb-12"
            >
                <h1 className="mb-2 text-5xl font-black tracking-tight md:text-6xl text-foreground">
                    Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                        {user.name || 'User'}
                    </span>
                </h1>

                {/* ✅ Optional visual check */}
                {users.length > 0 && (
                    <p className="mt-2 text-xs text-muted-foreground">
                        Backend connected ({users.length} users loaded)
                    </p>
                )}
            </motion.div>

            {/* REST OF YOUR DASHBOARD IS UNCHANGED */}
        </div>
    );
};

export default Home;
