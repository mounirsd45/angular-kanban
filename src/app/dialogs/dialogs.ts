import { Component, effect, inject, signal, untracked } from '@angular/core';
import { PRIORITIES, type Priority, type Task } from '../board.models';
import { BoardService } from '../board.service';
import { UiService } from '../ui.service';

interface TaskDraft {
  title: string;
  description: string;
  columnId: string;
  priority: Priority;
  assigneeIds: string[];
  dueDate: string;
}

@Component({
  selector: 'app-dialogs',
  templateUrl: './dialogs.html',
  styleUrl: './dialogs.scss',
})
export class Dialogs {
  protected readonly board = inject(BoardService);
  protected readonly ui = inject(UiService);
  protected readonly priorities = PRIORITIES;
  protected readonly draft = signal<TaskDraft | null>(null);
  protected readonly importText = signal('');
  protected readonly importColumnId = signal('');
  protected readonly inviteName = signal('');

  constructor() {
    effect(() => {
      const dialog = this.ui.dialog();
      untracked(() => {
        if (dialog?.type === 'task') {
          const task = this.board.tasks().find((item) => item.id === dialog.taskId);
          this.draft.set(task ? this.toDraft(task) : null);
        } else if (dialog?.type === 'new-task') {
          const columnId =
            dialog.columnId ?? this.board.visibleColumns()[0]?.id ?? this.board.columns()[0]?.id ?? '';
          this.draft.set({
            title: '',
            description: '',
            columnId,
            priority: 'normal',
            assigneeIds: [],
            dueDate: '',
          });
        } else if (dialog?.type === 'import') {
          this.importText.set('');
          this.importColumnId.set(this.board.visibleColumns()[0]?.id ?? this.board.columns()[0]?.id ?? '');
        } else if (dialog?.type === 'invite') {
          this.inviteName.set('');
        }
      });
    });
  }

  protected patch(partial: Partial<TaskDraft>): void {
    this.draft.update((draft) => (draft ? { ...draft, ...partial } : draft));
  }

  protected onTitle(event: Event): void {
    this.patch({ title: (event.target as HTMLInputElement).value });
  }

  protected onDescription(event: Event): void {
    this.patch({ description: (event.target as HTMLTextAreaElement).value });
  }

  protected onColumn(event: Event): void {
    this.patch({ columnId: (event.target as HTMLSelectElement).value });
  }

  protected onPriority(event: Event): void {
    this.patch({ priority: (event.target as HTMLSelectElement).value as Priority });
  }

  protected onDue(event: Event): void {
    this.patch({ dueDate: (event.target as HTMLInputElement).value });
  }

  protected onImportText(event: Event): void {
    this.importText.set((event.target as HTMLTextAreaElement).value);
  }

  protected onImportColumn(event: Event): void {
    this.importColumnId.set((event.target as HTMLSelectElement).value);
  }

  protected onInvite(event: Event): void {
    this.inviteName.set((event.target as HTMLInputElement).value);
  }

  protected toggleAssignee(id: string): void {
    this.draft.update((draft) => {
      if (!draft) return draft;
      const has = draft.assigneeIds.includes(id);
      return {
        ...draft,
        assigneeIds: has ? draft.assigneeIds.filter((item) => item !== id) : [...draft.assigneeIds, id],
      };
    });
  }

  protected saveTask(): void {
    const draft = this.draft();
    const dialog = this.ui.dialog();
    if (!draft || !dialog) return;
    if (!draft.title.trim()) {
      this.ui.toast('Add a title first.');
      return;
    }
    const patch = {
      title: draft.title.trim(),
      description: draft.description.trim(),
      columnId: draft.columnId,
      priority: draft.priority,
      assigneeIds: [...draft.assigneeIds],
      dueDate: draft.dueDate || null,
    };
    if (dialog.type === 'new-task') {
      this.board.addTask(patch);
      this.ui.toast('Task created.');
    } else if (dialog.type === 'task') {
      this.board.updateTask(dialog.taskId, patch);
      this.ui.toast('Task updated.');
    }
    this.ui.closeDialog();
  }

  protected removeTask(): void {
    const dialog = this.ui.dialog();
    if (dialog?.type !== 'task') return;
    this.board.deleteTask(dialog.taskId);
    this.ui.toast('Task deleted.');
    this.ui.closeDialog();
  }

  protected importTasks(): void {
    const count = this.board.importTasks(this.importText().split('\n'), this.importColumnId());
    this.ui.toast(count ? `Imported ${count} task${count === 1 ? '' : 's'}.` : 'Nothing to import.');
    if (count) this.ui.closeDialog();
  }

  protected invite(): void {
    const name = this.inviteName().trim();
    if (!name) {
      this.ui.toast('Enter a name first.');
      return;
    }
    this.board.addMember(name);
    this.ui.toast(`${name} joined the team.`);
    this.ui.closeDialog();
  }

  private toDraft(task: Task): TaskDraft {
    return {
      title: task.title,
      description: task.description,
      columnId: task.columnId,
      priority: task.priority,
      assigneeIds: [...task.assigneeIds],
      dueDate: task.dueDate ?? '',
    };
  }
}
