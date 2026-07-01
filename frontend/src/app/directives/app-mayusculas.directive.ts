
//   selector: '[appAppMayusculasDirective]',

import { Directive, ElementRef, HostListener, inject, Renderer2 } from '@angular/core';

@Directive({
  selector: 'input[appMayusculas], textarea[appMayusculas]',
  standalone: true
})
export class AppMayusculasDirective {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  // Escucha cada vez que el usuario escribe
  @HostListener('input') onInput() {
    const valorActual = this.el.nativeElement.value;

    // Convertimos el texto a mayúsculas y lo volvemos a inyectar en el campo
    this.renderer.setProperty(
      this.el.nativeElement,
      'value',
      valorActual.toUpperCase()
    );
  }
}
