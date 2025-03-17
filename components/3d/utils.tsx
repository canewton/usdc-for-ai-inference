import type { ModelHistoryItem } from './types';

export const groupHistoryByDay = (history: ModelHistoryItem[]) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(today.getDate() - 7);

  const grouped: { [key: string]: ModelHistoryItem[] } = {
    Today: [],
    Yesterday: [],
    'Past Week': [],
    Older: [],
  };

  history.forEach((item) => {
    const itemDate = new Date(item.created_at);
    const isToday =
      itemDate.getDate() === today.getDate() &&
      itemDate.getMonth() === today.getMonth() &&
      itemDate.getFullYear() === today.getFullYear();
    const isYesterday =
      itemDate.getDate() === yesterday.getDate() &&
      itemDate.getMonth() === yesterday.getMonth() &&
      itemDate.getFullYear() === yesterday.getFullYear();
    const isWithinPastWeek = itemDate > oneWeekAgo && itemDate < yesterday;

    if (isToday) {
      grouped.Today.push(item);
    } else if (isYesterday) {
      grouped.Yesterday.push(item);
    } else if (isWithinPastWeek) {
      grouped['Past Week'].push(item);
    } else {
      grouped.Older.push(item);
    }
  });

  return grouped;
};
