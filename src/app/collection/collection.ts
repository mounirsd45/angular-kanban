import { Component, computed, inject, input } from '@angular/core';
import {
  avatarColor,
  formatDay,
  initials,
  isOverdue,
  priorityLabel,
  todayStamp,
  type Task,
} from '../board.models';
import { BoardService } from '../board.service';
import { UiService, type NavId } from '../ui.service';

@Component({
  selector: 'app-collection',
  templateUrl: './collection.html',
  styleUrl: './collection.scss',
  host: { class: 'scroll-pane' },
})
export class Collection {
  readonly mode = input.required<'inbox' | 'mine' | 'empty'>();
  protected readonly board = inject(BoardService);
  protected readonly ui = inject(UiService);
  protected readonly priorityLabel = priorityLabel;
  protected readonly formatDay = formatDay;
  protected readonly initials = initials;
  protected readonly avatarColor = avatarColor;

  protected readonly heading = computed(() => {
    if (this.mode() === 'inbox') return 'Inbox';
    if (this.mode() === 'mine') return 'My issues';
    return this.label(this.ui.nav());
  });

  protected readonly tasks = computed(() => {
    const today = todayStamp();
    const columns = this.board.columns();
    if (this.mode() === 'inbox') {
      return this.board.tasks().filter((task) => {
        const column = columns.find((item) => item.id === task.columnId);
        if (column?.isDone) return false;
        return task.assigneeIds.length === 0 || isOverdue(task, columns, today);
      });
    }
    if (this.mode() === 'mine') {
      return this.board.tasks().filter((task) => task.assigneeIds.includes(this.board.currentUserId()));
    }
    return [];
  });

  protected overdue(task: Task): boolean {
    return isOverdue(task, this.board.columns(), todayStamp());
  }

  protected open(task: Task): void {
    this.ui.openDialog({ type: 'task', taskId: task.id });
  }

  private label(nav: NavId): string {
    switch (nav) {
      case 'projects':
        return 'Projects';
      case 'views':
        return 'Views';
      case 'team-projects':
        return 'Team projects';
      case 'team-views':
        return 'Team views';
      default:
        return 'Empty';
    }
  }
}
