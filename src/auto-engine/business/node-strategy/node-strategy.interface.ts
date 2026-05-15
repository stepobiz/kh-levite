import { AuenNode, AuenNodeAttribute, AuenAttributeType, AuenNodeType } from '@prisma/client';

export type AuenNodeWithAttributes = AuenNode & {
  type: AuenNodeType;
  attributes: Array<AuenNodeAttribute & { attribute: AuenAttributeType }>;
};

export interface LogicEngineContext {
  allNodes: AuenNodeWithAttributes[];
  season?: string;
}

export type DefaultChildSpec = {
  description?: string;
  typeCategory: string;
  valueType?: string;
  isLogical?: boolean;
};

export type NodeCreationContext = {
  nodeId: number;
  createChild: (spec: DefaultChildSpec) => Promise<void>;
};

export interface NodeStrategy {
  calculateDesired(node: AuenNodeWithAttributes, context: LogicEngineContext): Promise<string>;
  updateActual(node: AuenNodeWithAttributes): string | undefined;
  syncHardware(node?: AuenNodeWithAttributes, allNodes?: AuenNodeWithAttributes[]): 'READ' | 'WRITE' | 'NONE';
  /** Returns allowed valueTypes for this category. Empty array = not applicable (e.g. proxy_mirror). */
  allowedValueTypes(): string[];
  onCreate?(ctx: NodeCreationContext): Promise<void>;
}
