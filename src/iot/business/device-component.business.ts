import { Injectable } from '@nestjs/common';
import { DeviceComponentDto } from 'src/iot/dto/device-component.dto';
import { DeviceComponentRepository } from 'src/iot/repository/device-component.repository';
import { DeviceComponentMapper } from 'src/iot/mapper/device-component.mapper';

@Injectable()
export class DeviceComponentBusiness {
  constructor(private readonly repository: DeviceComponentRepository) {}

  async create(dto: DeviceComponentDto): Promise<DeviceComponentDto> {
    const entity = await this.repository.create(DeviceComponentMapper.toCreateInput(dto));
    return DeviceComponentMapper.toDto(entity);
  }

  async findAll(): Promise<DeviceComponentDto[]> {
    const list = await this.repository.findAll();
    return list.map(DeviceComponentMapper.toDto);
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

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}