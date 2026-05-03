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

  async findByComponentId(componentId: number, limit: number): Promise<TelemetryLogDto[]> {
    const list = await this.repository.findByComponentId(componentId, limit);
    return list.map(TelemetryLogMapper.toDto);
  }

  async findLatestByComponentId(componentId: number): Promise<TelemetryLogDto | null> {
    const entity = await this.repository.findLastByComponentId(componentId);
    return entity ? TelemetryLogMapper.toDto(entity) : null;
  }
}