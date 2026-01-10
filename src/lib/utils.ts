import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  let result = '';
  if (hours > 0) {
    result += `${hours}h `;
  }
  if (minutes > 0 || hours === 0) {
    result += `${minutes}m`;
  }
  return result.trim();
}

export function formatDateString(dateString: string, formatString: string): string {
    try {
        const date = parseISO(dateString);
        return format(date, formatString);
    } catch (error) {
        console.error("Invalid date string:", dateString, error);
        // Fallback to returning the original string or a custom error message
        return dateString;
    }
}

    