import { Component, inject } from '@angular/core';
import { UiService } from '../ui.service';

@Component({
  selector: 'app-toasts',
  templateUrl: './toasts.html',
  styleUrl: './toasts.scss',
})
export class Toasts {
  protected readonly ui = inject(UiService);
}
