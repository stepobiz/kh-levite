import { AuenNode, AuenNodeAttribute, AuenAttributeType, AuenNodeType } from '@prisma/client';

export type AuenNodeWithAttributes = AuenNode & {
  type: AuenNodeType;
  attributes: Array<AuenNodeAttribute & { attribute: AuenAttributeType }>;
};

export interface LogicEngineContext {
  allNodes: AuenNodeWithAttributes[];
}

export type DefaultChildSpec = {
  description?: string;
  typeCategory: string;
  isLogical?: boolean;
};

export interface NodeStrategy {
  calculateDesired(node: AuenNodeWithAttributes, context: LogicEngineContext): Promise<string>;
  updateActual(node: AuenNodeWithAttributes): string | undefined;
  syncHardware(node?: AuenNodeWithAttributes, allNodes?: AuenNodeWithAttributes[]): 'READ' | 'WRITE' | 'NONE';
  getDefaultChildren?(): DefaultChildSpec[];
}
