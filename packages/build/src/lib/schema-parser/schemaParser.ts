import { APISchema, IValidator, TemplateMetadata } from '@vulcan/core';
import { SchemaData, SchemaFormat, SchemaReader } from './schema-reader';
import * as yaml from 'js-yaml';
import {
  RawAPISchema,
  SchemaParserMiddleware,
  generateUrl,
  checkValidator,
  transformValidator,
  generateTemplateSource,
  checkParameter,
  fallbackErrors,
  addMissingErrors,
} from './middleware';
import * as compose from 'koa-compose';

/**
 * Temporary interface
 * @deprecated
 */
export interface ValidatorLoader {
  getLoader(name: string): IValidator;
}

export interface SchemaParseResult {
  schemas: APISchema[];
}

export class SchemaParser {
  private schemaReader: SchemaReader;
  private middleware: SchemaParserMiddleware[] = [];

  constructor({
    schemaReader,
    validatorLoader,
  }: {
    schemaReader: SchemaReader;
    validatorLoader: ValidatorLoader;
  }) {
    this.schemaReader = schemaReader;
    // Global middleware
    this.use(generateUrl());
    this.use(generateTemplateSource());
    this.use(transformValidator());
    this.use(checkValidator(validatorLoader));
    this.use(fallbackErrors());
  }

  public async parse({
    metadata,
  }: {
    metadata?: Record<string, TemplateMetadata>;
  } = {}): Promise<SchemaParseResult> {
    const middleware = [...this.middleware];
    if (metadata) {
      middleware.push(checkParameter(metadata));
      middleware.push(addMissingErrors(metadata));
    }
    const execute = compose(middleware);
    const schemas: APISchema[] = [];
    for await (const schemaData of this.schemaReader.readSchema()) {
      const schema = await this.parseContent(schemaData);
      // execute middleware
      await execute(schema);
      schemas.push(schema as APISchema);
    }
    return { schemas };
  }

  public use(middleware: SchemaParserMiddleware): this {
    this.middleware.push(middleware);
    return this;
  }

  private async parseContent(schemaData: SchemaData): Promise<RawAPISchema> {
    switch (schemaData.type) {
      case SchemaFormat.YAML:
        return {
          sourceName: schemaData.name,
          ...(yaml.load(schemaData.content) as object),
        } as RawAPISchema;
      default:
        throw new Error(`Unsupported schema type: ${schemaData.type}`);
    }
  }
}