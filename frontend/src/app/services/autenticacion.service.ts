import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import Swal from 'sweetalert2';

// ═══════════════════════════════════════
//  Interfaces deaspues moverlo a un modelo
// ═══════════════════════════════════════

export interface LoginDto {
  identificador: string;
  password: string;
}

export interface RegisterDto {
  nombre: string;
  apellido: string;
  correo: string;
  nombreUsuario: string;
  password: string;
  repetirPassword: string;
  fechaNacimiento: string;
  descripcion?: string;
  foto?: File;
}

export interface UsuarioDto {
  _id: string;
  nombre: string;
  apellido: string;
  correo: string;
  nombreUsuario: string;
  perfil: 'usuario' | 'administrador';
  fotoPerfilUrl?: string;
  descripcion?: string;
  fechaNacimiento?: string;
}

export interface AuthResponse {
  token: string;
  usuario: UsuarioDto;
}

const TOKEN_KEY = 'ello_jwt';
const USUARIO_KEY = 'ello_usuario';

@Injectable({ providedIn: 'root' })
export class AutenticacionService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID); // 'browser' | 'server'

  private readonly api = `${environment.apiUrl}/autenticacion`;

  private alertaTimer: any;
  private expiracionTimer: any;
  private readonly TIEMPO_ALERTA = 10 * 60 * 1000; // 10 minutos
  private readonly TIEMPO_EXPIRACION = 15 * 60 * 1000; // 15 minutos

  /**
   * Guard SSR: devuelve true solo cuando el código corre en el browser.
   * localStorage, sessionStorage, window, etc. SOLO son accesibles si esto es true.
   */
  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  usuarioActual = signal<UsuarioDto | null>(null);

  constructor() {
    // En el server este bloque NO se ejecuta → sin errores de localStorage
    if (this.isBrowser) {
      const usuarioLocal = this.cargarUsuarioLocal();
      this.usuarioActual.set(usuarioLocal);

      // Si el usuario recarga la app y sigue logueado, reactivamos los relojes
      if (usuarioLocal && this.token) {
        this.iniciarContadoresSesion();
      }
    }
  }

  get token(): string | null {
    if (!this.isBrowser) return null; // SSR: sin token
    return localStorage.getItem(TOKEN_KEY);
  }

  get isLoggedIn(): boolean {
    return !!this.token;
  }
  // TIMERS Y MODALES DE SEGURIDAD
  iniciarContadoresSesion(): void {
    this.limpiarContadoresSesion();

    if (!this.isBrowser) return;

    // 1. Alerta preventiva a los 10 minutos
    this.alertaTimer = setTimeout(() => {
      this.mostrarAlertaExpiracion();
    }, this.TIEMPO_ALERTA);

    // 2. Cierre forzado definitivo a los 15 minutos
    this.expiracionTimer = setTimeout(() => {
      this.ejecutarCierreForzado('Tu sesión expiró por inactividad.');
    }, this.TIEMPO_EXPIRACION);
  }

  private async mostrarAlertaExpiracion(): Promise<void> {
    clearTimeout(this.alertaTimer);

    const resultado = await Swal.fire({
      title: '¿Seguís ahí?',
      text: 'Tu sesión va a expirar en 5 minutos por motivos de seguridad.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ea580c', // Paleta Premium Dark (Naranja)
      cancelButtonColor: '#27272a', // Zinc oscuro
      confirmButtonText: 'Permanecer conectado',
      cancelButtonText: 'Cerrar sesión',
      background: '#18181b',
      color: '#ffffff',
      allowOutsideClick: false,
      allowEscapeKey: false,
    });

    if (resultado.isConfirmed) {
      await this.refrescarTokenSesion();
    } else {
      this.logout();
    }
  }

  private async refrescarTokenSesion(): Promise<void> {
    try {
      // Consumimos el endpoint POST del backend
      const res = await firstValueFrom(
        this.http.post<{ token: string }>(`${this.api}/refrescar`, {}),
      );

      // Sobrescribimos el localStorage con el nuevo JWT de 15 minutos más
      if (this.isBrowser) {
        localStorage.setItem(TOKEN_KEY, res.token);
      }

      // Reseteamos los cronómetros a cero
      this.iniciarContadoresSesion();

      Swal.fire({
        title: 'Sesión renovada',
        text: 'Tu conexión se extendió correctamente.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        background: '#18181b',
        color: '#ffffff',
      });
    } catch (err) {
      console.error('Error al renovar sesión:', err);
      this.ejecutarCierreForzado('Error de autenticación al renovar el token.');
    }
  }

  private limpiarContadoresSesion(): void {
    if (this.alertaTimer) clearTimeout(this.alertaTimer);
    if (this.expiracionTimer) clearTimeout(this.expiracionTimer);
  }

  private ejecutarCierreForzado(mensaje: string): void {
    this.logout();
    Swal.fire({
      title: 'Sesión Finalizada',
      text: mensaje,
      icon: 'info',
      background: '#18181b',
      color: '#ffffff',
      confirmButtonColor: '#ea580c',
    });
  }

  // ---- Login ---

  login(dto: LoginDto): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.api}/login`, dto) // Devuelve el token
      .pipe(
        tap((res) => {
          this.guardarSesion(res);
          this.iniciarContadoresSesion(); // se activa los relojes
        }),
      ); // Guarda el token en el localStorage
  }
  // ---- Registro ---
  registrar(formData: FormData): Observable<UsuarioDto> {
    // Se envía el formData directo sin desempaquetar nada
    return this.http.post<UsuarioDto>(`${this.api}/registro`, formData);
  }

  logout(): void {
    this.limpiarContadoresSesion();
    if (this.isBrowser) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USUARIO_KEY);
    }
    this.usuarioActual.set(null);
    this.router.navigate(['/login']);
  }

  private guardarSesion(res: AuthResponse): void {
    if (this.isBrowser) {
      localStorage.setItem(TOKEN_KEY, res.token);
      localStorage.setItem(USUARIO_KEY, JSON.stringify(res.usuario));
    }
    this.usuarioActual.set(res.usuario);
  }

  private cargarUsuarioLocal(): UsuarioDto | null {
    if (!this.isBrowser) return null;
    const raw = localStorage.getItem(USUARIO_KEY);
    return raw ? (JSON.parse(raw) as UsuarioDto) : null;
  }

  isPremium(): boolean {
    const usuario = this.usuarioActual();
    return usuario?.perfil === 'administrador';
  }
}
