import { useState, useEffect } from 'react';

/**
 * Custom hook for persisting state to localStorage with JSON serialization.
 * @param key - The localStorage key
 * @param initial - The initial/default value
 * @returns A tuple of [value, setValue] similar to useState
 */
export function useLocalStorage<T>(key: string, initial: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initial;
    } catch (error) {
      console.warn(`Failed to read localStorage key "${key}":`, error);
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Failed to write localStorage key "${key}":`, error);
    }
  }, [key, value]);

  return [value, setValue] as const;
}
