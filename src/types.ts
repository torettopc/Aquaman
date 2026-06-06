/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  name: string;
  email: string;
  dailyGoalMl: number;
}

export type DayPeriod = 'morning' | 'afternoon' | 'night';

export interface WaterRecord {
  id: string;
  userId: string;
  amountMl: number;
  time: string; // HH:MM
  date: string; // YYYY-MM-DD
  period: DayPeriod;
}

export interface Reminder {
  id: string;
  time: string; // HH:MM
  active: boolean;
  label?: string;
}

export interface HydrationFact {
  id: string;
  title: string;
  category: string;
  description: string;
  iconName: string;
}
