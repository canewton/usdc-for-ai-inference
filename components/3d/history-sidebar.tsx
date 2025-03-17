import { TrashIcon } from '@heroicons/react/24/outline';

interface ModelHistoryItem {
  id: string;
  url: string;
  prompt: string;
  created_at: string;
}

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

  return (
    <div className="w-1/4 p-4 bg-gray-50 h-full overflow-y-auto">
      {Object.keys(groupedHistory).map((day) =>
        groupedHistory[day].length > 0 ? (
          <div key={day} className="mb-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
              {day}
            </h3>
            <ul className="space-y-1">
              {groupedHistory[day].map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between group"
                >
                  <button
                    onClick={() => onHistoryClick(item.url)}
                    className="text-gray-700 text-sm text-left py-1 px-2 rounded-full group-hover:bg-gray-200 transition-colors"
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
  );
}
