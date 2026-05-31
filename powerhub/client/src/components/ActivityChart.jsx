import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
    { day: 'Mon', minutes: 45, calories: 350 },
    { day: 'Tue', minutes: 60, calories: 480 },
    { day: 'Wed', minutes: 30, calories: 240 },
    { day: 'Thu', minutes: 75, calories: 600 },
    { day: 'Fri', minutes: 50, calories: 400 },
    { day: 'Sat', minutes: 90, calories: 720 },
    { day: 'Sun', minutes: 40, calories: 320 },
];

export function ActivityChart() {
    return (
        <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                    dataKey="day"
                    stroke="#64748b"
                    style={{ fontSize: '12px' }}
                />
                <YAxis
                    stroke="#64748b"
                    style={{ fontSize: '12px' }}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        color: '#0f172a'
                    }}
                    cursor={{ fill: 'rgba(0, 200, 83, 0.1)' }}
                />
                <Bar
                    dataKey="minutes"
                    fill="url(#colorGradient)"
                    radius={[8, 8, 0, 0]}
                    animationBegin={0}
                    animationDuration={1000}
                />
                <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00C853" stopOpacity={1} />
                        <stop offset="100%" stopColor="#64DD17" stopOpacity={0.8} />
                    </linearGradient>
                </defs>
            </BarChart>
        </ResponsiveContainer>
    );
}
