import { Injectable } from '@nestjs/common';
import { DeviceDto } from 'src/iot/dto/device.dto';
import { DeviceRepository } from './device.repository';
import { DeviceMapper } from './device.mapper';
import { DeviceComponentRepository } from './device-component.repository';
import { TelemetryLogRepository } from './telemetry-log.repository';

@Injectable()
export class DeviceBusiness {
  constructor(
    private readonly repository: DeviceRepository,
    private readonly componentRepository: DeviceComponentRepository,
    private readonly telemetryLogRepository: TelemetryLogRepository,
  ) {}

  async create(dto: DeviceDto): Promise<DeviceDto> {
    const entity = await this.repository.create(DeviceMapper.toCreateInput(dto));
    return DeviceMapper.toDto(entity);
  }

  async findAll(): Promise<DeviceDto[]> {
    const list = await this.repository.findAll();
    return list.map(DeviceMapper.toDto);
  }

  async findById(id: number): Promise<DeviceDto | null> {
    const entity = await this.repository.findById(id);
    return entity ? DeviceMapper.toDto(entity) : null;
  }

  async update(id: number, dto: DeviceDto): Promise<DeviceDto> {
    const entity = await this.repository.update(id, DeviceMapper.toUpdateInput(dto));
    return DeviceMapper.toDto(entity);
  }

  async delete(id: number): Promise<void> {
    await this.telemetryLogRepository.deleteByDeviceId(id);
    await this.componentRepository.deleteByDeviceId(id);
    await this.repository.delete(id);
  }
}