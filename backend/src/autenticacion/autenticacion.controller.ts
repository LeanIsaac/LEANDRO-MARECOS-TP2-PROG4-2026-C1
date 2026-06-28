import {
  Controller,
  Get,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AutenticacionService } from './autenticacion.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from './guards/auth.guard';

@Controller('autenticacion')
export class AutenticacionController {
  constructor(private autenticacionService: AutenticacionService) {}

  @Post('registro')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('foto'))
  async registro(
    @Body() registerDto: RegisterDto,
    @UploadedFile() foto?: { buffer: Buffer },
  ) {
    return this.autenticacionService.registrar(registerDto, foto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.autenticacionService.login(loginDto);
  }

  // VALIDAR ESTADO DE SESIÓN
  @Post('autorizar')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK) // Devuelve 200 OK si el token es válido
  async autorizar(@Req() req: any) {
    return {
      _id: req.user.sub,
      correo: req.user.correo,
      nombreUsuario: req.user.nombreUsuario,
      perfil: req.user.perfil,
      fotoPerfilUrl: req.user.fotoPerfilUrl,
    };
  }

  // RENOVAR EXPIRACIÓN DEL TOKEN
  @Post('refrescar')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async refrescar(@Req() req: any) {
    // Extraemos el payload que el AuthGuard inyectó en la request y renovamos el JWT
    return this.autenticacionService.refrescarToken(req.user);
  }
}
