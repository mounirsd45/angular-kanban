import { Injectable, inject, signal } from '@angular/core';
import type { Priority } from './board.models';
import { BoardService } from './board.service';

export type Tab = 'overview' | 'updates' | 'issues';

export type NavId =
  | 'inbox'
  | 'my-issues'
  | 'projects'
  | 'views'
  | 'team-issues'
  | 'team-projects'
  | 'team-views';

export type DialogState =
  | { type: 'task'; taskId: string }
  | { type: 'new-task'; columnId?: string }
  | { type: 'import' }
  | { type: 'invite' }
  | { type: 'help' }
  | null;

export interface Filter {
  priority: Priority | null;
  assigneeId: string | null;
  overdue: boolean;
}

export interface Display {
  created: boolean;
  priority: boolean;
  assignees: boolean;
  due: boolean;
}

export interface Toast {
  id: number;
  title: string;
}

export const DISPLAY_OPTIONS: { key: keyof Display; label: string }[] = [
  { key: 'created', label: 'Created date' },
  { key: 'priority', label: 'Priority' },
  { key: 'assignees', label: 'Assignees' },
  { key: 'due', label: 'Due date' },
];

const EMPTY_FILTER: Filter = { priority: null, assigneeId: null, overdue: false };

let toastCounter = 0;

@Injectable({ providedIn: 'root' })
export class UiService {
  readonly sidebarOpen = signal(false);
  readonly sidebarCollapsed = signal(false);
  readonly tab = signal<Tab>('issues');
  readonly nav = signal<NavId>('team-issues');
  readonly search = signal('');
  readonly filter = signal<Filter>({ ...EMPTY_FILTER });
  readonly display = signal<Display>({ created: true, priority: true, assignees: true, due: true });
  readonly dialog = signal<DialogState>(null);
  readonly toasts = signal<Toast[]>([]);
  readonly notificationsSeenAt = signal<string | null>(null);

  constructor() {
    const board = inject(BoardService);
    this.notificationsSeenAt.set(board.activity()[0]?.at ?? null);
  }

  setSidebarOpen(open: boolean): void {
    this.sidebarOpen.set(open);
  }

  toggleSidebarCollapsed(): void {
    this.sidebarCollapsed.update((collapsed) => !collapsed);
  }

  setTab(tab: Tab): void {
    this.tab.set(tab);
  }

  setNav(nav: NavId): void {
    this.nav.set(nav);
    this.sidebarOpen.set(false);
  }

  setSearch(search: string): void {
    this.search.set(search);
  }

  setFilter(patch: Partial<Filter>): void {
    this.filter.update((filter) => ({ ...filter, ...patch }));
  }

  clearFilter(): void {
    this.filter.set({ ...EMPTY_FILTER });
  }

  setDisplay(patch: Partial<Display>): void {
    this.display.update((display) => ({ ...display, ...patch }));
  }

  openDialog(dialog: NonNullable<DialogState>): void {
    this.dialog.set(dialog);
  }

  closeDialog(): void {
    this.dialog.set(null);
  }

  toast(title: string): void {
    const id = ++toastCounter;
    this.toasts.update((toasts) => [...toasts.slice(-2), { id, title }]);
    setTimeout(() => this.dismissToast(id), 2600);
  }

  dismissToast(id: number): void {
    this.toasts.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }

  markNotificationsSeen(at: string): void {
    this.notificationsSeenAt.set(at);
  }
}

export function isFilterActive(filter: Filter): boolean {
  return Boolean(filter.priority || filter.assigneeId || filter.overdue);
}
