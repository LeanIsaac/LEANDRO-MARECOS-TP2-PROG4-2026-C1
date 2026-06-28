import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Query,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ComentariosService } from './comentarios.service';
import { CreateComentarioDto } from './dto/create-comentario.dto';
import { UpdateComentarioDto } from './dto/update-comentario.dto';
import { AuthGuard } from '../autenticacion/guards/auth.guard';

@Controller('comentarios')
export class ComentariosController {
  constructor(private readonly comentariosService: ComentariosService) {}

  // ── 1. AGREGAR COMENTARIO
  @Post()
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async crear(@Body() createDto: CreateComentarioDto, @Req() req: any) {
    const usuarioId = req.user.sub;
    return this.comentariosService.crear(createDto, usuarioId);
  }

  // ── 2. OBTENER COMENTARIOS
  @Get()
  @HttpCode(HttpStatus.OK)
  async listarPorPost(
    @Query('publicacionId') publicacionId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 5;
    const parsedOffset = offset ? parseInt(offset, 10) : 0;

    return this.comentariosService.buscarPorPublicacion(
      publicacionId,
      parsedLimit,
      parsedOffset,
    );
  }

  // ── 3. MODIFICAR UN COMENTARIO
  @Put(':id')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async modificar(
    @Param('id') id: string,
    @Body() updateDto: UpdateComentarioDto,
    @Req() req: any,
  ) {
    const usuarioId = req.user.sub;
    return this.comentariosService.modificar(id, updateDto, usuarioId);
  }

  // ── 4. ELIMINAR UN COMENTARIO
  @Delete(':id')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async eliminar(@Param('id') id: string, @Req() req: any) {
    const usuarioId = req.user.sub;
    const rolUsuario = req.user.perfil;
    return this.comentariosService.eliminar(id, usuarioId, rolUsuario);
  }
}
