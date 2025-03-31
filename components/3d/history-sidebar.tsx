import { TrashIcon } from 'lucide-react';

import { type ModelHistoryItem } from './types';

interface HistorySidebarProps {
  history: ModelHistoryItem[];
  onHistoryClick: (url: string) => void;
  onDelete: (modelId: string) => void;
  groupHistoryByDay: (history: ModelHistoryItem[]) => {
    [key: string]: ModelHistoryItem[];
  };
}

export default function HistorySidebar({
  history,
  onHistoryClick,
  onDelete,
  groupHistoryByDay,
}: HistorySidebarProps) {
  const groupedHistory = groupHistoryByDay(history);

  const navItems = [
    {
      title: 'Image to video',
      icon: '/icons/entertainment-bazooka.svg',
      active: false,
    },
    {
      title: 'Image to 3-d',
      icon: '/icons/clip-path-group.png',
      active: true,
    },
    {
      title: 'Text to Image',
      icon: '/icons/clip-path-group-1.png',
      active: false,
    },
    {
      title: 'Text to Text',
      icon: '/icons/clip-path-group-2.png',
      active: false,
    },
  ];

  return (
    <div className="w-1/4 bg-neutral-bg border border-neutral-border border-r-0 rounded-l-xl overflow-hidden">
      {/* Navigation Menu */}
      <div className="w-[282px] mb-6">
        {navItems.map((item, index) => (
          <div
            key={index}
            className={`flex items-center gap-[27px] p-5 rounded-[10px] ${item.active ? 'bg-[#eefffa66]' : ''}`}
          >
            {item.icon.includes('.png') ? (
              <div
                className="relative w-12 h-12 bg-cover"
                style={{ backgroundImage: `url(${item.icon})` }}
              />
            ) : (
              <img className="w-12 h-12" alt={item.title} src={item.icon} />
            )}
            <span
              className={`w-[115px] text-base tracking-[-0.18px] leading-6 ${
                item.active
                  ? "[font-family:'SF_Pro-Bold',Helvetica] font-bold text-[#1ed67d]"
                  : "[font-family:'SF_Pro-Regular',Helvetica] font-normal text-licorice-700-headline"
              }`}
            >
              {item.title}
            </span>
          </div>
        ))}
      </div>

      {/* History Section */}
      <div className="mt-6 p-6 space-y-6">
        {Object.keys(groupedHistory).map((day) =>
          groupedHistory[day].length > 0 ? (
            <div key={day}>
              <h3 className="text-xs uppercase font-normal text-[#9C9C9C] tracking-wider mb-3">
                {day}
              </h3>
              <ul className="space-y-2">
                {groupedHistory[day].map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between group"
                  >
                    <button
                      onClick={() => onHistoryClick(item.url)}
                      className="text-sm text-licorice-500 py-1 px-2 rounded-full hover:bg-gray-200 transition-colors text-left max-w-[90%] truncate"
                    >
                      {item.prompt}
                    </button>
                    <button
                      onClick={() => onDelete(item.id)}
                      className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Delete model"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null,
        )}
        {history.length === 0 && (
          <p className="text-gray-500 text-sm">No previous models generated.</p>
        )}
      </div>
    </div>
  );
}
