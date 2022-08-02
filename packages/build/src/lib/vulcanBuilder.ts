import { IBuildOptions } from '@vulcan-sql/build/models';
import { Container, TYPES } from '@vulcan-sql/build/containers';
import { SchemaParser } from '@vulcan-sql/build/schema-parser';
import {
  TemplateEngine,
  TYPES as CORE_TYPES,
  VulcanArtifactBuilder,
} from '@vulcan-sql/core';

export class VulcanBuilder {
  public async build(options: IBuildOptions) {
    const container = new Container();
    await container.load(options);
    const schemaParser = container.get<SchemaParser>(TYPES.SchemaParser);
    const templateEngine = container.get<TemplateEngine>(
      CORE_TYPES.TemplateEngine
    );
    const artifactBuilder = container.get<VulcanArtifactBuilder>(
      CORE_TYPES.ArtifactBuilder
    );

    const { metadata, templates } = await templateEngine.compile();
    const { schemas } = await schemaParser.parse({ metadata });

    await artifactBuilder.build({ schemas, templates });

    await container.unload();
  }
}
