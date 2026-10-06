import { Component, computed, inject } from '@angular/core';
import { isOverdue, priorityLabel, todayStamp, PRIORITIES } from '../board.models';
import { BoardService } from '../board.service';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.html',
  styleUrl: './overview.scss',
  host: { class: 'scroll-pane' },
})
export class Overview {
  private readonly board = inject(BoardService);
  protected readonly priorityLabel = priorityLabel;

  protected readonly stats = computed(() => {
    const tasks = this.board.tasks();
    const columns = this.board.columns();
    const today = todayStamp();
    const open = tasks.filter((task) => !columns.find((column) => column.id === task.columnId)?.isDone);
    const overdue = tasks.filter((task) => isOverdue(task, columns, today));
    const done = tasks.length - open.length;
    const max = Math.max(1, ...columns.map((column) => tasks.filter((task) => task.columnId === column.id).length));
    return {
      open: open.length,
      overdue: overdue.length,
      done,
      members: this.board.members().length,
      columns: columns.map((column) => {
        const count = tasks.filter((task) => task.columnId === column.id).length;
        return { id: column.id, name: column.name, count, width: (count / max) * 100 };
      }),
      priorities: PRIORITIES.map((priority) => ({
        ...priority,
        count: tasks.filter((task) => task.priority === priority.id).length,
      })),
      workload: this.board.members().map((member) => ({
        ...member,
        count: open.filter((task) => task.assigneeIds.includes(member.id)).length,
      })),
    };
  });
}
