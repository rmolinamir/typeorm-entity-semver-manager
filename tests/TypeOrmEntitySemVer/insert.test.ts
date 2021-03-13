import faker from 'faker';
import { Connection, createConnection } from 'typeorm';
import { TypeOrmEntitySemVer } from '../../src';
import { Person, PersonEntity, connectionOptions, generatePerson } from './fixtures';

let connection: Connection;

let typeOrmEntitySemVer: TypeOrmEntitySemVer<Person>;

describe('TypeOrmEntitySemVer insert API', () => {
  beforeAll(async () => {
    connection = await createConnection(connectionOptions);

    typeOrmEntitySemVer = new TypeOrmEntitySemVer({ connection });
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('inserts API works correctly', () => {
    test('correctly inserts data and creates the shadow', async () => {
      const typeOrmPerson = new PersonEntity(generatePerson());

      await connection.manager.save(typeOrmPerson);

      const shadow = await typeOrmEntitySemVer.insert(typeOrmPerson);

      expect(shadow).toBeTruthy();

      expect(shadow._id).not.toBe(typeOrmPerson._id);

      expect(shadow.id).toBe(typeOrmPerson.id);

      expect(shadow.version).toBeTruthy();

      expect(shadow.image).toMatchObject(typeOrmPerson);

      expect(shadow.changes).toHaveLength(0);

      expect(shadow.createdAt).toBeInstanceOf(Date);

      expect(shadow.updatedAt).toBeInstanceOf(Date);
    });

    test('correctly inserts data with custom SemVer parameter', async () => {
      const semVer = faker.system.semver();

      const typeOrmPerson = new PersonEntity(generatePerson());

      await connection.manager.save(typeOrmPerson);

      const shadow = await typeOrmEntitySemVer.insert(
        typeOrmPerson,
        {
          customSemVer: semVer,
        },
      );

      expect(shadow).toBeTruthy();

      expect(shadow.version).toBe(semVer);
    });

    test('correctly inserts data with pre-release and build-metadata parameters', async () => {
      const preRelease = 'alpha1';
      const buildMetadata = 'BX012399A1';

      const typeOrmPerson = new PersonEntity(generatePerson());

      await connection.manager.save(typeOrmPerson);

      const shadow = await typeOrmEntitySemVer.insert(
        typeOrmPerson,
        {
          preRelease,
          buildMetadata,
        },
      );

      expect(shadow).toBeTruthy();

      expect(shadow.version).toContain(preRelease);

      expect(shadow.version).toContain(buildMetadata);
    });

    test('throws an error when custom SemVer parameter is invalid', async () => {
      const semVer = '~1.0.0';

      const typeOrmPerson = new PersonEntity(generatePerson());

      await connection.manager.save(typeOrmPerson);

      await expect(async () => {
        await typeOrmEntitySemVer.insert(
          typeOrmPerson,
          {
            customSemVer: semVer,
          },
        );
      }).rejects.toThrow(`Custom Semantic Version [${semVer}] does not match the Semantic Versioning 2.0.0 specs.`);
    });

    test('throws an error when pre-release and build-metadata parameters are invalid', async () => {
      const preRelease = '^alpha1';
      const buildMetadata = 'BX012399A1';

      const typeOrmPerson = new PersonEntity(generatePerson());

      await connection.manager.save(typeOrmPerson);

      await expect(async () => {
        await typeOrmEntitySemVer.insert(
          typeOrmPerson,
          {
            preRelease,
            buildMetadata,
          },
        );
      }).rejects.toThrow(`Serialized Semantic Version [1.0.0-${preRelease}+${buildMetadata}] does not match the Semantic Versioning 2.0.0 specs.`);
    });
  });
});
