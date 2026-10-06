import { Component, computed, inject, signal } from '@angular/core';
import { avatarColor, initials, relativeTime } from '../board.models';
import { BoardService } from '../board.service';
import { UiService } from '../ui.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  protected readonly board = inject(BoardService);
  protected readonly ui = inject(UiService);
  protected readonly relativeTime = relativeTime;
  protected readonly initials = initials;
  protected readonly avatarColor = avatarColor;
  protected readonly editing = signal(false);
  protected readonly notesOpen = signal(false);
  private seenSnapshot: string | null = null;
  private cancelTitle = false;

  protected readonly unseen = computed(() => {
    const seen = this.ui.notificationsSeenAt();
    const activity = this.board.activity();
    if (!seen) return activity.length;
    return activity.filter((item) => item.at > seen).length;
  });

  protected startEdit(): void {
    this.cancelTitle = false;
    this.editing.set(true);
  }

  protected commitTitle(event: Event): void {
    if (this.cancelTitle) {
      this.cancelTitle = false;
      this.editing.set(false);
      return;
    }
    this.board.setTitle((event.target as HTMLInputElement).value);
    this.editing.set(false);
  }

  protected cancelEdit(): void {
    this.cancelTitle = true;
    this.editing.set(false);
  }

  protected toggleNotes(): void {
    if (this.notesOpen()) {
      this.notesOpen.set(false);
      return;
    }
    this.seenSnapshot = this.ui.notificationsSeenAt();
    this.notesOpen.set(true);
    const latest = this.board.activity()[0]?.at;
    if (latest) this.ui.markNotificationsSeen(latest);
  }

  protected isNew(at: string): boolean {
    return !!this.seenSnapshot && at > this.seenSnapshot;
  }
}
