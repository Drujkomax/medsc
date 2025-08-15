import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  minutes: number;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ minutes }) => {
  const [timeLeft, setTimeLeft] = useState(minutes * 60 * 1000); // Convert to milliseconds

  useEffect(() => {
    if (timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 100) return 0;
        return prev - 100;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [timeLeft]);

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const ms = Math.floor((milliseconds % 1000) / 100);

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="bg-black/90 text-center py-4 px-4 w-full">
      <div className="text-3xl font-mono font-bold text-green-400 tracking-wider filter drop-shadow-sm mb-2">
        {formatTime(timeLeft)}
      </div>
      <div className="text-xs text-white/70 font-medium">
        ⏰ Время действия предложения
      </div>
    </div>
  );
};

export default CountdownTimer;