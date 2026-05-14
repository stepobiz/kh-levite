import { Module } from '@nestjs/common';
import { NodeTypeController } from './web/rest/node-type.controller';
import { NodeTypeBusiness } from './business/node-type.business';
import { NodeTypeRepository } from './repository/node-type.repository';
import { AttributeTypeController } from './web/rest/attribute-type.controller';
import { AttributeTypeBusiness } from './business/attribute-type.business';
import { AttributeTypeRepository } from './repository/attribute-type.repository';
import { NodeController } from './web/rest/node.controller';
import { NodeBusiness } from './business/node.business';
import { NodeRepository } from './repository/node.repository';
import { TagController } from './web/rest/tag.controller';
import { TagBusiness } from './business/tag.business';
import { TagRepository } from './repository/tag.repository';
import { LogicEngineSolverBusiness } from './business/logic-engine-solver.business';
import { LogicEngineActuatorBusiness } from './business/logic-engine-actuator.business';
import { LogicEngineProcess } from './process/logic-engine.process';
import { LogicEngineActuatorProcess } from './process/logic-engine-actuator.process';
import { RealtimeModule } from 'src/realtime/realtime.module';
import { InfraModule } from 'src/infra/infra.module';
import { IotModule } from 'src/iot/iot.module';

@Module({
  imports: [RealtimeModule, InfraModule, IotModule],
  controllers: [NodeTypeController, AttributeTypeController, NodeController, TagController],
  providers: [
    NodeTypeBusiness, NodeTypeRepository,
    AttributeTypeBusiness, AttributeTypeRepository,
    NodeBusiness, NodeRepository,
    TagBusiness, TagRepository,
    LogicEngineSolverBusiness,
    LogicEngineActuatorBusiness,
    LogicEngineProcess,
    LogicEngineActuatorProcess,
  ],
  exports: [NodeBusiness],
})
export class AutoEngineModule {}
