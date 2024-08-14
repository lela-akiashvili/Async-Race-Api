import { Routes } from '@angular/router';
import { GarageComponent } from './features/garage/garage.component';

export const routes: Routes = [
  { path: 'garage', component: GarageComponent },
  {
    path: 'winners',
    loadComponent: () =>
      import('./features/winners/winners.component').then(
        (m) => m.WinnersComponent,
      ),
  },
  {
    path: '',
    redirectTo: 'garage',
    pathMatch: 'full',
  },
];
