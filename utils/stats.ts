// utils/stats.ts
import { DiaryEntry } from "../types";

export function calculateWritingStreak(entries: DiaryEntry[]): number {
  if (entries.length === 0) {
    return 0;
  }

  // Get unique dates in YYYY-MM-DD format to handle multiple entries on the same day
  const uniqueDates = [
    ...new Set(entries.map(entry => entry.createdAt.split('T')[0]))
  ];

  // Sort dates chronologically
  uniqueDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  let currentStreak = 0;
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  // Check if the most recent entry is from today or yesterday
  const mostRecentDate = new Date(uniqueDates[0] + 'T00:00:00'); // Use T00:00 to avoid timezone issues
  if (
    mostRecentDate.toDateString() === today.toDateString() ||
    mostRecentDate.toDateString() === yesterday.toDateString()
  ) {
    currentStreak = 1;
    for (let i = 0; i < uniqueDates.length - 1; i++) {
      const currentDate = new Date(uniqueDates[i]);
      const previousDate = new Date(uniqueDates[i + 1]);

      const diffTime = currentDate.getTime() - previousDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentStreak++;
      } else {
        break; // Streak is broken
      }
    }
  }

  return currentStreak;
}