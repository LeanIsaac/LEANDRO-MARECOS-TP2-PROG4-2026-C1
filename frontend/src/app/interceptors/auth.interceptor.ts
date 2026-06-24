import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);

  // Si la petición se ejecuta en el Servidor (SSR), pasa de largo sin tocar el LocalStorage
  if (!isPlatformBrowser(platformId)) {
    return next(req);
  }

  // Si ya estamos en el Navegador, leemos directamente la KEY exacta de tu AutenticacionService
  const token = localStorage.getItem('ello_jwt');

  // Log temporal en consola para que veas en vivo si el token se inyecta o no
  console.log(`[Interceptor Cliente] URL: ${req.url} | Token Encontrado: ${!!token}`);

  // Si hay token, clonamos la petición e inyectamos la cabecera reglamentaria
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req);
};
