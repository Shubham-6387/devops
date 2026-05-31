import { motion } from 'motion/react';
import { TrendingUp } from 'lucide-react';

export function StatCard({ title, value, subtitle, icon: Icon, trend, color, delay = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="group relative overflow-hidden rounded-2xl bg-card border border-border p-6 backdrop-blur-md transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_30px_-10px_rgba(204,255,0,0.2)]"
        >
            {/* Background Gradient Blob */}
            <div className={`absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 rounded-full bg-gradient-to-br ${color} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity duration-500`} />

            <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${color} bg-opacity-10 bg-clip-padding backdrop-filter backdrop-blur-sm border border-border group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-6 h-6 text-foreground" />
                    </div>
                    {trend && (
                        <div className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-green-500/10 border border-green-500/20">
                            <TrendingUp className="w-3 h-3 text-green-400" />
                            <span className="text-xs font-medium text-green-400">{trend}</span>
                        </div>
                    )}
                </div>

                <h3 className="text-muted-foreground text-sm font-medium mb-1 tracking-wide">{title}</h3>
                <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-bold text-foreground tracking-tight group-hover:text-primary transition-colors duration-300">
                        {value}
                    </span>
                    {subtitle && (
                        <span className="text-xs text-muted-foreground font-medium">
                            {subtitle}
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
