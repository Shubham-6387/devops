import React, { useState, useEffect } from 'react';

const Stopwatch = () => {
    const [time, setTime] = useState(0);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        let interval = null;
        if (isActive) {
            interval = setInterval(() => {
                setTime((time) => time + 10);
            }, 10);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isActive]);

    const toggle = () => setIsActive(!isActive);
    const reset = () => {
        setIsActive(false);
        setTime(0);
    };

    const formatTime = (milliseconds) => {
        const mins = Math.floor(milliseconds / 60000);
        const secs = Math.floor((milliseconds % 60000) / 1000);
        const ms = Math.floor((milliseconds % 1000) / 10);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}.${ms < 10 ? '0' : ''}${ms}`;
    };

    return (
        <div className="text-center">
            <div className="text-5xl font-black mb-6 text-foreground tracking-widest font-mono">{formatTime(time)}</div>
            <div className="flex gap-3 justify-center">
                <button
                    onClick={toggle}
                    className={`px-6 py-2 rounded-xl font-bold transition-all shadow-lg ${isActive ? 'bg-yellow-400 text-black shadow-yellow-400/20' : 'bg-primary text-black shadow-primary/20 hover:scale-105'}`}
                >
                    {isActive ? 'Pause' : 'Start'}
                </button>
                <button
                    onClick={reset}
                    className="px-6 py-2 rounded-xl bg-red-600 text-white font-bold shadow-lg shadow-red-600/20 hover:bg-red-700 hover:scale-105 transition-all"
                >
                    Reset
                </button>
            </div>
        </div>
    );
};

export default Stopwatch;
