import { Component, Input, Output, EventEmitter } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from '../../material.module';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [MaterialModule, TranslateModule],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss'
})
export class EmptyStateComponent {
  @Input() icon = 'inbox';
  @Input() message = '';
  @Input() hint = '';
  @Input() actionLabel = '';
  @Output() action = new EventEmitter<void>();

  onAction(): void {
    this.action.emit();
  }
}
