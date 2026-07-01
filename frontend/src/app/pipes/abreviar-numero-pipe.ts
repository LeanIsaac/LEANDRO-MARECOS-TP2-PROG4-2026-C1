import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'abreviarNumero',
  standalone: true,
})
export class AbreviarNumeroPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (!value) return '0';
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (value >= 100) { //! Cambié el límite de 1000 a 100 para que los números mayores a 100 se muestren en formato abreviado
      return (value / 100).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return value.toString();
  }
}
