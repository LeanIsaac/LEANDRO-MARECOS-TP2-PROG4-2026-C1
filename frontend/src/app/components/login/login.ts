import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AutenticacionService } from '../../services/autenticacion.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
})
export class Login {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AutenticacionService);

  loading = signal(false);
  errorMsg = signal('');
  showPwd = signal(false);

  form = this.fb.group({
    identificador: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  get identificador() {
    return this.form.get('identificador')!;
  }
  get password() {
    return this.form.get('password')!;
  }

  async onSubmit(): Promise<void> {

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.errorMsg.set('');

    try { 
      const { identificador, password } = this.form.value;
      await firstValueFrom(
        this.authService.login({
          identificador: identificador!,
          password: password!,
        }),
      );
      // El service guardó el token y actualizó el signal → navegar a publicaciones que va ser mi "home"
      this.router.navigate(['/publicaciones']);
    } catch (err: any) {
      console.error(err);
      const raw = err?.error?.message ?? 'Credenciales inválidas. Intentá de nuevo.';
      this.errorMsg.set(Array.isArray(raw) ? raw[0] : raw);
    } finally {
      this.loading.set(false);
    }
  }
}
