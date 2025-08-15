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
    <div className="text-center">
      <div className="bg-black/90 rounded-lg px-4 py-3 shadow-lg border border-gray-800 w-full">
        <div className="text-3xl font-mono font-bold text-green-400 tracking-wider filter drop-shadow-sm">
          {formatTime(timeLeft)}
        </div>
      </div>
      <div className="text-xs text-msc-text/70 mt-2 font-medium">
        ⏰ Время действия предложения
      </div>
    </div>
  );
};

export default CountdownTimer;