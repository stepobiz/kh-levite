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
    return this.repository.create({
      code: dto.code,
      name: dto.name,
      description: dto.description ?? null,
      sectionId: dto.sectionId ?? null,
      dataType: dto.dataType as any,
      options: dto.dataType === 'select' ? (dto.options ?? null) : null,
      valInt: dto.valInt ?? null,
      valFloat: dto.valFloat ?? null,
      valBool: dto.valBool ?? null,
      valText: dto.valText ?? null,
    });
  }

  async update(code: string, dto: ConfigurationDto) {
    await this.findByCode(code);
    this._assertSelectValid(dto);
    return this.repository.update(code, {
      name: dto.name,
      description: dto.description,
      sectionId: dto.sectionId,
      dataType: dto.dataType as any,
      options: dto.dataType === 'select' ? (dto.options ?? null) : null,
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
}
