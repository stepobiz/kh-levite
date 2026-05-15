import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TelemetryLogRepository {
	constructor(private readonly prisma: PrismaService) { }

	create(data: Prisma.IotTelemetryLogCreateInput) {
		return this.prisma.iotTelemetryLog.create({ data });
	}

	findAll(limit?: number) {
		return this.prisma.iotTelemetryLog.findMany({
			orderBy: { createdAt: 'desc' },
			...(limit ? { take: limit } : {}),
		});
	}

	findById(id: number) {
		return this.prisma.iotTelemetryLog.findUnique({ where: { id } });
	}

	findByComponentId(componentId: number, limit: number) {
		return this.prisma.iotTelemetryLog.findMany({
			where: { componentId },
			orderBy: { createdAt: 'desc' },
			take: limit,
		});
	}

	findLastByComponentId(componentId: number) {
		return this.prisma.iotTelemetryLog.findFirst({
			where: { componentId },
			orderBy: { createdAt: 'desc' },
		});
	}

	deleteByComponentId(componentId: number) {
		return this.prisma.iotTelemetryLog.deleteMany({ where: { componentId } });
	}

	deleteByDeviceId(deviceId: number) {
		return this.prisma.iotTelemetryLog.deleteMany({ where: { component: { deviceId } } });
	}
}