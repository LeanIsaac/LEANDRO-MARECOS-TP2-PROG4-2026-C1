import { Component, inject, signal, OnInit, PLATFORM_ID} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import Swal from 'sweetalert2';
import { RouterLink } from "@angular/router";
import { FiltoCensuraPipe } from '../../pipes/filto-censura-pipe';
import { AbreviarNumeroPipe } from '../../pipes/abreviar-numero-pipe';



// Definimos una interfaz limpia para tipar las publicaciones en base a tu backend
interface Publicacion {
  _id: string;
  titulo: string;
  descripcion: string;
  fotoUrl?: string;
  likes: string[];
  createdAt: Date;
  usuarioId: {
    nombre: string;
    apellido: string;
    nombreUsuario: string;
    fotoPerfilUrl?: string;
  };
}

@Component({
  selector: 'app-publicaciones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe, RouterLink, FiltoCensuraPipe, AbreviarNumeroPipe],
  templateUrl: './publicaciones.html', // Vinculado a tu publicaciones.html
})
export class Publicaciones implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient); // Inyección directa moderna de Angular
  private platformId = inject(PLATFORM_ID);

  // URL base de tu backend de NestJS
  // private apiUrl = 'http://localhost:3000/publicaciones';
  private  apiUrl = `${environment.apiUrl}/publicaciones`;

  publicaciones = signal<Publicacion[]>([]);
  loading = signal(false);
  creandoPost = signal(false);
  ordenActual = signal<'fecha' | 'likes'>('fecha'); // Ordenamiento dinámico

  // Paginación
  limit = signal(5);
  offset = signal(0);

  // Manejo de archivos para la imagen opcional del post
  imagenSeleccionada: File | null = null;
  imagenPreview = signal<string | null>(null);

  formPost = this.fb.group({
    titulo: ['', [Validators.required, Validators.maxLength(100)]],
    descripcion: ['', [Validators.required]],
  });

  // Getters para validar limpio en el HTML
  get titulo() { return this.formPost.get('titulo')!; }
  get descripcion() { return this.formPost.get('descripcion')!; }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
    this.cargarPublicaciones();
    }
  }

  // ── 1. LEER PUBLICACIONES (Con Filtros, Orden y Paginación) ──
  async cargarPublicaciones(): Promise<void> {
    this.loading.set(true);
    try {

      const url = `${this.apiUrl}?orden=${this.ordenActual()}&limit=${this.limit()}&offset=${this.offset()}`;

      // Convertimos el Observable a Promesa usando firstValueFrom
      const res = await firstValueFrom(this.http.get<Publicacion[]>(url));
      this.publicaciones.set(res);
    } catch (err) {
      console.error('Error al cargar feed:', err);
    } finally {
      this.loading.set(false);
    }
  }

  // Intercambiar orden del feed de forma dinámica
  cambiarOrden(nuevoOrden: 'fecha' | 'likes') {
    this.ordenActual.set(nuevoOrden);
    this.offset.set(0); // Reseteamos el desplazamiento al cambiar el filtro
    this.cargarPublicaciones();
  }

  // ── 2. CAPTURAR E INYECTAR IMAGEN EN EL FORM ──
  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.imagenSeleccionada = file;
    const reader = new FileReader();
    reader.onload = () => this.imagenPreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  removerFoto(): void {
    this.imagenSeleccionada = null;
    this.imagenPreview.set(null);
  }

  // ── 3. POSTEAR NUEVA PUBLICACIÓN ──
  async crearPublicacion(): Promise<void> {
    if (this.formPost.invalid) {
      this.formPost.markAllAsTouched();
      return;
    }
    this.creandoPost.set(true);

    try {

      const formData = new FormData();
      formData.append('titulo', this.formPost.value.titulo!);
      formData.append('descripcion', this.formPost.value.descripcion!); // Mapea con backend

      if (this.imagenSeleccionada) {
        formData.append('foto', this.imagenSeleccionada);
      }

      await firstValueFrom(this.http.post(this.apiUrl, formData));

      this.formPost.reset();
      this.removerFoto();
      this.offset.set(0); // Volvemos al inicio de la paginación para ver el nuevo post
      this.cargarPublicaciones();
    } catch (err) {
      console.error('Error al publicar:', err);
    } finally {
      this.creandoPost.set(false);
    }
  }

  // ── 4. BAJA LÓGICA DE PUBLICACIÓN ──
  async eliminarPost(id: string): Promise<void> {

    const resultado = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta publicación se dará de baja y dejará de ser visible en el feed.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ea580c', // Color naranja de tu paleta Tailwind (orange-600)
      cancelButtonColor: '#27272a',  // Color zinc oscuro para el cancelar (zinc-800)
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: '#18181b', // Fondo oscuro a tono con tu Premium Dark (zinc-900)
      color: '#ffffff' // Texto blanco
    });

    // Si el usuario tocó "Cancelar", cortamos la ejecución acá
    if (!resultado.isConfirmed) return;

    // Si confirmó, ejecutamos la baja lógica hacia el backend de Render
    try {
      await firstValueFrom(this.http.delete(`${this.apiUrl}/${id}`));

      // Filtramos la publicación borrada localmente de forma reactiva
      this.publicaciones.update(posts => posts.filter(p => p._id !== id));

      // Mostramos un mensaje flotante (Toast) de éxito que se cierra solo en 2 segundos
      Swal.fire({
        title: '¡Eliminado!',
        text: 'La publicación fue eliminada con éxito.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        background: '#18181b',
        color: '#ffffff'
      });

    } catch (err) {
      console.error('Error al eliminar:', err);

      // Alerta estética en caso de error de red o permisos
      Swal.fire({
        title: 'Error',
        text: 'No tenés permisos para eliminar esta publicación.',
        icon: 'error',
        background: '#18181b',
        color: '#ffffff',
        confirmButtonColor: '#ea580c'
      });
    }
  }

  // ── 5. SWITCH DINÁMICO DE ME GUSTA ──
  async toggleLike(post: any): Promise<void> {
    // xtraemos el ID del usuario actual de manera segura desde el token guardado
    const token = localStorage.getItem('ello_jwt');
    if (!token) return;

    // Decodificamos la sección media (payload) del JWT para saber quiénes somos en tiempo real
    const payload = JSON.parse(atob(token.split('.')[1]));
    const miUsuarioId = payload.sub;

    // Evaluamos el estado: si mi ID ya está en la lista de likes del post, lo saco
    const yaLeDiLike = post.likes.includes(miUsuarioId);
    const url = `${this.apiUrl}/${post._id}/like`;

    try {
      if (yaLeDiLike) {
        // Enviar petición DELETE al backend para quitar el like
        await firstValueFrom(this.http.delete(url));

        // Actualizamos de manera reactiva el Signal local para no recargar toda la API
        this.publicaciones.update(posts =>
          posts.map(p => p._id === post._id
            ? { ...p, likes: p.likes.filter(id => id !== miUsuarioId) }
            : p
          )
        );
      } else {
        // Enviar petición POST al backend para dar el like
        await firstValueFrom(this.http.post(url, {}));

        // Sumamos nuestro ID al array local instantáneamente
        this.publicaciones.update(posts =>
          posts.map(p => p._id === post._id
            ? { ...p, likes: [...p.likes, miUsuarioId] }
            : p
          )
        );
      }
    } catch (err) {
      console.error('Error al procesar el Me gusta:', err);
    }
  }

  usuarioYaDioLike(likesArray: string[]): boolean {
    const token = localStorage.getItem('ello_jwt');
    if (!token) return false;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return likesArray.includes(payload.sub);
  }

  // ── 6. CONTROL DE PAGINACIÓN (AVANZAR Y RETROCEDER) ──
  paginaSiguiente(): void {
    // Sumamos el límite actual al offset para avanzar a los próximos 5 posts
    this.offset.update(current => current + this.limit());
    this.cargarPublicaciones();
    this.scrollHaciaArriba();
  }

  paginaAnterior(): void {
    // Restamos el límite al offset para volver atrás
    if (this.offset() > 0) {
      this.offset.update(current => current - this.limit());
      this.cargarPublicaciones();
      this.scrollHaciaArriba();
    }
  }

  // Getters auxiliares para manejar los deshabilitados en los botones
  get puedeRetroceder(): boolean {
    return this.offset() > 0;
  }

  get puedeAvanzar(): boolean {
    // significa que ya llegamos al final de la base de datos y no hay más hojas.
    return this.publicaciones().length === this.limit();
  }

  // Helper estético para mejorar la UX al cambiar de página
  private scrollHaciaArriba(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}
