import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AutenticacionService } from '../services/autenticacion.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AutenticacionService).token;

  // Si no hay token (usuario no logueado), la request pasa sin modificar
  if (!token) return next(req);

  // Clonamos la request y agregamos el header
  const authReq = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });

  return next(authReq);
};
