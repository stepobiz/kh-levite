import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigurationRepository } from './configuration.repository';
import { ConfigurationDto } from '../../dto/configuration.dto';

@Injectable()
export class ConfigurationBusiness {
  constructor(private readonly repository: ConfigurationRepository) {}

  findAll(sectionId?: number) {
    return this.repository.findAll(sectionId);
  }

  async findByCode(code: string) {
    const entity = await this.repository.findByCode(code);
    if (!entity) throw new NotFoundException(`Configuration ${code} not found`);
    return entity;
  }

  create(dto: ConfigurationDto) {
    if (!dto.code) throw new BadRequestException('code is required for creation');
    this._assertSelectValid(dto);
    this._assertJsonValid(dto);
    return this.repository.create({
      code: dto.code,
      name: dto.name,
      description: dto.description ?? null,
      sectionId: dto.sectionId ?? null,
      dataType: dto.dataType as any,
      options: dto.dataType === 'select' ? (dto.options ?? null) : null,
      pattern: dto.dataType === 'json' ? (dto.pattern ?? null) : null,
      valInt: dto.valInt ?? null,
      valFloat: dto.valFloat ?? null,
      valBool: dto.valBool ?? null,
      valText: dto.valText ?? null,
    });
  }

  async update(code: string, dto: ConfigurationDto) {
    await this.findByCode(code);
    this._assertSelectValid(dto);
    this._assertJsonValid(dto);
    return this.repository.update(code, {
      name: dto.name,
      description: dto.description,
      sectionId: dto.sectionId,
      dataType: dto.dataType as any,
      options: dto.dataType !== undefined
        ? (dto.dataType === 'select' ? (dto.options ?? null) : null)
        : undefined,
      pattern: dto.dataType !== undefined
        ? (dto.dataType === 'json' ? (dto.pattern ?? null) : null)
        : undefined,
      valInt: dto.valInt,
      valFloat: dto.valFloat,
      valBool: dto.valBool,
      valText: dto.valText,
    });
  }

  async delete(code: string) {
    await this.findByCode(code);
    return this.repository.delete(code);
  }

  private _assertSelectValid(dto: ConfigurationDto): void {
    if (dto.dataType !== 'select') return;
    let parsed: { value: string; label: string }[];
    try {
      parsed = JSON.parse(dto.options ?? '');
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error();
    } catch {
      throw new BadRequestException('options must be a non-empty JSON array for select type');
    }
    if (dto.valText != null && !parsed.some(o => o.value === dto.valText)) {
      throw new BadRequestException(`valText "${dto.valText}" is not a valid option`);
    }
  }

  private _assertJsonValid(dto: ConfigurationDto): void {
    if (dto.dataType !== 'json') return;

    const pattern = this._parsePattern(dto.pattern);

    if (dto.valText == null) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(dto.valText);
    } catch {
      throw new BadRequestException('valText must be valid JSON for json type');
    }
    if (!Array.isArray(parsed)) {
      throw new BadRequestException('valText must be a JSON array for json type');
    }
    if (pattern) this._assertMatchesPattern(parsed, pattern);
  }

  private _parsePattern(pattern: string | undefined): { key: string; type: string; required: boolean }[] | null {
    if (pattern == null) return null;
    let parsed: unknown;
    try {
      parsed = JSON.parse(pattern);
    } catch {
      throw new BadRequestException('pattern must be valid JSON');
    }
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new BadRequestException('pattern must be a non-empty JSON array of {key,type,required}');
    }
    for (const entry of parsed) {
      if (!entry || typeof entry.key !== 'string' || !entry.key) {
        throw new BadRequestException('each pattern entry needs a non-empty "key" string');
      }
      if (!['string', 'number', 'boolean'].includes(entry.type)) {
        throw new BadRequestException(`pattern entry "${entry.key}": type must be string|number|boolean`);
      }
      if (typeof entry.required !== 'boolean') {
        throw new BadRequestException(`pattern entry "${entry.key}": required must be boolean`);
      }
    }
    return parsed;
  }

  private _assertMatchesPattern(items: unknown[], pattern: { key: string; type: string; required: boolean }[]): void {
    items.forEach((item, idx) => {
      if (item === null || typeof item !== 'object') {
        throw new BadRequestException(`valText[${idx}] must be an object matching the pattern`);
      }
      for (const field of pattern) {
        const value = (item as Record<string, unknown>)[field.key];
        if (value === undefined || value === null) {
          if (field.required) {
            throw new BadRequestException(`valText[${idx}] is missing required field "${field.key}"`);
          }
          continue;
        }
        if (typeof value !== field.type) {
          throw new BadRequestException(`valText[${idx}].${field.key} must be of type ${field.type}`);
        }
      }
    });
  }
}
