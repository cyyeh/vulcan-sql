import { TYPES } from '@vulcan/build/containers';
import { ISchemaParserOptions, SchemaReaderType } from '@vulcan/build/models';
import { SchemaParserOptions } from '@vulcan/build/options';
import {
  SchemaFormat,
  SchemaParser,
  SchemaReader,
} from '@vulcan/build/schema-parser';
import { IValidatorLoader, TYPES as CORE_TYPES } from '@vulcan/core';
import { Container } from 'inversify';
import * as sinon from 'ts-sinon';

let container: Container;
let stubSchemaReader: sinon.StubbedInstance<SchemaReader>;
let stubValidatorLoader: sinon.StubbedInstance<IValidatorLoader>;

beforeEach(() => {
  container = new Container();
  stubSchemaReader = sinon.stubInterface<SchemaReader>();
  stubValidatorLoader = sinon.stubInterface<IValidatorLoader>();

  container
    .bind(TYPES.Factory_SchemaReader)
    .toConstantValue(() => stubSchemaReader);
  container
    .bind<Partial<ISchemaParserOptions>>(TYPES.SchemaParserInputOptions)
    .toConstantValue({
      folderPath: '',
      reader: SchemaReaderType.LocalFile,
    });
  container
    .bind(TYPES.SchemaParserOptions)
    .to(SchemaParserOptions)
    .inSingletonScope();
  container
    .bind(CORE_TYPES.IValidatorLoader)
    .toConstantValue(stubValidatorLoader);
  container.bind(TYPES.SchemaParser).to(SchemaParser).inSingletonScope();
});

afterEach(() => {
  container.unbindAll();
});

it('Schema parser parse should return correct result', async () => {
  // Assert
  const generator = async function* () {
    yield {
      sourceName: 'detail/role',
      content: `
request:
  - fieldName: id
    in: query
    description: role id
    validators:
      - name: uuid
      `,
      type: SchemaFormat.YAML,
    };
  };
  stubSchemaReader.readSchema.returns(generator());
  stubValidatorLoader.load.resolves({
    name: 'validator1',
    validateSchema: () => null,
    validateData: () => null,
  });
  const schemaParser = container.get<SchemaParser>(TYPES.SchemaParser);

  // Act
  const result = await schemaParser.parse();

  // Assert
  expect(result.schemas.length).toBe(1);
  expect(result.schemas[0].request[0].description).toBe('role id');
});

it('Schema parser parse should throw with unsupported schema type', async () => {
  // Assert
  const generator = async function* () {
    yield {
      sourceName: 'detail/role',
      content: ``,
      type: 'unsupported' as SchemaFormat,
    };
  };
  stubSchemaReader.readSchema.returns(generator());
  const schemaParser = container.get<SchemaParser>(TYPES.SchemaParser);

  // Act, Assert
  await expect(schemaParser.parse()).rejects.toThrow(
    `Unsupported schema type: unsupported`
  );
});
