import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  Param,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PublicacionesService } from './publicaciones.service';
import { CreatePublicacioneDto } from './dto/create-publicacione.dto';
import { AuthGuard } from '../autenticacion/guards/auth.guard';

@Controller('publicaciones')
// @UseGuards(AuthGuard)
export class PublicacionesController {
  constructor(private readonly publicacionesService: PublicacionesService) {}

  // ── 1. ALTA DE PUBLICACIONES ──
  @Post()
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('foto')) // Escucha el campo 'foto' del front
  async crear(
    @Body() createDto: CreatePublicacioneDto,
    @Req() req: any, // Extraemos los datos del usuario inyectados por el AuthGuard (JWT)
    @UploadedFile() foto?: any,
  ) {
    // Extraemos el sub (ID del usuario) de forma segura del token parseado
    const usuarioId = req.user.sub;
    return this.publicacionesService.crear(createDto, usuarioId, foto);
  }

  // ── 2. LISTADO CON FILTROS, ORDENAMIENTO Y PAGINACIÓN ──
  @Get()
  @HttpCode(HttpStatus.OK)
  async listar(
    @Query('orden') orden?: 'fecha' | 'likes', // Parámetro para ordenar
    @Query('usuarioId') usuarioIdFiltrar?: string, // Filtro por usuario particular
    @Query('limit') limit?: string, // Paginación
    @Query('offset') offset?: string, // Paginación
  ) {
    // Parseamos a números los parámetros que viajan como string en la Query URL
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    const parsedOffset = offset ? parseInt(offset, 10) : 0;

    return this.publicacionesService.buscarTodas(
      orden ?? 'fecha',
      usuarioIdFiltrar,
      parsedLimit,
      parsedOffset,
    );
  }

  // ── 3. BAJA LÓGICA DE PUBLICACIÓN ──
  @Delete(':id')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async eliminar(@Param('id') id: string, @Req() req: any) {
    const usuarioId = req.user.sub;
    const rolUsuario = req.user.perfil; // 'usuario' o 'administrador'

    return this.publicacionesService.bajaLogica(id, usuarioId, rolUsuario);
  }
}
