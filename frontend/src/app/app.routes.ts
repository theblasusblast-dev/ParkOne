import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guards';
import { Home } from './features/home/home';
import { Login } from './features/login/login';
import { Shell } from './layout/shell';

export const routes: Routes = [
  { path: 'login', component: Login, canActivate: [guestGuard], title: 'Iniciar sesión · ParkOne' },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: 'inicio', component: Home, title: 'Inicio · ParkOne' },
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
    ],
  },
  { path: '**', redirectTo: '' },
];
