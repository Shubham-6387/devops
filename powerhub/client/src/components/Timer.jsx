import React, { useState, useEffect } from 'react';

const Timer = ({ duration, onComplete }) => {
    const [timeLeft, setTimeLeft] = useState(duration);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        setTimeLeft(duration);
    }, [duration]);

    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(timeLeft - 1);
            }, 1000);
        } else if (timeLeft === 0 && isActive) {
            setIsActive(false);
            if (onComplete) onComplete();
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, onComplete]);

    const toggle = () => setIsActive(!isActive);
    const reset = () => {
        setIsActive(false);
        setTimeLeft(duration);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <div className="text-center">
            <div className="text-5xl font-black mb-6 text-foreground tracking-widest font-mono">{formatTime(timeLeft)}</div>
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

export default Timer;
