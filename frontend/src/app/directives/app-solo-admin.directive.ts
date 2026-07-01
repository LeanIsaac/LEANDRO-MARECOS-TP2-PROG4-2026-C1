import { Directive, ElementRef, inject, OnInit } from '@angular/core';
import { AutenticacionService } from '../services/autenticacion.service';

@Directive({
  selector: '[appAppSoloAdmin]',
  standalone: true
})
export class AppSoloAdminDirective implements OnInit {
  private el = inject(ElementRef);
  private authService = inject(AutenticacionService);

  ngOnInit(): void {
    const usuario = this.authService.usuarioActual();
    if (!usuario || usuario.perfil !== 'administrador') {
      // Si no es admin, hacemos desaparecer el elemento de raíz
      this.el.nativeElement.style.display = 'none';
      this.el.nativeElement.remove();
    }
  }
}
