import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import Swal from 'sweetalert2';

interface UsuarioAdminView {
  _id: string;
  nombre: string;
  apellido: string;
  correo: string;
  nombreUsuario: string;
  perfil: 'usuario' | 'administrador';
  habilitado: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './usuarios.html',
})
export class Usuarios implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);

  private apiUsuarios = `${environment.apiUrl}/usuarios`;

  usuarios = signal<UsuarioAdminView[]>([]);
  loading = signal(true);
  submitting = signal(false);

  // Formulario Reactivo exigido para dar de alta desde el panel
  formNuevoUsuario = this.fb.group({
    nombre: ['', [Validators.required]],
    apellido: ['', [Validators.required]],
    correo: ['', [Validators.required, Validators.email]],
    nombreUsuario: ['', [Validators.required, Validators.minLength(4)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    fechaNacimiento: ['', [Validators.required]],
    perfil: ['usuario', [Validators.required]] // Controlado por Radio Buttons en el HTML
  });

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  async cargarUsuarios(): Promise<void> {
    this.loading.set(true);
    try {
      const lista = await firstValueFrom(this.http.get<UsuarioAdminView[]>(this.apiUsuarios));
      this.usuarios.set(lista);
    } catch (err) {
      console.error('Error al cargar listado:', err);
    } finally {
      this.loading.set(false);
    }
  }

  // Formulario de alta para nuevos usuarios (con rol variable)
  async registrarUsuarioDesdePanel(): Promise<void> {
    if (this.formNuevoUsuario.invalid) {
      this.formNuevoUsuario.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    try {
      await firstValueFrom(this.http.post(this.apiUsuarios, this.formNuevoUsuario.value));

      Swal.fire({
        title: '¡Alta Correcta!',
        text: `El usuario fue creado con el rol de ${this.formNuevoUsuario.value.perfil}.`,
        icon: 'success',
        background: '#18181b',
        color: '#ffffff'
      });

      this.formNuevoUsuario.reset({ perfil: 'usuario' });
      this.cargarUsuarios(); // Recargo la lista
    } catch (err: any) {
      const msg = err?.error?.message ?? 'Ocurrió un error al procesar el alta.';
      Swal.fire({ title: 'Error', text: Array.isArray(msg) ? msg[0] : msg, icon: 'error', background: '#18181b', color: '#ffffff' });
    } finally {
      this.submitting.set(false);
    }
  }

  // Alternar estados de Alta y Baja Lógica
  async cambiarEstadoLogico(usuario: UsuarioAdminView): Promise<void> {
    const palabraAccion = usuario.habilitado ? 'deshabilitar' : 'rehabilitar';

    const confirmar = await Swal.fire({
      title: `¿Confirmás ${palabraAccion} al usuario?`,
      text: `El usuario @${usuario.nombreUsuario} ${usuario.habilitado ? 'perderá' : 'recuperará'} el acceso inmediato al sistema.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: usuario.habilitado ? '#dc2626' : '#16a34a', // Rojo para baja, Verde para alta
      cancelButtonColor: '#27272a',
      confirmButtonText: 'Sí, confirmar',
      background: '#18181b',
      color: '#ffffff'
    });

    if (!confirmar.isConfirmed) return;

    try {
      if (usuario.habilitado) {
        // Enviar DELETE para dar la baja lógica
        await firstValueFrom(this.http.delete(`${this.apiUsuarios}/${usuario._id}`));
      } else {
        // Enviar POST para rehabilitar (alta lógica)
        await firstValueFrom(this.http.post(`${this.apiUsuarios}/${usuario._id}/rehabilitar`, {}));
      }

      // Actualizamos el estado de la lista
      this.usuarios.update(listaActual =>
        listaActual.map(u => u._id === usuario._id ? { ...u, habilitado: !u.habilitado } : u)
      );

      Swal.fire({ title: 'Estado actualizado', icon: 'success', timer: 1500, showConfirmButton: false, background: '#18181b', color: '#ffffff' });
    } catch (err: any) {
      Swal.fire({ title: 'Error', text: err?.error?.message ?? 'No se pudo alterar el estado del usuario.', icon: 'error', background: '#18181b', color: '#ffffff' });
    }
  }
}
