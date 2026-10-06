import { Component, inject, signal } from '@angular/core';
import { PRIORITIES } from '../board.models';
import { BoardService } from '../board.service';
import { DISPLAY_OPTIONS, isFilterActive, UiService, type Display } from '../ui.service';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.scss',
})
export class Toolbar {
  protected readonly board = inject(BoardService);
  protected readonly ui = inject(UiService);
  protected readonly priorities = PRIORITIES;
  protected readonly displayOptions = DISPLAY_OPTIONS;
  protected readonly filterOpen = signal(false);
  protected readonly displayOpen = signal(false);
  protected readonly isFilterActive = isFilterActive;

  protected onSearch(event: Event): void {
    this.ui.setSearch((event.target as HTMLInputElement).value);
  }

  protected toggleFilter(): void {
    this.displayOpen.set(false);
    this.filterOpen.update((open) => !open);
  }

  protected toggleDisplay(): void {
    this.filterOpen.set(false);
    this.displayOpen.update((open) => !open);
  }

  protected setDisplay(key: keyof Display, event: Event): void {
    this.ui.setDisplay({ [key]: (event.target as HTMLInputElement).checked });
  }
}
