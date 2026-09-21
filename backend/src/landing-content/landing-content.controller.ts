import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
  Put,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Prisma } from '@prisma/client';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminSessionGuard } from '../auth/guards/admin-session.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SaveLandingDto, RevisionDto, validateDocument, imageMime } from './landing-content.dto';
const empty = { version: 1, elements: {}, blocks: [] };
@Controller('content')
export class PublicLandingController {
  constructor(private readonly prisma: PrismaService) {}
  @Get('landing')
  @Header('Cache-Control', 'no-store')
  async published() {
    const row = await this.prisma.landingContent.findUnique({
      where: { id: 'landing' },
      select: { published: true, publishedAt: true },
    });
    return { document: row?.published ?? empty, publishedAt: row?.publishedAt ?? null };
  }
  @Get('assets/:id')
  async asset(@Param('id') id: string, @Res() res: Response) {
    const asset = await this.prisma.landingAsset.findUnique({ where: { id } });
    if (!asset) throw new NotFoundException();
    res
      .set({
        'Content-Type': asset.mime,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
        'Cross-Origin-Resource-Policy': 'cross-origin',
      })
      .send(asset.bytes);
  }
}
@Controller('admin/landing')
@UseGuards(JwtAuthGuard, AdminSessionGuard, RolesGuard)
@Roles('ADMIN')
export class LandingEditorController {
  constructor(private readonly prisma: PrismaService) {}
  private ensure() {
    return this.prisma.landingContent.upsert({
      where: { id: 'landing' },
      create: { id: 'landing', draft: empty },
      update: {},
    });
  }
  @Get()
  @Header('Cache-Control', 'no-store')
  async draft() {
    return this.ensure();
  }
  @Put()
  async save(@Body() dto: SaveLandingDto, @CurrentUser('id') userId: string) {
    const document = validateDocument(dto.document) as Prisma.InputJsonValue;
    await this.ensure();
    const result = await this.prisma.landingContent.updateMany({
      where: { id: 'landing', revision: dto.revision },
      data: { draft: document, revision: { increment: 1 }, updatedBy: userId },
    });
    if (!result.count)
      throw new ConflictException('Bản nháp đã thay đổi ở phiên khác. Hãy tải lại trước khi lưu.');
    return { revision: dto.revision + 1 };
  }
  @Post('publish')
  async publish(@Body() dto: RevisionDto, @CurrentUser('id') userId: string) {
    const row = await this.ensure();
    if (row.revision !== dto.revision)
      throw new ConflictException('Bản nháp đã thay đổi. Hãy tải lại.');
    const result = await this.prisma.landingContent.updateMany({
      where: { id: 'landing', revision: dto.revision },
      data: {
        published: row.draft as Prisma.InputJsonValue,
        publishedAt: new Date(),
        revision: { increment: 1 },
        updatedBy: userId,
      },
    });
    if (!result.count)
      throw new ConflictException(
        'Bản nháp đã thay đổi. Hãy tải lại và kiểm tra trước khi xuất bản.',
      );
    return { revision: dto.revision + 1 };
  }
  @Post('assets')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 3 * 1024 * 1024, files: 1 } }))
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file?.buffer?.length) throw new BadRequestException('Chọn một ảnh để tải lên.');
    const mime = imageMime(file.buffer);
    const asset = await this.prisma.landingAsset.create({
      data: { mime, bytes: file.buffer },
      select: { id: true },
    });
    return { path: `/content/assets/${asset.id}` };
  }
}
