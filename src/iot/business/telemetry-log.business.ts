import { Injectable } from '@nestjs/common';
import { TelemetryLogDto } from 'src/iot/dto/telemetry-log.dto';
import { TelemetryLogRepository } from 'src/iot/repository/telemetry-log.repository';
import { TelemetryLogMapper } from 'src/iot/mapper/telemetry-log.mapper';

@Injectable()
export class TelemetryLogBusiness {
  constructor(private readonly repository: TelemetryLogRepository) {}

  async create(dto: TelemetryLogDto): Promise<TelemetryLogDto> {
    const entity = await this.repository.create(TelemetryLogMapper.toCreateInput(dto));
    return TelemetryLogMapper.toDto(entity);
  }

  async findAll(): Promise<TelemetryLogDto[]> {
    const list = await this.repository.findAll();
    return list.map(TelemetryLogMapper.toDto);
  }

  async findById(id: number): Promise<TelemetryLogDto | null> {
    const entity = await this.repository.findById(id);
    return entity ? TelemetryLogMapper.toDto(entity) : null;
  }

  async update(id: number, dto: TelemetryLogDto): Promise<TelemetryLogDto> {
    const entity = await this.repository.update(id, TelemetryLogMapper.toUpdateInput(dto));
    return TelemetryLogMapper.toDto(entity);
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}