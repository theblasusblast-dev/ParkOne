import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guards';
import { Home } from './features/home/home';
import { Lane } from './features/lane/lane';
import { Login } from './features/login/login';
import { ParkingMap } from './features/map/map';
import { Shell } from './layout/shell';

export const routes: Routes = [
  { path: 'login', component: Login, canActivate: [guestGuard], title: 'Iniciar sesión · ParkOne' },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: 'inicio', component: Home, title: 'Inicio · ParkOne' },
      { path: 'mapa', component: ParkingMap, title: 'Mapa · ParkOne' },
      { path: 'carril', component: Lane, title: 'Carril · ParkOne' },
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
    ],
  },
  { path: '**', redirectTo: '' },
];
