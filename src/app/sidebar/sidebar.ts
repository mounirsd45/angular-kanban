import { Component, computed, inject } from '@angular/core';
import { avatarColor, initials } from '../board.models';
import { BoardService } from '../board.service';
import { UiService, type NavId } from '../ui.service';

interface NavItem {
  id: NavId;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  protected readonly board = inject(BoardService);
  protected readonly ui = inject(UiService);
  protected readonly initials = initials;
  protected readonly avatarColor = avatarColor;

  protected readonly yours: NavItem[] = [
    { id: 'inbox', label: 'Inbox', icon: 'in' },
    { id: 'my-issues', label: 'My issues', icon: 'me' },
    { id: 'projects', label: 'Projects', icon: 'pr' },
    { id: 'views', label: 'Views', icon: 'vw' },
  ];

  protected readonly team: NavItem[] = [
    { id: 'team-issues', label: 'Team issues', icon: 'is' },
    { id: 'team-projects', label: 'Team projects', icon: 'tp' },
    { id: 'team-views', label: 'Team views', icon: 'tv' },
  ];

  protected readonly counts = computed(() => {
    const tasks = this.board.tasks();
    const columns = this.board.columns();
    const today = new Date();
    const stamp = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const inbox = tasks.filter((task) => {
      const column = columns.find((item) => item.id === task.columnId);
      if (column?.isDone) return false;
      return task.assigneeIds.length === 0 || (!!task.dueDate && task.dueDate < stamp);
    }).length;
    const mine = tasks.filter((task) => task.assigneeIds.includes(this.board.currentUserId())).length;
    return { inbox, mine, issues: tasks.length };
  });

  protected countFor(id: NavId): number | null {
    if (id === 'inbox') return this.counts().inbox;
    if (id === 'my-issues') return this.counts().mine;
    if (id === 'team-issues') return this.counts().issues;
    return null;
  }

  protected select(id: NavId): void {
    this.ui.setNav(id);
  }

  protected reset(): void {
    if (!confirm('Replace the board with the original sample tasks?')) return;
    this.board.reset();
    this.ui.closeDialog();
    this.ui.clearFilter();
    this.ui.setSearch('');
    this.ui.toast('Sample board restored.');
  }
}
