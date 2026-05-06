import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class RealtimeGateway {
  @WebSocketServer()
  private server: Server;

  emitTelemetryUpdate(payload: {
    id: number;
    componentId: number;
    value: string;
    direction: string;
    createdAt: Date;
  }) {
    this.server?.emit('telemetry.update', payload);
  }

  emitNodeUpdate(payload: {
    nodeId: number;
    desiredValue: string | null;
    actualValue: string | null;
    desiredValueUpdatedAt: Date | null;
    actualValueUpdatedAt: Date | null;
  }) {
    this.server?.emit('node.update', payload);
  }

  emitProcessUpdate(payload: {
    processName: string;
    startedAt: Date;
    endedAt: Date;
    durationMs: number;
    itemsProcessed: number;
    status: 'success' | 'error';
  }) {
    this.server?.emit('process.update', payload);
  }
}
