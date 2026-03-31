import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


// Helper function to get the token from document cookies
export function getTokenFromCookie() {
  if (typeof document === 'undefined') return null;

  const match = document.cookie
    .split('; ')
    .find(row => row.trim().startsWith('token='));

  if (!match) return null;

  return decodeURIComponent(match.split('=')[1]);
}

export function getLocalStorageValue(key:string){
    return localStorage.getItem(key) ?? ""
}
