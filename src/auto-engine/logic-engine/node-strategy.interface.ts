import { AuenNode, AuenNodeAttribute, AuenAttributeType } from '@prisma/client';

export type AuenNodeWithAttributes = AuenNode & {
  attributes: Array<AuenNodeAttribute & { attribute: AuenAttributeType }>;
};

// Context passed by the Logic Engine to each strategy during an execution cycle.
// The Logic Engine loads all nodes once per cycle and passes them here so
// strategies like InMirrorStrategy can look up sibling nodes without extra queries.
export interface LogicEngineContext {
  allNodes: AuenNodeWithAttributes[];
}

export interface NodeStrategy {
  calculateDesired(node: AuenNodeWithAttributes, context: LogicEngineContext): string;
  updateActual(node: AuenNodeWithAttributes): string | undefined;
  syncHardware(): 'READ' | 'WRITE' | 'NONE';
}
