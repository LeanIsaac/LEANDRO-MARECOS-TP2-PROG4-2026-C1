import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';
import { adminGuard } from './guards/admin-guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./components/inicializando/inicializando').then((m) => m.Inicializando),
  },
  { path: 'login', loadComponent: () => import('./components/login/login').then((m) => m.Login) },
  {
    path: 'registro',
    loadComponent: () => import('./components/registro/registro').then((m) => m.Registro),
  },
  {
    path: 'mi-perfil',
    canActivate: [authGuard],
    loadComponent: () => import('./components/mi-perfil/mi-perfil').then((m) => m.MiPerfil),
  },
  {
    path: 'publicaciones',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/publicaciones/publicaciones').then((m) => m.Publicaciones),
  },
  {
    path: 'publicaciones/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/detalle-publicacion/detalle-publicacion').then(
        (m) => m.DetallePublicacion,
      ),
  },
  {
    path: 'dashboard',
    canActivate: [adminGuard],
    children: [
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./components/dashboard/usuarios/usuarios').then((m) => m.Usuarios),
      },
      {
        path: 'estadisticas',
        loadComponent: () =>
          import('./components/dashboard/estadisticas/estadisticas').then((m) => m.Estadisticas),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  }, // en caso de que no se encuentre ninguna ruta, se redirige al login
];
