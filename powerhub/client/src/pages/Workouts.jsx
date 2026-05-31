import React from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, User, BookOpen, Calendar, TrendingUp, NotebookPen, PlayCircle } from 'lucide-react';

const Workouts = () => {
    const modules = [
        {
            title: 'Start Workout',
            description: 'Begin your daily workout session with guided exercises and timers.',
            icon: PlayCircle,
            link: '/workouts/session',
            color: 'from-primary to-lime-500',
            shadow: 'shadow-primary/20',
            iconColor: 'text-primary'
        },
        {
            title: 'My Profile',
            description: 'Update your fitness goals, experience level, and available equipment.',
            icon: User,
            link: '/workouts/profile',
            color: 'from-blue-400 to-cyan-500',
            shadow: 'shadow-cyan-500/20',
            iconColor: 'text-cyan-400'
        },
        {
            title: 'Exercise Library',
            description: 'Browse hundreds of exercises with animated instructions and tips.',
            icon: BookOpen,
            link: '/workouts/exercises',
            color: 'from-purple-400 to-pink-500',
            shadow: 'shadow-purple-500/20',
            iconColor: 'text-purple-400'
        },
        {
            title: 'Weekly Planner',
            description: 'Plan your workouts for the week and manage rest days.',
            icon: Calendar,
            link: '/workouts/planner',
            color: 'from-yellow-400 to-orange-500',
            shadow: 'shadow-yellow-500/20',
            iconColor: 'text-yellow-400'
        },
        {
            title: 'Progress Dashboard',
            description: 'Track your consistency, calories burned, and strength progress.',
            icon: TrendingUp,
            link: '/workouts/dashboard',
            color: 'from-red-400 to-rose-500',
            shadow: 'shadow-red-500/20',
            iconColor: 'text-red-400'
        },
        {
            title: 'Notes & Reminders',
            description: 'Keep track of your thoughts, tasks, and workout reminders.',
            icon: NotebookPen,
            link: '/workouts/notes',
            color: 'from-indigo-400 to-violet-500',
            shadow: 'shadow-indigo-500/20',
            iconColor: 'text-indigo-400'
        }
    ];

    return (
        <div className="container mx-auto p-6 pb-24 min-h-screen">
            <div className="text-center mb-16 space-y-4">
                <h1 className="text-5xl md:text-6xl font-black text-foreground tracking-tighter">
                    Workout <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Management</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Your command center for fitness. Track, plan, and execute your goals with precision.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {modules.map((mod, index) => {
                    const Icon = mod.icon;
                    return (
                        <Link
                            key={index}
                            to={mod.link}
                            className={`group relative overflow-hidden rounded-[2.5rem] bg-card/50 backdrop-blur-xl border border-border p-1 hover:border-transparent transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 ${mod.shadow}`}
                        >
                            {/* Hover Gradient Border */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${mod.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                            {/* Inner Card */}
                            <div className="relative h-full bg-card/90 backdrop-blur-2xl rounded-[2.3rem] p-8 flex flex-col justify-between overflow-hidden">
                                {/* Decorative Blur Blob */}
                                <div className={`absolute -right-10 -top-10 w-40 h-40 bg-gradient-to-br ${mod.color} opacity-5 blur-3xl group-hover:opacity-20 transition-opacity duration-500`} />

                                <div>
                                    <div className={`w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-6 border border-border group-hover:scale-110 transition-transform duration-500 group-hover:bg-gradient-to-br ${mod.color}`}>
                                        <Icon className={`w-8 h-8 ${mod.iconColor} group-hover:text-black transition-colors duration-500`} strokeWidth={2.5} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-foreground mb-3 tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-br group-hover:from-foreground group-hover:to-muted-foreground transition-all">
                                        {mod.title}
                                    </h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed font-medium">
                                        {mod.description}
                                    </p>
                                </div>


                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

export default Workouts;
