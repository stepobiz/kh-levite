import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
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
    return this.repository.create({
      code: dto.code,
      name: dto.name,
      description: dto.description ?? null,
      sectionId: dto.sectionId ?? null,
      dataType: dto.dataType as any,
      valInt: dto.valInt ?? null,
      valFloat: dto.valFloat ?? null,
      valBool: dto.valBool ?? null,
      valText: dto.valText ?? null,
    });
  }

  async update(code: string, dto: ConfigurationDto) {
    const entity = await this.findByCode(code);
    if (entity.isSystem) {
      return this.repository.update(code, {
        valInt: dto.valInt,
        valFloat: dto.valFloat,
        valBool: dto.valBool,
        valText: dto.valText,
      });
    }
    return this.repository.update(code, {
      name: dto.name,
      description: dto.description,
      sectionId: dto.sectionId,
      dataType: dto.dataType as any,
      valInt: dto.valInt,
      valFloat: dto.valFloat,
      valBool: dto.valBool,
      valText: dto.valText,
    });
  }

  async delete(code: string) {
    const entity = await this.findByCode(code);
    if (entity.isSystem) throw new ForbiddenException(`Configuration ${code} is a system record and cannot be deleted`);
    return this.repository.delete(code);
  }
}
