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
      <div className="text-2xl font-bold text-red-600 font-mono">
        {formatTime(timeLeft)}
      </div>
      <div className="text-xs text-msc-text/70 mt-1">
        Время действия предложения
      </div>
    </div>
  );
};

export default CountdownTimer;