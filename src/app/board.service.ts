import { computed, effect, Injectable, signal } from '@angular/core';
import {
  createId,
  PRIORITY_RANK,
  type Activity,
  type BoardData,
  type Priority,
  type Task,
  type TaskInput,
} from './board.models';
import { seedBoard } from './board.seed';

const STORAGE_KEY = 'angular-kanban-board';
const MAX_ACTIVITY = 60;

function withActivity(activity: Activity[], text: string): Activity[] {
  return [{ id: createId(), text, at: new Date().toISOString() }, ...activity].slice(0, MAX_ACTIVITY);
}

function insertBefore(tasks: Task[], moving: Task, columnId: string, beforeId: string | null): Task[] {
  const rest = tasks.filter((task) => task.id !== moving.id);
  const moved = { ...moving, columnId };
  if (beforeId) {
    const at = rest.findIndex((task) => task.id === beforeId);
    if (at >= 0) return [...rest.slice(0, at), moved, ...rest.slice(at)];
  }
  let last = -1;
  rest.forEach((task, index) => {
    if (task.columnId === columnId) last = index;
  });
  if (last === -1) return [...rest, moved];
  return [...rest.slice(0, last + 1), moved, ...rest.slice(last + 1)];
}

function isBoard(value: unknown): value is BoardData {
  if (!value || typeof value !== 'object') return false;
  const board = value as BoardData;
  return (
    typeof board.title === 'string' &&
    typeof board.teamName === 'string' &&
    typeof board.currentUserId === 'string' &&
    typeof board.favorite === 'boolean' &&
    Array.isArray(board.members) &&
    Array.isArray(board.columns) &&
    Array.isArray(board.tasks) &&
    Array.isArray(board.activity)
  );
}

function loadBoard(): BoardData {
  if (typeof localStorage === 'undefined') return seedBoard();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedBoard();
    const parsed = JSON.parse(raw) as { version?: number; board?: unknown };
    if (parsed.version !== 1 || !isBoard(parsed.board)) return seedBoard();
    return parsed.board;
  } catch {
    return seedBoard();
  }
}

@Injectable({ providedIn: 'root' })
export class BoardService {
  private readonly state = signal<BoardData>(loadBoard());

  readonly title = computed(() => this.state().title);
  readonly favorite = computed(() => this.state().favorite);
  readonly teamName = computed(() => this.state().teamName);
  readonly currentUserId = computed(() => this.state().currentUserId);
  readonly members = computed(() => this.state().members);
  readonly columns = computed(() => this.state().columns);
  readonly tasks = computed(() => this.state().tasks);
  readonly activity = computed(() => this.state().activity);
  readonly visibleColumns = computed(() => this.state().columns.filter((column) => !column.hidden));
  readonly hiddenColumns = computed(() => this.state().columns.filter((column) => column.hidden));
  readonly currentMember = computed(
    () => this.state().members.find((member) => member.id === this.state().currentUserId) ?? null,
  );

