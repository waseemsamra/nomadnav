
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(totalSeconds: number): string {
  if (totalSeconds < 0) return "N/A";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  let result = '';
  if (hours > 0) {
    result += `${hours}h `;
  }
  if (minutes > 0 || hours === 0) {
    result += `${minutes}m`;
  }
  return result.trim() || '0m';
}

export function formatDateString(dateString: string, formatString: string): string {
    try {
        if (!dateString) return "N/A";
        const date = parseISO(dateString);
        return format(date, formatString);
    } catch (error) {
        console.error("Invalid date string:", dateString, error);
        return dateString;
    }
}
