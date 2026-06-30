import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AutenticacionService } from '../../services/autenticacion.service';

@Component({
  selector: 'app-inicializando',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inicializando.html',
})
export class Inicializando implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private authService = inject(AutenticacionService);
  private platformId = inject(PLATFORM_ID);

  private readonly apiAutorizar = `${environment.apiUrl}/autenticacion/autorizar`;

  ngOnInit(): void {
    // Forzamos a que corra únicamente en el navegador para evitar bloqueos de SSR
    if (isPlatformBrowser(this.platformId)) {
      this.validarAccesoInicial();
    }
  }

  async validarAccesoInicial(): Promise<void> {
    const token = localStorage.getItem('ello_jwt');

    // 1. Si ni siquiera hay token local, lo mandamos al login de una
    if (!token) {
      this.redirigirAlLogin();
      return;
    }

    try {
      // 2. Si tenemos token, lo enviamos a la API de validación
      // Enviamos un objeto vacío porque tu AuthInterceptor le pega el token en los headers
      const datosUsuario = await firstValueFrom(
        this.http.post<any>(this.apiAutorizar, {})
      );

      // 3. Si el token es válido, actualizamos el estado global y arrancamos los contadores
      this.authService.usuarioActual.set(datosUsuario);
      this.authService.iniciarContadoresSesion();

      // 4. Redirección exitosa al Home
      this.router.navigate(['/publicaciones']);

    } catch (err) {
      // 5. Si la API devuelve 401 (vencido/alterado) o falla la red, limpieza y al login
      console.error('Validación inicial fallida:', err);
      this.authService.logout(); // Limpia localStorage y redirige de forma segura
    }
  }

  private redirigirAlLogin(): void {
    // Pequeño delay de 800ms solo para que el spinner no desaparezca tan violentamente (UX)
    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 800);
  }
}
