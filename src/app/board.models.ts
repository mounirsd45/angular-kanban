export type Priority = 'urgent' | 'high' | 'normal' | 'low';

export interface Member {
  id: string;
  name: string;
}

export interface Column {
  id: string;
  name: string;
  hidden: boolean;
  isDone: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  columnId: string;
  priority: Priority;
  assigneeIds: string[];
  createdAt: string;
  dueDate: string | null;
}

export interface Activity {
  id: string;
  text: string;
  at: string;
}

export interface BoardData {
  title: string;
  favorite: boolean;
  teamName: string;
  currentUserId: string;
  members: Member[];
  columns: Column[];
  tasks: Task[];
  activity: Activity[];
}

export interface TaskInput {
  title: string;
  description?: string;
  columnId: string;
  priority?: Priority;
  assigneeIds?: string[];
  dueDate?: string | null;
}

export const PRIORITIES: { id: Priority; label: string }[] = [
  { id: 'urgent', label: 'Urgent' },
  { id: 'high', label: 'High' },
  { id: 'normal', label: 'Normal' },
  { id: 'low', label: 'Low' },
];

export const PRIORITY_RANK: Record<Priority, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};

const AVATAR_COLORS = ['#0e6b62', '#c4552a', '#3d5a4c', '#8a5a12', '#3f4c7a', '#7a3e55'];

export function createId(): string {
  return crypto.randomUUID();
}

export function todayStamp(date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function shiftDay(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return todayStamp(date);
}

export function daysAgoIso(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

export function isOverdue(task: Task, columns: Column[], today = todayStamp()): boolean {
  if (!task.dueDate || task.dueDate >= today) return false;
  return !columns.find((column) => column.id === task.columnId)?.isDone;
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function avatarColor(id: string): string {
  let hash = 0;
  for (const char of id) hash = (hash + char.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[hash] ?? '#0e6b62';
}

export function formatDay(day: string | null): string {
  if (!day) return '';
  const [year, month, date] = day.split('-').map(Number);
  if (!year || !month || !date) return day;
  return new Date(year, month - 1, date).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export function formatCreated(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function relativeTime(iso: string, now = Date.now()): string {
  const delta = now - new Date(iso).getTime();
  const minutes = Math.round(delta / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 14) return `${days}d ago`;
  return formatCreated(iso);
}

export function priorityLabel(priority: Priority): string {
  return PRIORITIES.find((item) => item.id === priority)?.label ?? priority;
}
