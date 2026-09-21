import { BadRequestException } from '@nestjs/common';
import { IsInt, IsObject, Min } from 'class-validator';
export class RevisionDto {
  @IsInt() @Min(0) revision: number;
}
export class SaveLandingDto extends RevisionDto {
  @IsObject() document: Record<string, unknown>;
}
function fail(): never {
  throw new BadRequestException('Nội dung landing page không hợp lệ.');
}
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
export function safeUrl(value: string, image = false) {
  if (/[\u0000-\u0020\\]/.test(value)) return false;
  if (/^\/(?!\/)/.test(value) || (!image && /^#[a-zA-Z0-9_-]+$/.test(value))) return true;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}
export function validateDocument(value: Record<string, unknown>) {
  if (
    JSON.stringify(value).length > 80000 ||
    Object.keys(value).some((k) => !['version', 'elements', 'blocks'].includes(k)) ||
    value.version !== 1 ||
    !object(value.elements) ||
    !Array.isArray(value.blocks) ||
    value.blocks.length > 30
  )
    fail();
  const fields = ['text', 'src', 'alt', 'href', 'color', 'backgroundColor', 'hidden'];
  const validateFields = (v: unknown, extra: string[] = []) => {
    if (!object(v) || Object.keys(v).some((k) => ![...fields, ...extra].includes(k))) fail();
    for (const [key, field] of Object.entries(v)) {
      if (key === 'hidden') {
        if (typeof field !== 'boolean') fail();
        continue;
      }
      if (
        typeof field !== 'string' ||
        field.length > (key === 'text' || key === 'body' ? 8000 : 2000)
      )
        fail();
      if (
        ['color', 'backgroundColor', 'buttonColor'].includes(key) &&
        !/^#[0-9a-f]{6}$/i.test(field)
      )
        fail();
      if (['src', 'href'].includes(key) && field && !safeUrl(field, key === 'src')) fail();
    }
  };
  if (Object.keys(value.elements as object).length > 200) fail();
  for (const [key, v] of Object.entries(value.elements as object)) {
    if (
      !/^[a-zA-Z0-9_-]{1,100}$/.test(key) ||
      ['__proto__', 'constructor', 'prototype'].includes(key)
    )
      fail();
    validateFields(v);
  }
  const ids = new Set<string>();
  for (const b of value.blocks as unknown[]) {
    validateFields(b, ['id', 'kind', 'title', 'body', 'buttonText', 'buttonColor', 'position']);
    const block = b as Record<string, string>;
    if (
      typeof block.id !== 'string' ||
      !/^[a-zA-Z0-9_-]{1,80}$/.test(block.id) ||
      ids.has(block.id) ||
      !['banner', 'article'].includes(block.kind) ||
      !['top', 'bottom'].includes(block.position) ||
      typeof block.title !== 'string' ||
      typeof block.body !== 'string'
    )
      fail();
    ids.add(block.id);
  }
  return value;
}
export function imageMime(bytes: Buffer): string {
  if (
    bytes.length >= 8 &&
    bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    return 'image/png';
  if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255)
    return 'image/jpeg';
  if (
    bytes.length >= 12 &&
    bytes.toString('ascii', 0, 4) === 'RIFF' &&
    bytes.toString('ascii', 8, 12) === 'WEBP'
  )
    return 'image/webp';
  throw new BadRequestException('Chỉ nhận ảnh PNG, JPEG hoặc WebP.');
}
