import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { AuthGuard } from '../autenticacion/guards/auth.guard';
import { Usuario } from './entities/usuario.schema';
import * as bcrypt from 'bcrypt'; // Usamos bcrypt para encriptar la clave de los nuevos usuarios desde el panel

@Controller('usuarios')
@UseGuards(AuthGuard)
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  // ── 1. LISTADO DE USUARIOS (Sólo Admin) ──
  @Get()
  @HttpCode(HttpStatus.OK)
  async listar(@Req() req: any) {
    this.verificarRolAdmin(req.user);
    return this.usuariosService.listarTodos();
  }

  // ── 2. ALTA DE NUEVO USUARIO DESDE PANEL (Sólo Admin) ──
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async crearDesdePanel(@Req() req: any, @Body() body: Partial<Usuario>) {
    this.verificarRolAdmin(req.user);

    if (!body.correo || !body.nombreUsuario || !body.password || !body.perfil) {
      throw new BadRequestException(
        'Faltan campos obligatorios para dar de alta al usuario.',
      );
    }

    // Comprobamos duplicados
    const existe = await this.usuariosService.existeCorreoOUsuario(
      body.correo,
      body.nombreUsuario,
    );
    if (existe) {
      throw new BadRequestException(
        'El correo electrónico o nombre de usuario ya se encuentran registrados.',
      );
    }

    // Encriptamos la clave por seguridad antes de impactar en Mongo
    const salt = await bcrypt.genSalt(10);
    body.password = await bcrypt.hash(body.password, salt);

    // Forzamos a que nazca habilitado por defecto
    body.habilitado = true;

    return this.usuariosService.crear(body);
  }

  // ── 3. BAJA LÓGICA: DESHABILITAR (Sólo Admin) ──
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deshabilitar(@Param('id') id: string, @Req() req: any) {
    this.verificarRolAdmin(req.user);

    // Evitamos que el administrador se deshabilite a sí mismo
    if (req.user.sub === id) {
      throw new BadRequestException(
        'No podés deshabilitar tu propia cuenta de administrador.',
      );
    }

    return this.usuariosService.deshabilitar(id);
  }

  // ── 4. ALTA LÓGICA: REHABILITAR (Sólo Admin) ──
  @Post(':id/rehabilitar')
  @HttpCode(HttpStatus.OK)
  async rehabilitar(@Param('id') id: string, @Req() req: any) {
    this.verificarRolAdmin(req.user);
    return this.usuariosService.rehabilitar(id);
  }

  // ── FUNCIÓN AUXILIAR DE CONTROL DE SEGURIDAD ──
  private verificarRolAdmin(userPayload: any): void {
    // Validamos contra el enum de tu Schema ('administrador')
    if (!userPayload || userPayload.perfil !== 'administrador') {
      throw new UnauthorizedException(
        'Acceso denegado. No tenés los permisos de administrador requeridos para realizar esta acción.',
      );
    }
  }
}
