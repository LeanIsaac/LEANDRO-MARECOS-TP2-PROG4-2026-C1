import { Directive, ElementRef, HostListener, inject, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appBordeHover]',
  standalone: true
})
export class AppBordeHoverDirective {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  @HostListener('mouseenter') onMouseEnter() {
    this.renderer.setStyle(this.el.nativeElement, 'border-color', '#ea580c');
    this.renderer.setStyle(this.el.nativeElement, 'box-shadow', '0 0 15px rgba(234, 88, 12, 0.15)');
    this.renderer.setStyle(this.el.nativeElement, 'transition', 'all 0.3s ease');
  }

  @HostListener('mouseleave') onMouseLeave() {
    this.renderer.setStyle(this.el.nativeElement, 'border-color', '#27272a'); // Vuelve al zinc oscuro original
    this.renderer.setStyle(this.el.nativeElement, 'box-shadow', 'none');
  }
}
