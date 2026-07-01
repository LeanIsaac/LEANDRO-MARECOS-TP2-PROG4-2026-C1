import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AutenticacionService } from '../services/autenticacion.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AutenticacionService);
  const router = inject(Router);

  if (authService.isLoggedIn && authService.isPremium()) {
    return true; // Acceso concedido al panel de control
  }

  // Si no es admin o no está logueado, lo mandamos al feed de publicaciones
  router.navigate(['/publicaciones']);
  return false;
};
