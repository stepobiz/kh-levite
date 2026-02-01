import { TelemetryLogDto } from 'src/iot/dto/telemetry-log.dto';
import type { Prisma } from '@prisma/client';

export class TelemetryLogMapper {
  static toCreateInput(dto: TelemetryLogDto): Prisma.IotTelemetryLogCreateInput {
    return {
      component: { connect: { id: dto.componentId } },
      value: dto.value,
      direction: dto.direction,
    };
  }

  static toUpdateInput(dto: Partial<TelemetryLogDto>): Prisma.IotTelemetryLogUpdateInput {
    const data: Prisma.IotTelemetryLogUpdateInput = {};
    if (dto.value !== undefined) data.value = dto.value;
    if (dto.direction !== undefined) data.direction = dto.direction;
    return data;
  }

  static toDto(entity: any): TelemetryLogDto {
    return {
      id: entity.id,
      componentId: entity.componentId,
      value: entity.value,
      direction: entity.direction,
      createdAt: entity.createdAt,
    };
  }
}