import 'reflect-metadata';
import { ConflictException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { validateDocument, safeUrl, imageMime } from './landing-content.dto';
import { LandingEditorController, PublicLandingController } from './landing-content.controller';
import { PrismaService } from '../prisma/prisma.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminSessionGuard } from '../auth/guards/admin-session.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExecutionContext } from '@nestjs/common';
const blank = () => ({ version: 1, elements: {}, blocks: [] });
describe('Landing content validation', () => {
  it('accepts text, colors, internal links and HTTPS images', () =>
    expect(
      validateDocument({
        version: 1,
        elements: {
          title: {
            text: 'Sale <script>alert(1)</script>',
            color: '#abcdef',
            href: '/register',
            src: 'https://example.com/image.png',
          },
        },
        blocks: [],
      }),
    ).toBeTruthy());
  it.each([
    'javascript:alert(1)',
    'data:text/html,hello',
    '//evil.example',
    '/\\evil.example',
    ' https://example.com',
  ])('rejects unsafe URL %s', (href) => {
    expect(safeUrl(href)).toBe(false);
    expect(() => validateDocument({ ...blank(), elements: { title: { href } } })).toThrow();
  });
  it('rejects arbitrary style, malformed shapes and duplicate blocks', () => {
    expect(() =>
      validateDocument({ ...blank(), elements: { title: { style: 'position:fixed' } } }),
    ).toThrow();
    expect(() => validateDocument({ ...blank(), blocks: [null] })).toThrow();
    const block = { id: 'a', kind: 'article', title: 'Hi', body: 'Text', position: 'bottom' };
    expect(() => validateDocument({ ...blank(), blocks: [block, block] })).toThrow();
  });
  it('rejects script disguised as uploaded image', () => {
    expect(() => imageMime(Buffer.from('<svg onload="alert(1)">'))).toThrow();
    expect(imageMime(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))).toBe('image/png');
  });
});
describe('Landing permissions and publication', () => {
  const row = {
    id: 'landing',
    draft: { ...blank(), elements: { title: { text: 'Draft' } } },
    published: blank(),
    revision: 2,
  };
  const prisma = {
    landingContent: { upsert: jest.fn(), findUnique: jest.fn(), updateMany: jest.fn() },
  };
  const controller = new LandingEditorController(prisma as unknown as PrismaService);
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.landingContent.upsert.mockResolvedValue(row);
  });
  it('applies JWT, admin portal and ADMIN role guards to every editor operation', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, LandingEditorController)).toEqual([
      JwtAuthGuard,
      AdminSessionGuard,
      RolesGuard,
    ]);
    for (const role of ['USER', 'MODERATOR']) {
      const context = {
        getHandler: () => controller.save,
        getClass: () => LandingEditorController,
        switchToHttp: () => ({ getRequest: () => ({ user: { role, portal: 'admin' } }) }),
      } as unknown as ExecutionContext;
      expect(() => new RolesGuard(new Reflector()).canActivate(context)).toThrow();
    }
  });
  it('never exposes a draft from public endpoint', async () => {
    prisma.landingContent.findUnique.mockResolvedValue(row);
    const result = await new PublicLandingController(
      prisma as unknown as PrismaService,
    ).published();
    expect(result.document).toEqual(blank());
    expect(result).not.toHaveProperty('draft');
  });
  it('saving changes only draft and uses compare-and-swap', async () => {
    prisma.landingContent.updateMany.mockResolvedValue({ count: 1 });
    await controller.save({ revision: 2, document: blank() }, 'admin');
    const args = prisma.landingContent.updateMany.mock.calls[0][0];
    expect(args.where.revision).toBe(2);
    expect(args.data).not.toHaveProperty('published');
  });
  it('refuses stale save and stale publication', async () => {
    prisma.landingContent.updateMany.mockResolvedValue({ count: 0 });
    await expect(
      controller.save({ revision: 2, document: blank() }, 'admin'),
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(controller.publish({ revision: 1 }, 'admin')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
  it('publishes the saved document only if revision is current', async () => {
    prisma.landingContent.updateMany.mockResolvedValue({ count: 1 });
    await controller.publish({ revision: 2 }, 'admin');
    expect(prisma.landingContent.updateMany.mock.calls[0][0].data.published).toEqual(row.draft);
  });
});
