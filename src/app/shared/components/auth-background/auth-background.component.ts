import { Component } from '@angular/core';
import { MaterialModule } from '../../material.module';

@Component({
  selector: 'app-auth-background',
  standalone: true,
  imports: [MaterialModule],
  templateUrl: './auth-background.component.html',
  styleUrl: './auth-background.component.scss'
})
export class AuthBackgroundComponent {
  readonly floatingIcons = [
    'local_grocery_store',
    'local_store',
    'shopping_cart',
    'storefront',
    'receipt_long',
    'inventory_2'
  ];
}
