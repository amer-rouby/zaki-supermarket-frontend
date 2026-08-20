import { Component, Input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from '../../material.module';

@Component({
  selector: 'app-table-loading',
  standalone: true,
  imports: [MaterialModule, TranslateModule],
  templateUrl: './table-loading.component.html',
  styleUrl: './table-loading.component.scss'
})
export class TableLoadingComponent {
  @Input() diameter = 50;
}
