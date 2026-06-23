import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AutenticacionService } from '../../services/autenticacion.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './registro.html',
})
export class Registro {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AutenticacionService);

  loading = signal(false);
  errorMsg = signal('');
  showPwd = signal(false);
  showPwdC = signal(false);
  avatarPreview = signal<string | null>(null);

  form = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    apellido: ['', [Validators.required, Validators.minLength(2)]],
    usuario: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    confirmarPassword: ['', Validators.required],
    avatar: [null as File | null],
    fechaNacimiento: ['', [Validators.required]],
    descripcion: ['', [Validators.maxLength(200)]],
  });

  /* ── Getters de acceso rápido ── */
  get nombre() {
    return this.form.get('nombre')!;
  }
  get apellido() {
  return this.form.get('apellido')!;
}
  get usuario() {
    return this.form.get('usuario')!;
  }
  get email() {
    return this.form.get('email')!;
  }
  get password() {
    return this.form.get('password')!;
  }
  get confirmar() {
    return this.form.get('confirmarPassword')!;
  }

  get fechaNacimiento() {
  return this.form.get('fechaNacimiento')!;
}
get descripcion() {
  return this.form.get('descripcion')!;
}

  /* ── Preview del avatar ── */
  onAvatarChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.form.patchValue({ avatar: file });
    const reader = new FileReader();
    reader.onload = () => this.avatarPreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  /* ── Submit ── */

async onSubmit(): Promise<void> {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }
  this.loading.set(true);
  this.errorMsg.set('');

  try {
    const formData = new FormData();

    // Mapeamos los valores del formulario a lo que pide el backend:
    formData.append('nombre', this.form.value.nombre!);
    formData.append('apellido', this.form.value.apellido!);
    formData.append('correo', this.form.value.email!);
    formData.append('nombreUsuario', this.form.value.usuario!);
    formData.append('password', this.form.value.password!);
    formData.append('repetirPassword', this.form.value.confirmarPassword!);
    formData.append('fechaNacimiento', this.form.value.fechaNacimiento!);

    if (this.form.value.descripcion) {
    formData.append('descripcion', this.form.value.descripcion);
    }

    if (this.form.value.avatar) {
      formData.append('foto', this.form.value.avatar); // El service lo busca como 'foto'
    }

    // Enviamos el formData procesado directamente
    await firstValueFrom(this.authService.registrar(formData));

    this.router.navigate(['/publicaciones']);

  } catch (err: any) {
    console.error(err);
    const raw = err?.error?.message ?? 'Error al registrarse. Intentá de nuevo.';
    this.errorMsg.set(Array.isArray(raw) ? raw[0] : raw);
  } finally {
    this.loading.set(false);
  }
}
}
