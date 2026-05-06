import { forwardRef, Module } from '@nestjs/common';
import { NodeTypeController } from './node-type/node-type.controller';
import { NodeTypeService } from './node-type/node-type.service';
import { NodeTypeRepository } from './node-type/node-type.repository';
import { AttributeTypeController } from './attribute-type/attribute-type.controller';
import { AttributeTypeService } from './attribute-type/attribute-type.service';
import { AttributeTypeRepository } from './attribute-type/attribute-type.repository';
import { NodeController } from './node/node.controller';
import { NodeService } from './node/node.service';
import { NodeRepository } from './node/node.repository';
import { TagController } from './tag/tag.controller';
import { TagService } from './tag/tag.service';
import { TagRepository } from './tag/tag.repository';
import { LogicEngineService } from './logic-engine/logic-engine.service';
import { RealtimeModule } from 'src/realtime/realtime.module';
import { InfraModule } from 'src/infra/infra.module';

@Module({
  imports: [RealtimeModule, forwardRef(() => InfraModule)],
  controllers: [NodeTypeController, AttributeTypeController, NodeController, TagController],
  providers: [
    NodeTypeService, NodeTypeRepository,
    AttributeTypeService, AttributeTypeRepository,
    NodeService, NodeRepository,
    TagService, TagRepository,
    LogicEngineService,
  ],
  exports: [NodeRepository, NodeService],
})
export class AutoEngineModule {}
