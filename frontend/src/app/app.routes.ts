import { Routes } from '@angular/router';

export const routes: Routes = [
{ path: '', loadComponent: () => import('./components/login/login').then(m => m.Login) },
{ path: '', redirectTo: 'login', pathMatch: 'full' },
{ path: 'registro', loadComponent: () => import('./components/registro/registro').then(m => m.Registro) },
{ path: 'mi-perfil', loadComponent: () => import('./components/mi-perfil/mi-perfil').then(m => m.MiPerfil) },
{ path: 'publicaciones', loadComponent: () => import('./components/publicaciones/publicaciones').then(m => m.Publicaciones) },
{ path: 'publicaciones/:id', loadComponent: () => import('./components/detalle-publicacion/detalle-publicacion').then(m => m.DetallePublicacion) },
{ path: '**', redirectTo: '' } // en caso de que no se encuentre ninguna ruta, se redirige al login
];
