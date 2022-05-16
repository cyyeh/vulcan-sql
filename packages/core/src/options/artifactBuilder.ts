import { injectable, inject } from 'inversify';
import { TYPES } from '@containers';
import {
  IArtifactBuilderOptions,
  PersistentStoreType,
  SerializerType,
} from '@models';

@injectable()
export class ArtifactBuilderOptions implements IArtifactBuilderOptions {
  public readonly storageType!: PersistentStoreType;
  public readonly serializerType!: SerializerType;
  public readonly path!: string;

  constructor(
    @inject(TYPES.ArtifactBuilderInputOptions)
    options: IArtifactBuilderOptions
  ) {
    Object.assign(this, options);
  }
}
