import { Directive, Input, HostListener, inject, ElementRef, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appDeshabilitarVacio]',
  standalone: true
})
export class AppDeshabilitarVacioDirective {
  private el = inject(ElementRef); // El botón
  private renderer = inject(Renderer2);

  @Input('appDeshabilitarVacio') inputTexto!: string;

  // Escucha los cambios globales para evaluar el estado del botón
  @HostListener('window:keyup') ngOnChanges() {
    if (!this.inputTexto || this.inputTexto.trim().length === 0) {
      this.renderer.setProperty(this.el.nativeElement, 'disabled', true);
      this.renderer.setStyle(this.el.nativeElement, 'opacity', '0.4');
    } else {
      this.renderer.setProperty(this.el.nativeElement, 'disabled', false);
      this.renderer.setStyle(this.el.nativeElement, 'opacity', '1');
    }
  }
}
