import { Component, inject, signal, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import Swal from 'sweetalert2';

interface Publicacion {
  _id: string;
  titulo: string;
  descripcion: string;
  fotoUrl?: string;
  likes: string[];
  createdAt: Date;
  usuarioId: {
    _id: string;
    nombre: string;
    apellido: string;
    nombreUsuario: string;
    fotoPerfilUrl?: string;
  };
}

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mi-perfil.html',
  styleUrls: ['./mi-perfil.css'],
})
export class MiPerfil implements OnInit {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  private apiUrlPublicaciones = `${environment.apiUrl}/publicaciones`;

  // Estado reactivo
  usuario = signal<any>(null);
  misPosteos = signal<Publicacion[]>([]);
  loading = signal(false);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.cargarDatosPerfil();
    }
  }

  cargarDatosPerfil(): void {
    const token = localStorage.getItem('ello_jwt');
    if (!token) return;

    try {
      // Extraemos los datos básicos guardados en el token payload
      const payload = JSON.parse(atob(token.split('.')[1]));
      this.usuario.set(payload);

      // Buscamos estrictamente sus últimas 3 publicaciones
      // (Limit: 3, Offset: 0)
      this.cargarMisPublicaciones(payload.sub);
    } catch (err) {
      console.error('Error al procesar el perfil:', err);
    }
  }

  async cargarMisPublicaciones(usuarioId: string): Promise<void> {
    this.loading.set(true);
    try {
      // Configuramos la URL para filtrar por el ID del usuario y limitar a 3 posteos
      const url = `${this.apiUrlPublicaciones}?usuarioId=${usuarioId}&limit=3&offset=0&orden=fecha`;
      const res = await firstValueFrom(this.http.get<Publicacion[]>(url));
      this.misPosteos.set(res);
    } catch (err) {
      console.error('Error al cargar publicaciones del perfil:', err);
    } finally {
      this.loading.set(false);
    }
  }

  // Permite dar/quitar like desde el perfil manteniendo sincronizada la interfaz
  async toggleLike(post: Publicacion): Promise<void> {
    const token = localStorage.getItem('ello_jwt');
    if (!token || !this.usuario()) return;

    const miUsuarioId = this.usuario().sub;
    const yaLeDiLike = post.likes.includes(miUsuarioId);
    const url = `${this.apiUrlPublicaciones}/${post._id}/like`;

    try {
      if (yaLeDiLike) {
        await firstValueFrom(this.http.delete(url));
        this.misPosteos.update((posts) =>
          posts.map((p) =>
            p._id === post._id ? { ...p, likes: p.likes.filter((id) => id !== miUsuarioId) } : p,
          ),
        );
      } else {
        await firstValueFrom(this.http.post(url, {}));
        this.misPosteos.update((posts) =>
          posts.map((p) => (p._id === post._id ? { ...p, likes: [...p.likes, miUsuarioId] } : p)),
        );
      }
    } catch (err) {
      console.error('Error en interacción de like:', err);
    }
  }

  usuarioYaDioLike(likesArray: string[]): boolean {
    if (!this.usuario()) return false;
    return likesArray.includes(this.usuario().sub);
  }

  async eliminarPost(id: string): Promise<void> {
    const resultado = await Swal.fire({
      title: '¿Dar de baja?',
      text: 'Tu publicación dejará de listarse.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ea580c',
      cancelButtonColor: '#27272a',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      background: '#18181b',
      color: '#ffffff',
    });

    if (!resultado.isConfirmed) return;

    try {
      await firstValueFrom(this.http.delete(`${this.apiUrlPublicaciones}/${id}`));
      this.misPosteos.update((posts) => posts.filter((p) => p._id !== id));
      Swal.fire({
        title: 'Baja exitosa',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        background: '#18181b',
        color: '#ffffff',
      });
    } catch (err) {
      console.error(err);
    }
  }
}
