import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filtoCensura',
  standalone: true
})
export class FiltoCensuraPipe implements PipeTransform {
  private palabrasProhibidas = ['bobo', 'malo', 'inutil', 'tonto', 'basura'];

  transform(value: string): string {
    if (!value) return '';
    let textoFiltrado = value;

    this.palabrasProhibidas.forEach(palabra => {
      const regex = new RegExp(`\\b${palabra}\\b`, 'gi');
      textoFiltrado = textoFiltrado.replace(regex, '*'.repeat(palabra.length));
    });

    return textoFiltrado;
  }
}
