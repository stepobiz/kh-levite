import { Injectable } from '@nestjs/common';
import { DeviceComponentDto } from 'src/iot/dto/device-component.dto';
import { DeviceComponentRepository } from 'src/iot/repository/device-component.repository';
import { DeviceComponentMapper } from 'src/iot/mapper/device-component.mapper';
import { ProcessorComponentView } from 'src/iot/process/processor-component-view';
import { TelemetryLogBusiness } from './telemetry-log.business';

@Injectable()
export class DeviceComponentBusiness {
  constructor(
    private readonly repository: DeviceComponentRepository,
    private readonly telemetryLogBusiness: TelemetryLogBusiness,
  ) {}

  async create(deviceId: number, dto: DeviceComponentDto): Promise<DeviceComponentDto> {
    const entity = await this.repository.create(DeviceComponentMapper.toCreateInput(deviceId, dto));
    return DeviceComponentMapper.toDto(entity);
  }

  async findAll(): Promise<DeviceComponentDto[]> {
    const list = await this.repository.findAll();
    return list.map(DeviceComponentMapper.toDto);
  }

  async findAllForProcessor(): Promise<ProcessorComponentView[]> {
    const list = await this.repository.findAll();
    return list.map(entity => ({
      ...DeviceComponentMapper.toDto(entity),
      nextValue: entity.nextValue ?? null,
      nextValueUpdatedAt: entity.nextValueUpdatedAt ?? null,
    }));
  }

  async findAllByDevice(deviceId: number): Promise<DeviceComponentDto[]> {
    const list = await this.repository.findAllByDevice(deviceId);
    return list.map(DeviceComponentMapper.toDto);
  }

  async findById(id: number): Promise<DeviceComponentDto | null> {
    const entity = await this.repository.findById(id);
    return entity ? DeviceComponentMapper.toDto(entity) : null;
  }

  async update(id: number, dto: DeviceComponentDto): Promise<DeviceComponentDto> {
    const entity = await this.repository.update(id, DeviceComponentMapper.toUpdateInput(dto));
    return DeviceComponentMapper.toDto(entity);
  }

  async setNextValue(id: number, value: string | null): Promise<DeviceComponentDto> {
    const entity = await this.repository.setNextValue(id, value);
    return DeviceComponentMapper.toDto(entity);
  }

  async delete(id: number): Promise<void> {
    await this.telemetryLogBusiness.deleteByComponentId(id);
    await this.repository.delete(id);
  }
}