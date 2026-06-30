import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AutenticacionService } from '../services/autenticacion.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AutenticacionService);
  const router = inject(Router);

  // Evaluamos si el token existe de forma segura
  if (authService.isLoggedIn) {
    return true; // Permitimos el paso libre al componente privado
  }

  // Si no está autenticado, lo rebotamos al login
  router.navigate(['/login']);
  return false;
};
