import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type MealOption = {
  description: string;
  items: string[];
  p: number;
  c: number;
  f: number;
  fib: number;
  medicines?: string[];
};

export type Meal = {
  id: string;
  name: string;
  time: string;
  isWorkoutSpecific?: 'training' | 'normal';
  options: MealOption[];
};

export type WeightLog = {
  id: string;
  weight: number;
  timestamp: string; 
};

export type AppData = {
  weights: WeightLog[]; 
  waterIntake: Record<string, number>; // dateStr -> ml
  completedMeals: Record<string, string[]>; // dateStr -> mealIds[]
  selectedOptions: Record<string, number>; // mealId -> optionIndex
  isTrainingDay: boolean;
};

export const STORAGE_KEY = 'appData_v4';
