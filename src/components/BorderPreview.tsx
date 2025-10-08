import React from 'react';

interface BorderPreviewProps {
  border: {
    id: string;
    name: string;
    category: string;
    preview: string;
    description: string;
    message: string;
  };
  isSelected: boolean;
  onClick: () => void;
}

export const BorderPreview: React.FC<BorderPreviewProps> = ({ border, isSelected, onClick }) => {
  const renderBorderContent = () => {
    if (border.id === 'none') {
      return (
        <div className="w-full aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
          <div className="relative w-full h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200 opacity-50"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-2">📸</div>
                <div className="text-sm font-semibold text-gray-700">Clean Display</div>
                <div className="text-xs text-gray-500">No border or overlay</div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Create themed border designs
    const getBorderStyle = () => {
      switch (border.category) {
        case 'Holiday':
          return getHolidayBorder(border.id);
        case 'Special Occasions':
          return getSpecialOccasionBorder(border.id);
        case 'Custom Editable':
          return getCustomBorder(border.id);
        case 'Funny Quotes':
          return getFunnyBorder(border.id);
        case 'Futuristic':
          return getFuturisticBorder(border.id);
        case 'Seasonal':
          return getSeasonalBorder(border.id);
        default:
          return 'border-2 border-gray-300';
      }
    };

    const getContentBackground = () => {
      // Different themed backgrounds for different categories
      if (border.category === 'Holiday') {
        return 'bg-gradient-to-br from-red-300 via-green-200 to-blue-300';
      }
      if (border.category === 'Special Occasions') {
        return 'bg-gradient-to-br from-purple-300 via-pink-300 to-yellow-200';
      }
      if (border.category === 'Futuristic') {
        return 'bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600';
      }
      if (border.category === 'Seasonal') {
        return 'bg-gradient-to-br from-orange-300 via-yellow-200 to-green-300';
      }
      return 'bg-gradient-to-br from-blue-300 via-purple-300 to-pink-300';
    };

    const getEmoji = () => {
      const emojiMatch = border.name.match(/[\u{1F300}-\u{1F9FF}]/u);
      return emojiMatch ? emojiMatch[0] : '✨';
    };

    return (
      <div className="w-full aspect-[4/3] flex items-center justify-center relative">
        <div className={`w-full h-full ${getBorderStyle()} rounded-lg relative overflow-hidden flex items-center justify-center`}>
          {/* Content area with sample image simulation */}
          <div className={`absolute inset-2 ${getContentBackground()} rounded flex flex-col items-center justify-center text-white shadow-inner`}>
            <div className="text-5xl mb-2 drop-shadow-lg">{getEmoji()}</div>
            <div className="text-xs font-bold text-white drop-shadow-md">Your Photo/Video</div>
            <div className="text-xs text-white/80 drop-shadow">Content goes here</div>
          </div>
          
          {/* Border message/text banner */}
          {border.message && (
            <div className="absolute inset-x-0 top-0 py-2 bg-gradient-to-b from-black/90 via-black/80 to-transparent text-white flex items-center justify-center font-bold z-20">
              <div className="text-sm tracking-wide drop-shadow-lg">
                {border.message}
              </div>
            </div>
          )}
          
          {/* Bottom message banner */}
          {border.message && (
            <div className="absolute inset-x-0 bottom-0 py-2 bg-gradient-to-t from-black/90 via-black/80 to-transparent text-white flex items-center justify-center font-bold z-20">
              <div className="text-sm tracking-wide drop-shadow-lg">
                {border.message}
              </div>
            </div>
          )}
          
          {/* Corner decorations */}
          {border.category === 'Holiday' && (
            <>
              <div className="absolute top-2 left-2 text-2xl drop-shadow-lg">🎄</div>
              <div className="absolute top-2 right-2 text-2xl drop-shadow-lg">🎄</div>
              <div className="absolute bottom-2 left-2 text-2xl drop-shadow-lg">🎁</div>
              <div className="absolute bottom-2 right-2 text-2xl drop-shadow-lg">⭐</div>
            </>
          )}
          
          {border.category === 'Special Occasions' && (
            <>
              <div className="absolute top-2 left-2 text-2xl drop-shadow-lg">✨</div>
              <div className="absolute top-2 right-2 text-2xl drop-shadow-lg">✨</div>
              <div className="absolute bottom-2 left-2 text-2xl drop-shadow-lg">🎉</div>
              <div className="absolute bottom-2 right-2 text-2xl drop-shadow-lg">🎊</div>
            </>
          )}

          {border.category === 'Futuristic' && (
            <>
              <div className="absolute top-2 left-2 text-xl drop-shadow-lg">⚡</div>
              <div className="absolute top-2 right-2 text-xl drop-shadow-lg">⚡</div>
              <div className="absolute bottom-2 left-2 text-xl drop-shadow-lg">🔮</div>
              <div className="absolute bottom-2 right-2 text-xl drop-shadow-lg">🔮</div>
            </>
          )}

          {border.category === 'Seasonal' && (
            <>
              <div className="absolute top-2 left-2 text-2xl drop-shadow-lg">{getEmoji()}</div>
              <div className="absolute top-2 right-2 text-2xl drop-shadow-lg">{getEmoji()}</div>
              <div className="absolute bottom-2 left-2 text-2xl drop-shadow-lg">{getEmoji()}</div>
              <div className="absolute bottom-2 right-2 text-2xl drop-shadow-lg">{getEmoji()}</div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div 
      className={`rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-xl ${
        isSelected 
          ? 'border-primary bg-primary/10 ring-2 ring-primary/30 shadow-xl' 
          : 'border-border hover:border-primary/60 hover:bg-primary/5'
      }`}
      onClick={onClick}
    >
      <div className="p-3">
        {renderBorderContent()}
      </div>
      <div className="px-4 pb-4">
        <h4 className="font-semibold text-base mb-1">{border.name}</h4>
        <p className="text-sm text-muted-foreground">{border.description}</p>
        {border.message && (
          <p className="text-sm text-primary font-semibold mt-2 flex items-center gap-1">
            <span className="text-xs">💬</span>
            "{border.message}"
          </p>
        )}
      </div>
    </div>
  );
};

// Helper functions for border styles
const getHolidayBorder = (id: string) => {
  const styles = {
    'merry-christmas': 'border-4 border-red-600 bg-gradient-to-br from-red-100 via-green-100 to-red-100 shadow-lg',
    'happy-new-year': 'border-4 border-yellow-500 bg-gradient-to-br from-yellow-100 via-purple-100 to-blue-100 shadow-lg',
    'happy-valentines': 'border-4 border-pink-500 bg-gradient-to-br from-pink-100 via-red-100 to-pink-100 shadow-lg',
    'happy-halloween': 'border-4 border-orange-600 bg-gradient-to-br from-orange-100 via-black/10 to-orange-100 shadow-lg',
    'happy-easter': 'border-4 border-green-500 bg-gradient-to-br from-green-100 via-yellow-100 to-pink-100 shadow-lg',
    'happy-thanksgiving': 'border-4 border-amber-600 bg-gradient-to-br from-amber-100 via-orange-100 to-red-100 shadow-lg'
  };
  return styles[id as keyof typeof styles] || 'border-2 border-gray-300';
};

const getSpecialOccasionBorder = (id: string) => {
  const styles = {
    'happy-birthday': 'border-4 border-purple-500 bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100 shadow-lg',
    'congrats-graduate': 'border-4 border-blue-600 bg-gradient-to-br from-blue-100 via-white to-yellow-100 shadow-lg',
    'happy-anniversary': 'border-4 border-rose-500 bg-gradient-to-br from-rose-100 via-pink-100 to-red-100 shadow-lg',
    'wedding-day': 'border-4 border-white bg-gradient-to-br from-white via-pink-50 to-white shadow-xl'
  };
  return styles[id as keyof typeof styles] || 'border-2 border-gray-300';
};

const getCustomBorder = (id: string) => {
  const styles = {
    'event-name': 'border-4 border-indigo-500 bg-gradient-to-br from-indigo-100 via-purple-100 to-blue-100 shadow-lg',
    'logo-corners': 'border-4 border-gray-700 bg-gradient-to-br from-gray-100 via-white to-gray-100 shadow-lg',
    'color-gradient': 'border-4 border-transparent bg-gradient-to-br from-purple-400 via-pink-400 to-red-400 shadow-lg',
    'scrolling-ticker': 'border-4 border-cyan-500 bg-gradient-to-r from-cyan-100 via-blue-100 to-cyan-100 shadow-lg'
  };
  return styles[id as keyof typeof styles] || 'border-2 border-gray-300';
};

const getFunnyBorder = (id: string) => {
  const styles = {
    'calories-dont-count': 'border-4 border-orange-500 bg-gradient-to-br from-orange-100 via-yellow-100 to-pink-100 shadow-lg',
    'work-hard-party': 'border-4 border-green-600 bg-gradient-to-br from-green-100 via-blue-100 to-purple-100 shadow-lg',
    'reboot-friday': 'border-4 border-blue-500 bg-gradient-to-br from-blue-100 via-cyan-100 to-green-100 shadow-lg',
    'dance-like-nobody': 'border-4 border-purple-600 bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100 shadow-lg'
  };
  return styles[id as keyof typeof styles] || 'border-2 border-gray-300';
};

const getFuturisticBorder = (id: string) => {
  const styles = {
    'neon-glow': 'border-4 border-cyan-400 bg-gradient-to-br from-cyan-100 via-purple-100 to-cyan-100 shadow-lg shadow-cyan-300/50',
    'tech-circuit': 'border-4 border-blue-600 bg-gradient-to-br from-blue-100 via-cyan-100 to-blue-100 shadow-lg',
    'galaxy': 'border-4 border-indigo-600 bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 shadow-lg',
    'cyberpunk': 'border-4 border-fuchsia-500 bg-gradient-to-br from-fuchsia-100 via-cyan-100 to-fuchsia-100 shadow-lg shadow-fuchsia-300/50'
  };
  return styles[id as keyof typeof styles] || 'border-2 border-gray-300';
};

const getSeasonalBorder = (id: string) => {
  const styles = {
    'summer': 'border-4 border-yellow-400 bg-gradient-to-br from-yellow-100 via-orange-100 to-yellow-100 shadow-lg',
    'winter': 'border-4 border-blue-300 bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50 shadow-lg',
    'autumn': 'border-4 border-orange-500 bg-gradient-to-br from-orange-100 via-red-100 to-orange-100 shadow-lg'
  };
  return styles[id as keyof typeof styles] || 'border-2 border-gray-300';
};