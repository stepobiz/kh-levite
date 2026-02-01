import { Injectable } from '@nestjs/common';
import { Prisma, IotTelemetryLog } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TelemetryLogRepository {
	constructor(private readonly prisma: PrismaService) { }

	create(data: Prisma.IotTelemetryLogCreateInput) {
		return this.prisma.iotTelemetryLog.create({ data });
	}

	findAll() {
		return this.prisma.iotTelemetryLog.findMany();
	}

	findById(id: number) {
		return this.prisma.iotTelemetryLog.findUnique({ where: { id } });
	}

	update(id: number, data: Prisma.IotTelemetryLogUpdateInput) {
		return this.prisma.iotTelemetryLog.update({ where: { id }, data });
	}

	delete(id: number) {
		return this.prisma.iotTelemetryLog.delete({ where: { id } });
	}

	findLastByComponentId(componentId: number) {
		return this.prisma.iotTelemetryLog.findFirst({
			where: { componentId },
			orderBy: { createdAt: 'desc' },
		});
	}

}