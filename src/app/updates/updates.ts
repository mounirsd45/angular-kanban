import { Component, computed, inject } from '@angular/core';
import { relativeTime } from '../board.models';
import { BoardService } from '../board.service';
import { UiService } from '../ui.service';

@Component({
  selector: 'app-updates',
  templateUrl: './updates.html',
  styleUrl: './updates.scss',
  host: { class: 'scroll-pane' },
})
export class Updates {
  private readonly board = inject(BoardService);
  private readonly ui = inject(UiService);
  protected readonly relativeTime = relativeTime;

  protected readonly items = computed(() => {
    const search = this.ui.search().trim().toLowerCase();
    return this.board.activity().filter((item) => !search || item.text.toLowerCase().includes(search));
  });
}
