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