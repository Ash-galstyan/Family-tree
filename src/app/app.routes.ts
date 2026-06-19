import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'family-tree',
    pathMatch: 'full'
  },
  {
    path: 'family-tree',
    loadComponent: () => import('./components/unity-container/unity-container/unity-container.component').then(m => m.UnityContainerComponent)
  }
];