  constructor() {
    effect(() => {
      const board = this.state();
      if (typeof localStorage === 'undefined') return;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, board }));
      } catch {
        // Ignore quota and private-mode failures. The board still works in memory.
      }
    });
  }

  tasksIn(columnId: string): Task[] {
    return this.state().tasks.filter((task) => task.columnId === columnId);
  }

  memberName(id: string): string {
    return this.state().members.find((member) => member.id === id)?.name ?? 'Unknown';
  }

  columnName(id: string): string {
    return this.state().columns.find((column) => column.id === id)?.name ?? 'Unknown';
  }

  setTitle(title: string): void {
    const trimmed = title.trim().slice(0, 80);
    if (!trimmed) return;
    this.state.update((state) => ({ ...state, title: trimmed }));
  }

  toggleFavorite(): void {
    this.state.update((state) => ({ ...state, favorite: !state.favorite }));
  }

  addMember(name: string): void {
    const trimmed = name.trim();
    if (!trimmed) return;
    this.state.update((state) => ({
      ...state,
      members: [...state.members, { id: createId(), name: trimmed }],
      activity: withActivity(state.activity, `${trimmed} joined ${state.teamName}`),
    }));
  }

  addTask(input: TaskInput): string {
    const id = createId();
    const title = input.title.trim();
    if (!title) return '';
    const task: Task = {
      id,
      title,
      description: input.description?.trim() ?? '',
      columnId: input.columnId,
      priority: input.priority ?? 'normal',
      assigneeIds: input.assigneeIds ?? [],
      createdAt: new Date().toISOString(),
      dueDate: input.dueDate ?? null,
    };
    this.state.update((state) => ({
      ...state,
      tasks: [...state.tasks, task],
      activity: withActivity(state.activity, `Created “${task.title}”`),
    }));
    return id;
  }

  importTasks(titles: string[], columnId: string): number {
    const clean = titles.map((title) => title.trim()).filter(Boolean);
    if (clean.length === 0) return 0;
    this.state.update((state) => ({
      ...state,
      tasks: [
        ...state.tasks,
        ...clean.map((title) => ({
          id: createId(),
          title,
          description: '',
          columnId,
          priority: 'normal' as Priority,
          assigneeIds: [],
          createdAt: new Date().toISOString(),
          dueDate: null,
        })),
      ],
      activity: withActivity(
        state.activity,
        `Imported ${clean.length} task${clean.length === 1 ? '' : 's'}`,
      ),
    }));
    return clean.length;
  }

  updateTask(id: string, patch: Partial<Omit<Task, 'id'>>): void {
    this.state.update((state) => {
      const current = state.tasks.find((task) => task.id === id);
      if (!current) return state;
      const next = { ...current, ...patch, id: current.id };
      let tasks = state.tasks.map((task) => (task.id === id ? next : task));
      let activity = state.activity;
      if (patch.columnId && patch.columnId !== current.columnId) {
        tasks = insertBefore(tasks, next, patch.columnId, null);
        activity = withActivity(
          activity,
          `Moved “${next.title}” to ${state.columns.find((column) => column.id === patch.columnId)?.name ?? 'another column'}`,
        );
      } else if (patch.priority && patch.priority !== current.priority) {
        activity = withActivity(activity, `Set “${next.title}” to ${patch.priority} priority`);
      } else {
        activity = withActivity(activity, `Updated “${next.title}”`);
      }
      return { ...state, tasks, activity };
    });
  }

  deleteTask(id: string): void {
    this.state.update((state) => {
      const task = state.tasks.find((item) => item.id === id);
      if (!task) return state;
      return {
        ...state,
        tasks: state.tasks.filter((item) => item.id !== id),
        activity: withActivity(state.activity, `Deleted “${task.title}”`),
      };
    });
  }

  moveTask(id: string, columnId: string, beforeId: string | null): void {
    this.state.update((state) => {
      const task = state.tasks.find((item) => item.id === id);
      if (!task) return state;
      const tasks = insertBefore(state.tasks, task, columnId, beforeId);
      if (task.columnId === columnId) return { ...state, tasks };
      const column = state.columns.find((item) => item.id === columnId);
      return {
        ...state,
        tasks,
        activity: withActivity(state.activity, `Moved “${task.title}” to ${column?.name ?? columnId}`),
      };
    });
  }

  reorderColumn(columnId: string, ids: string[]): void {
    this.state.update((state) => {
      const byId = new Map(state.tasks.map((task) => [task.id, task]));
      const ordered = ids.map((id) => byId.get(id)).filter((task): task is Task => !!task);
      if (ordered.length !== ids.length) return state;
      let cursor = 0;
      return {
        ...state,
        tasks: state.tasks.map((task) => (task.columnId === columnId ? ordered[cursor++]! : task)),
      };
    });
  }

  sortColumn(columnId: string, by: 'priority' | 'due'): void {
    this.state.update((state) => {
      const inColumn = state.tasks.filter((task) => task.columnId === columnId);
      const sorted = [...inColumn].sort((a, b) => {
        if (by === 'priority') return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      });
      let cursor = 0;
      return {
        ...state,
        tasks: state.tasks.map((task) => (task.columnId === columnId ? sorted[cursor++]! : task)),
      };
    });
  }

  renameColumn(id: string, name: string): void {
    const trimmed = name.trim();
    if (!trimmed) return;
    this.state.update((state) => ({
      ...state,
      columns: state.columns.map((column) =>
        column.id === id ? { ...column, name: trimmed } : column,
      ),
    }));
  }

  setColumnHidden(id: string, hidden: boolean): void {
    this.state.update((state) => ({
      ...state,
      columns: state.columns.map((column) => (column.id === id ? { ...column, hidden } : column)),
    }));
  }

  showAllColumns(): void {
    this.state.update((state) => ({
      ...state,
      columns: state.columns.map((column) => ({ ...column, hidden: false })),
    }));
  }

  reset(): void {
    this.state.set(seedBoard());
  }
}
