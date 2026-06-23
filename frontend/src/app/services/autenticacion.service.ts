import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

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
  perfil: 'usuario' | 'admin';
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
      this.usuarioActual.set(this.cargarUsuarioLocal());
    }
  }

  get token(): string | null {
    if (!this.isBrowser) return null; // SSR: sin token
    return localStorage.getItem(TOKEN_KEY);
  }

  get isLoggedIn(): boolean {
    return !!this.token;
  }

  // ---- Login ---

  login(dto: LoginDto): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.api}/login`, dto) // Devuelve el token
      .pipe(tap((res) => this.guardarSesion(res))); // Guarda el token en el localStorage
  }
  // ---- Registro ---
  registrar(formData: FormData): Observable<UsuarioDto> {
  // Se envía el formData directo sin desempaquetar nada
  return this.http.post<UsuarioDto>(`${this.api}/registro`, formData);
}

  logout(): void {
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
}
