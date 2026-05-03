import { Module } from '@nestjs/common';
import { NodeTypeController } from './node-type/node-type.controller';
import { NodeTypeService } from './node-type/node-type.service';
import { NodeTypeRepository } from './node-type/node-type.repository';
import { AttributeTypeController } from './attribute-type/attribute-type.controller';
import { AttributeTypeService } from './attribute-type/attribute-type.service';
import { AttributeTypeRepository } from './attribute-type/attribute-type.repository';
import { NodeController } from './node/node.controller';
import { NodeService } from './node/node.service';
import { NodeRepository } from './node/node.repository';

@Module({
  controllers: [NodeTypeController, AttributeTypeController, NodeController],
  providers: [
    NodeTypeService, NodeTypeRepository,
    AttributeTypeService, AttributeTypeRepository,
    NodeService, NodeRepository,
  ],
})
export class AutoEngineModule {}
