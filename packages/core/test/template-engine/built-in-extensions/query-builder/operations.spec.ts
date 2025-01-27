import {
  arrayToStream,
  DataQueryBuilder,
  DataSource,
  IParameterizer,
} from '@vulcan-sql/core';
import { createTestCompiler } from '../../testCompiler';
import * as sinon from 'ts-sinon';

const createTestCompilerWithBuilder = async () => {
  const { executor, compiler, loader, executeTemplate } =
    await createTestCompiler();
  const dataSource = sinon.stubInterface<DataSource>();
  executor.createBuilder.callsFake(
    async (
      profileName: string,
      query: string,
      parameterizer: IParameterizer
    ) => {
      // We don't mock builders because we need to test the operations generated by them.
      return new DataQueryBuilder({
        profileName,
        statement: query,
        parameterizer,
        dataSource,
      });
    }
  );

  return {
    execute: async (statement: string, parameter?: any) => {
      const { compiledData } = await compiler.compile(statement);
      loader.setSource('test', compiledData);
      await executeTemplate('test', parameter);
    },
    dataSource,
  };
};

it('Query builders should continue to use the parameterizer index', async () => {
  // Arrange
  const { dataSource, execute } = await createTestCompilerWithBuilder();
  // Act
  await execute(
    `
{% req user main %}
select * from users where id = {{ context.params.id }}
{% endreq %}
{% set temp = user.limit(2) %}
  `,
    { id: 1 }
  );
  // Assert
  const executedOption = dataSource.execute.firstCall.args[0];
  expect(executedOption.statement).toBe('select * from users where id = $1');
  expect(executedOption.operations.limit).toBe('$2');
  expect(executedOption.bindParams.size).toBe(2);
  expect(executedOption.bindParams.get('$1')).toBe(1);
  expect(executedOption.bindParams.get('$2')).toBe(2);
});

it('Query builders should use their own parameterizer even if it is call from another scope', async () => {
  // Arrange
  const { dataSource, execute } = await createTestCompilerWithBuilder();
  dataSource.execute.onFirstCall().resolves({
    getColumns: () => [],
    getData: () => arrayToStream([{ id: 1, name: 'freda' }]),
  });
  // Act
  await execute(
    `
{% req user %}
select * from users where id = {{ context.params.id }}
{% endreq %}

{% req group main %}
select * from group where userName = {{ user.limit(2).value()[0].name }}
{% endreq %}

  `,
    { id: 1 }
  );
  // Assert
  const firstCall = dataSource.execute.firstCall.args[0];
  expect(firstCall.statement).toBe('select * from users where id = $1');
  expect(firstCall.operations.limit).toBe('$2');
  expect(firstCall.bindParams.size).toBe(2);
  expect(firstCall.bindParams.get('$1')).toBe(1);
  expect(firstCall.bindParams.get('$2')).toBe(2);
  const secondCall = dataSource.execute.secondCall.args[0];
  expect(secondCall.statement).toBe('select * from group where userName = $1');
  expect(secondCall.bindParams.size).toBe(1);
  expect(secondCall.bindParams.get('$1')).toBe('freda');
});

it('Query builders should use their own parameterizer even if it is call from nested scope', async () => {
  // Arrange
  const { dataSource, execute } = await createTestCompilerWithBuilder();
  dataSource.execute.onFirstCall().resolves({
    getColumns: () => [],
    getData: () => arrayToStream([{ id: 1, name: 'freda' }]),
  });
  // Act
  await execute(
    `
{% req group main %}
{% req user %}
select * from users where id = {{ context.params.id }}
{% endreq %}
select * from group where userName = {{ user.limit(2).value()[0].name }}
{% endreq %}
  `,
    { id: 1 }
  );
  // Assert
  const firstCall = dataSource.execute.firstCall.args[0];
  expect(firstCall.statement).toBe('select * from users where id = $1');
  expect(firstCall.operations.limit).toBe('$2');
  expect(firstCall.bindParams.size).toBe(2);
  expect(firstCall.bindParams.get('$1')).toBe(1);
  expect(firstCall.bindParams.get('$2')).toBe(2);
  const secondCall = dataSource.execute.secondCall.args[0];
  expect(secondCall.statement).toBe('select * from group where userName = $1');
  expect(secondCall.bindParams.size).toBe(1);
  expect(secondCall.bindParams.get('$1')).toBe('freda');
});
