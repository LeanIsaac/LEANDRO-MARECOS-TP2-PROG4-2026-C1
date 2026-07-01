import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatoRol',
  standalone: true
})
export class FormatoRolPipe implements PipeTransform {
  transform(value: string | undefined): string {
    if (!value) return 'INVITADO';
    switch (value.toLowerCase()) {
      case 'administrador':
        return 'ADMINISTRADOR GENERAL';
      case 'usuario':
        return 'MIEMBRO DE LA COMUNIDAD';
      default:
        return value.toUpperCase();
    }
  }
}
