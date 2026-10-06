import { Component, DestroyRef, inject } from '@angular/core';
import { Board } from './board/board';
import { Collection } from './collection/collection';
import { Dialogs } from './dialogs/dialogs';
import { Header } from './header/header';
import { Overview } from './overview/overview';
import { Sidebar } from './sidebar/sidebar';
import { Toasts } from './toasts/toasts';
import { Toolbar } from './toolbar/toolbar';
import { UiService } from './ui.service';
import { Updates } from './updates/updates';

@Component({
  selector: 'app-root',
  imports: [Sidebar, Header, Toolbar, Board, Overview, Updates, Collection, Dialogs, Toasts],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly ui = inject(UiService);

  constructor() {
    const destroyRef = inject(DestroyRef);
    const onKey = (event: KeyboardEvent) => this.onKey(event);
    window.addEventListener('keydown', onKey);
    destroyRef.onDestroy(() => window.removeEventListener('keydown', onKey));
  }

  private onKey(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.ui.dialog()) {
      event.preventDefault();
      this.ui.closeDialog();
      return;
    }
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (this.ui.dialog() || this.isTyping(event.target)) return;
    if (event.key === '/') {
      event.preventDefault();
      this.ui.setNav('team-issues');
      this.ui.setTab('issues');
      setTimeout(() => document.getElementById('board-search')?.focus());
    } else if (event.key === 'n' || event.key === 'N') {
      event.preventDefault();
      this.ui.setNav('team-issues');
      this.ui.openDialog({ type: 'new-task' });
    } else if (event.key === '?') {
      event.preventDefault();
      this.ui.openDialog({ type: 'help' });
    } else if (event.key === '[') {
      event.preventDefault();
      if (window.innerWidth < 860) this.ui.setSidebarOpen(!this.ui.sidebarOpen());
      else this.ui.toggleSidebarCollapsed();
    }
  }

  private isTyping(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
  }
}
