import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [MatProgressSpinnerModule, TranslateModule],
  templateUrl: './loading-spinner.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './loading-spinner.component.scss'
})
export class LoadingSpinnerComponent {
  readonly isLoading = input<boolean>(false);
  readonly message = input<string>('COMMON.LOADING');
}
