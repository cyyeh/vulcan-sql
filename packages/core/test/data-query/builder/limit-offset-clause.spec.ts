import * as sinon from 'ts-sinon';
import faker from '@faker-js/faker';
import { DataQueryBuilder, DataSource, Parameterizer } from '@vulcan-sql/core';

const createStub = () => {
  return {
    dataSource: sinon.stubInterface<DataSource>(),
    parameterizer: sinon.stubInterface<Parameterizer>(),
  };
};

const createStubBuilder = ({ statement }: { statement: string }) =>
  new DataQueryBuilder({
    statement: statement,
    dataSource: createStub().dataSource,
    parameterizer: createStub().parameterizer,
    profileName: '',
  });

describe('Test data query builder > limit-offset by clause', () => {
  it.each([
    {
      limit: faker.datatype.number({ max: 10 }),
      offset: faker.datatype.number({ max: 1000 }),
    },
    {
      limit: faker.datatype.number({ max: 10 }),
      offset: faker.datatype.number({ max: 1000 }),
    },
  ])(
    'Should record successfully when call limit($limit).offset($offset)',
    async ({ limit, offset }) => {
      // Arrange
      const expected = {
        limit,
        offset,
      };

      // Act
      const builder = createStubBuilder({
        statement: 'select * from orders',
      });
      builder.limit(limit).offset(offset);

      // Assert
      expect(builder.operations.limit).toEqual(expected.limit);
      expect(builder.operations.offset).toEqual(expected.offset);
    }
  );

  it.each([
    {
      first: {
        limit: faker.datatype.number({ max: 10 }),
        offset: faker.datatype.number({ max: 1000 }),
      },
      second: {
        limit: faker.datatype.number({ max: 10 }),
        offset: faker.datatype.number({ max: 1000 }),
      },
    },
    {
      first: {
        limit: faker.datatype.number({ max: 10 }),
        offset: faker.datatype.number({ max: 1000 }),
      },
      second: {
        limit: faker.datatype.number({ max: 10 }),
        offset: faker.datatype.number({ max: 1000 }),
      },
    },
  ])(
    'Should record successfully when call limit($first.limit).offset($first.offset).offset($second.offset).limit($second.limit)',
    async ({ first, second }) => {
      // Arrange
      const expected = {
        limit: second.limit,
        offset: second.offset,
      };

      // Act
      const builder = createStubBuilder({
        statement: 'select * from orders',
      });
      builder
        .limit(first.limit)
        .offset(first.offset)
        .offset(second.offset)
        .limit(second.limit);

      // Assert
      expect(builder.operations.limit).toEqual(expected.limit);
      expect(builder.operations.offset).toEqual(expected.offset);
    }
  );

  it.each([
    {
      first: {
        limit: faker.datatype.number({ max: 10 }),
        offset: faker.datatype.number({ max: 1000 }),
      },
      second: {
        limit: faker.datatype.number({ max: 10 }),
        offset: faker.datatype.number({ max: 1000 }),
      },
    },
    {
      first: {
        limit: faker.datatype.number({ max: 10 }),
        offset: faker.datatype.number({ max: 1000 }),
      },
      second: {
        limit: faker.datatype.number({ max: 10 }),
        offset: faker.datatype.number({ max: 1000 }),
      },
    },
  ])(
    'Should record successfully when call limit($first.limit).offset($first.offset).take($second.limit, $second.offset)',
    async ({ first, second }) => {
      // Arrange
      const expected = {
        limit: second.limit,
        offset: second.offset,
      };

      // Act
      const builder = createStubBuilder({
        statement: 'select * from orders',
      });
      builder
        .limit(first.limit)
        .offset(first.offset)
        .take(second.limit, second.offset);

      // Assert
      expect(builder.operations.limit).toEqual(expected.limit);
      expect(builder.operations.offset).toEqual(expected.offset);
    }
  );
});
