import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Dumbbell, ScanLine, UtensilsCrossed, TrendingUp, LogOut, User } from 'lucide-react';
import { motion } from 'motion/react';
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

const navItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/workouts', label: 'Workouts', icon: Dumbbell },
    { path: '/scan', label: 'Scan Food', icon: ScanLine },
    { path: '/diet/dashboard', label: 'Diet Planner', icon: UtensilsCrossed },
    { path: '/workouts/dashboard', label: 'Progress', icon: TrendingUp },
];

export function Navigation() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useContext(AuthContext);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    if (!user) {
        return (
            <nav className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-xl border-b border-border supports-[backdrop-filter]:bg-background/40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <Link to="/" className="flex items-center space-x-3 group">
                            <div className="relative w-10 h-10 flex items-center justify-center">
                                <div className="absolute inset-0 bg-primary/20 rounded-xl blur-lg group-hover:blur-xl transition-all duration-300" />
                                <div className="relative w-full h-full rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center border border-border group-hover:scale-110 transition-transform duration-300">
                                    <Dumbbell className="w-5 h-5 text-black" />
                                </div>
                            </div>
                            <span className="text-2xl font-bold text-foreground tracking-tight">
                                Power<span className="text-primary">Hub</span>
                            </span>
                        </Link>
                        <div className="flex items-center space-x-4">
                            <Link to="/login" className="text-muted-foreground hover:text-foreground font-medium transition-colors">
                                Log In
                            </Link>
                            <Link to="/register" className="bg-primary text-black px-4 py-2 rounded-lg font-bold hover:bg-primary/90 transition-colors">
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>
        );
    }

    return (
        <>
            {/* Desktop Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-xl border-b border-border supports-[backdrop-filter]:bg-background/40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo */}
                        <Link to="/" className="flex items-center space-x-3 group">
                            <div className="relative w-10 h-10 flex items-center justify-center">
                                <div className="absolute inset-0 bg-primary/20 rounded-xl blur-lg group-hover:blur-xl transition-all duration-300" />
                                <div className="relative w-full h-full rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center border border-border group-hover:scale-110 transition-transform duration-300">
                                    <Dumbbell className="w-5 h-5 text-black" />
                                </div>
                            </div>
                            <span className="text-2xl font-bold text-foreground tracking-tight">
                                Power<span className="text-primary">Hub</span>
                            </span>
                        </Link>

                        {/* Desktop Menu */}
                        <div className="hidden md:flex items-center space-x-2">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.path;

                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className="relative px-4 py-2 group"
                                    >
                                        <div className={`absolute inset-0 bg-muted rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${isActive ? 'opacity-100 bg-muted' : ''}`} />

                                        <div className="relative flex items-center space-x-2">
                                            <Icon className={`w-4 h-4 transition-colors duration-300 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                                            <span className={`text-sm font-medium transition-colors duration-300 ${isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
                                                {item.label}
                                            </span>
                                        </div>

                                        {isActive && (
                                            <motion.div
                                                layoutId="activeTab"
                                                className="absolute -bottom-[26px] left-0 right-0 h-[2px] bg-primary shadow-[0_0_10px_rgba(204,255,0,0.5)]"
                                                initial={false}
                                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                            />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>

                        {/* User Profile */}
                        <div className="hidden md:flex items-center space-x-4 pl-6 border-l border-border">
                            <div className="text-right">
                                <p className="text-sm font-bold text-foreground leading-none mb-1">{user.name}</p>
                                <p className="text-xs text-primary font-medium tracking-wide">MEMBER</p>
                            </div>
                            <div className="relative cursor-pointer group">
                                <div className="absolute inset-0 bg-primary/20 rounded-full blur-md group-hover:blur-lg transition-all duration-300" />
                                <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-muted to-muted/80 border border-border flex items-center justify-center text-foreground font-bold group-hover:border-primary/50 transition-colors">
                                    <User className="w-5 h-5" />
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                title="Logout"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border pb-safe">
                <div className="flex items-center justify-around py-3 px-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className="relative flex flex-col items-center p-2"
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="mobileActive"
                                        className="absolute inset-0 bg-muted rounded-xl"
                                        initial={false}
                                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                    />
                                )}
                                <Icon className={`w-6 h-6 mb-1 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                                <span className={`text-[10px] font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                    <button
                        onClick={handleLogout}
                        className="relative flex flex-col items-center p-2"
                    >
                        <LogOut className="w-6 h-6 mb-1 text-muted-foreground" />
                        <span className="text-[10px] font-medium text-muted-foreground">
                            Logout
                        </span>
                    </button>
                </div>
            </nav>
        </>
    );
}
