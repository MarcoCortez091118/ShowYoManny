import { useEffect, useState } from 'react';
import showYoLogo from '@/assets/showyo-logo-overlay.png';
import { Loader2 } from 'lucide-react';

interface WaitingScreenProps {
  message?: string;
}

export const WaitingScreen = ({ message = 'Waiting for content...' }: WaitingScreenProps) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="text-center space-y-8 px-8">
        <div className="relative">
          <img
            src={showYoLogo}
            alt="ShowYo"
            className="w-96 h-auto mx-auto opacity-90 drop-shadow-2xl animate-pulse"
          />
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-3xl -z-10 animate-pulse" />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 text-white animate-spin" />
            <p className="text-2xl text-white font-medium tracking-wide">
              {message}
              <span className="inline-block w-12 text-left">{dots}</span>
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-lg text-gray-400">
              Content is scheduled and will appear soon
            </p>
            <p className="text-sm text-gray-500">
              Check your admin dashboard for scheduling details
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>System Active</span>
        </div>
      </div>
    </div>
  );
};
