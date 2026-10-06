import { Component, computed, inject, signal } from '@angular/core';
import { CdkDrag, CdkDragHandle, CdkDragPlaceholder, CdkDropList, CdkDropListGroup, moveItemInArray, type CdkDragDrop } from '@angular/cdk/drag-drop';
import {
  avatarColor,
  formatCreated,
  formatDay,
  initials,
  isOverdue,
  priorityLabel,
  todayStamp,
  type Task,
} from '../board.models';
import { BoardService } from '../board.service';
import { UiService } from '../ui.service';

@Component({
  selector: 'app-board',
  imports: [CdkDropListGroup, CdkDropList, CdkDrag, CdkDragHandle, CdkDragPlaceholder],
  templateUrl: './board.html',
  styleUrl: './board.scss',
  host: { class: 'board-pane' },
})
export class Board {
  protected readonly board = inject(BoardService);
  protected readonly ui = inject(UiService);
  protected readonly initials = initials;
  protected readonly avatarColor = avatarColor;
  protected readonly formatDay = formatDay;
  protected readonly formatCreated = formatCreated;
  protected readonly priorityLabel = priorityLabel;
  protected readonly menuId = signal<string | null>(null);
  protected readonly renamingId = signal<string | null>(null);
  private readonly drafts = signal<Record<string, string>>({});

  protected readonly filtered = computed(() => {
    const filter = this.ui.filter();
    return this.ui.search().trim().length > 0 || !!filter.priority || !!filter.assigneeId || filter.overdue;
  });

  protected tasksFor(columnId: string): Task[] {
    return this.board.tasksIn(columnId).filter((task) => this.matches(task));
  }

  protected overdue(task: Task): boolean {
    return isOverdue(task, this.board.columns(), todayStamp());
  }

  protected draftFor(columnId: string): string {
    return this.drafts()[columnId] ?? '';
  }

  protected setDraft(columnId: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.drafts.update((drafts) => ({ ...drafts, [columnId]: value }));
  }

  protected addQuick(columnId: string, event: Event): void {
    event.preventDefault();
    const title = this.draftFor(columnId).trim();
    if (!title) return;
    this.board.addTask({ title, columnId });
    this.drafts.update((drafts) => ({ ...drafts, [columnId]: '' }));
    this.ui.toast('Task created.');
  }

  protected toggleMenu(columnId: string): void {
    this.menuId.update((current) => (current === columnId ? null : columnId));
  }

  protected sort(columnId: string, by: 'priority' | 'due'): void {
    this.board.sortColumn(columnId, by);
    this.menuId.set(null);
  }

  protected hide(columnId: string): void {
    this.board.setColumnHidden(columnId, true);
    this.menuId.set(null);
  }

  protected startRename(columnId: string): void {
    this.menuId.set(null);
    this.renamingId.set(columnId);
  }

  protected commitRename(columnId: string, event: Event): void {
    this.board.renameColumn(columnId, (event.target as HTMLInputElement).value);
    this.renamingId.set(null);
  }

  protected drop(event: CdkDragDrop<Task[]>): void {
    if (this.filtered()) return;
    const fromId = event.previousContainer.id;
    const toId = event.container.id;
    if (fromId === toId && event.previousIndex === event.currentIndex) return;
    const task = this.tasksFor(fromId)[event.previousIndex];
    if (!task) return;
    if (fromId === toId) {
      const ids = this.tasksFor(toId).map((item) => item.id);
      moveItemInArray(ids, event.previousIndex, event.currentIndex);
      this.board.reorderColumn(toId, ids);
      return;
    }
    const before = this.board.tasksIn(toId)[event.currentIndex] ?? null;
    this.board.moveTask(task.id, toId, before?.id ?? null);
  }

  protected open(task: Task): void {
    this.ui.openDialog({ type: 'task', taskId: task.id });
  }

  private matches(task: Task): boolean {
    const search = this.ui.search().trim().toLowerCase();
    if (search && !`${task.title} ${task.description}`.toLowerCase().includes(search)) return false;
    const filter = this.ui.filter();
    if (filter.priority && task.priority !== filter.priority) return false;
    if (filter.assigneeId && !task.assigneeIds.includes(filter.assigneeId)) return false;
    if (filter.overdue && !isOverdue(task, this.board.columns(), todayStamp())) return false;
    return true;
  }
}
