import { Component, inject, signal, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, DatePipe, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import Swal from 'sweetalert2';

interface Comentario {
  _id: string;
  contenido: string;
  modificado: boolean;
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
  selector: 'app-detalle-publicacion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, DatePipe],
  templateUrl: './detalle-publicacion.html',
})
export class DetallePublicacion implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private platformId = inject(PLATFORM_ID);

  private apiPublicaciones = `${environment.apiUrl}/publicaciones`;
  private apiComentarios = `${environment.apiUrl}/comentarios`;

  postId: string | null = null;
  publicacion = signal<any>(null);
  comentarios = signal<Comentario[]>([]);

  // Estado de carga y paginación reglamentaria
  loadingPost = signal(true);
  loadingComentarios = signal(false);
  limit = signal(5); // Tanda inicial de comentarios
  offset = signal(0); // Desplazamiento incremental
  hayMasComentarios = signal(true);

  // Formularios Reactivos para crear y editar
  formComentario = this.fb.group({
    contenido: ['', [Validators.required, Validators.maxLength(200)]],
  });

  comentarioEditandoId = signal<string | null>(null);
  formEdicion = this.fb.group({
    contenido: ['', [Validators.required, Validators.maxLength(200)]],
  });

  ngOnInit(): void {
    this.postId = this.route.snapshot.paramMap.get('id');
    if (isPlatformBrowser(this.platformId) && this.postId) {
      this.cargarPublicacion();
      this.cargarComentarios(true); // true resetea la lista
    }
  }

  async cargarPublicacion(): Promise<void> {
    try {
      // Reutilizamos el endpoint buscando todas pero filtrando por ID si el back lo permite,
      // o golpeamos directamente el findById de publicaciones de tu API.
      const res = await firstValueFrom(this.http.get<any>(`${this.apiPublicaciones}`));
      const postEncontrado = res.find((p: any) => p._id === this.postId);
      this.publicacion.set(postEncontrado);
    } catch (err) {
      console.error(err);
    } finally {
      this.loadingPost.set(false);
    }
  }

  async cargarComentarios(reset: boolean = false): Promise<void> {
    if (reset) {
      this.offset.set(0);
    }
    this.loadingComentarios.set(true);

    try {
      const url = `${this.apiComentarios}?publicacionId=${this.postId}&limit=${this.limit()}&offset=${this.offset()}`;
      const nuevosComentarios = await firstValueFrom(this.http.get<Comentario[]>(url));

      if (reset) {
        this.comentarios.set(nuevosComentarios);
      } else {
        this.comentarios.update((actuales) => [...actuales, ...nuevosComentarios]);
      }

      // Si llegaron menos del límite, ya no quedan más registros en la base de datos
      if (nuevosComentarios.length < this.limit()) {
        this.hayMasComentarios.set(false);
      } else {
        this.hayMasComentarios.set(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      this.loadingComentarios.set(false);
    }
  }

  cargarMas(): void {
    this.offset.update((current) => current + this.limit());
    this.cargarComentarios(false);
  }

  // Escribir e insertar un comentario
  async enviarComentario(): Promise<void> {
    if (this.formComentario.invalid) return;

    try {
      const body = {
        contenido: this.formComentario.value.contenido!,
        publicacionId: this.postId!,
      };

      const nuevoComentario = await firstValueFrom(
        this.http.post<Comentario>(this.apiComentarios, body),
      );

      // Lo metemos al principio de la lista de forma reactiva
      this.comentarios.update((actuales) => [nuevoComentario, ...actuales]);
      this.formComentario.reset();

      Swal.fire({
        title: '¡Comentario enviado!',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        background: '#18181b',
        color: '#ffffff',
      });
    } catch (err) {
      Swal.fire({
        title: 'Error',
        text: 'Iniciá sesión para poder comentar.',
        icon: 'error',
        background: '#18181b',
        color: '#ffffff',
      });
    }
  }

  activarEdicion(comentario: Comentario): void {
    this.comentarioEditandoId.set(comentario._id);
    this.formEdicion.setValue({ contenido: comentario.contenido });
  }

  cancelarEdicion(): void {
    this.comentarioEditandoId.set(null);
  }

  async guardarEdicion(id: string): Promise<void> {
    if (this.formEdicion.invalid) return;

    try {
      await firstValueFrom(
        this.http.put(`${this.apiComentarios}/${id}`, {
          contenido: this.formEdicion.value.contenido!,
        }),
      );

      // Actualizamos el estado local encendiendo el flag de "modificado"
      this.comentarios.update((actuales) =>
        actuales.map((c) =>
          c._id === id
            ? { ...c, contenido: this.formEdicion.value.contenido!, modificado: true }
            : c,
        ),
      );

      this.comentarioEditandoId.set(null);
    } catch (err) {
      console.error(err);
    }
  }

  esMiComentario(comentarioUsuarioId: string): boolean {
    const token = localStorage.getItem('ello_jwt');
    if (!token) return false;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub === comentarioUsuarioId;
  }
}
