import { ContainerModule } from 'inversify';
import { Executor } from '@template-engine';
import { TYPES } from '../types';

export const executorModule = () =>
  new ContainerModule((bind) => {
    bind<Executor>(TYPES.Executor).toConstantValue({
      // TODO: Mock value
      executeQuery: async () => {
        return [];
      },
    });
  });
