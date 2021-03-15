import faker from 'faker';
import { Connection, createConnection } from 'typeorm';
import { SemVerManagerIncrement, EntitySemVerManager } from '../src';
import { Person, PersonEntity, connectionOptions, generatePerson } from './fixtures';

let connection: Connection;

let entitySemVerManager: EntitySemVerManager<Person>;

let person: PersonEntity;

let semVer = `1.0.0`;

describe('EntitySemVerManager update API', () => {
  beforeAll(async () => {
    connection = await createConnection(connectionOptions);

    entitySemVerManager = new EntitySemVerManager({ connection, initialSemVer: semVer });

    person = new PersonEntity(generatePerson());

    await connection.manager.save(person);

    await entitySemVerManager.insert(person);
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('updates API works correctly', () => {
    test('correctly updates data and creates the shadow', async () => {
      person.name = faker.name.findName();

      await connection.manager.save(person);

      const shadow = await entitySemVerManager.update(
        person,
        { incrementFormat: SemVerManagerIncrement.MAJOR },
      );

      semVer = EntitySemVerManager.increaseSemVer(
        semVer,
        { incrementFormat: SemVerManagerIncrement.MAJOR },
      );

      expect(shadow).toBeTruthy();

      expect(shadow._id).not.toBe(person._id);

      expect(shadow.id).toBe(person.id);

      expect(shadow.version).toBe(semVer);

      expect(shadow.image).toMatchObject(person);

      expect(shadow.changes).toHaveLength(1);

      expect(shadow.createdAt).toBeInstanceOf(Date);

      expect(shadow.updatedAt).toBeInstanceOf(Date);
    });

    test('correctly updates data with custom SemVer parameter', async () => {
      person.name = faker.name.findName();

      await connection.manager.save(person);

      semVer = '3.0.0';

      const shadow = await entitySemVerManager.update(
        person,
        {
          customSemVer: semVer,
        },
      );

      expect(shadow).toBeTruthy();

      expect(shadow.version).toBe(semVer);

      expect(shadow.changes).toHaveLength(2);
    });

    test('correctly updates data with pre-release and build-metadata parameters', async () => {
      person.name = faker.name.findName();

      await connection.manager.save(person);

      const preRelease = 'alpha1';

      const buildMetadata = 'BX012399A1';

      const shadow = await entitySemVerManager.update(
        person,
        {
          incrementFormat: SemVerManagerIncrement.MAJOR,
          preRelease,
          buildMetadata,
        },
      );

      semVer = EntitySemVerManager.increaseSemVer(
        semVer,
        {
          incrementFormat: SemVerManagerIncrement.MAJOR,
          preRelease,
          buildMetadata,
        },
      );

      expect(shadow).toBeTruthy();

      expect(shadow.version).toBe(semVer);

      expect(shadow.version).toContain(preRelease);

      expect(shadow.version).toContain(buildMetadata);
    });

    test('returned value is null when there are no changes in entity', async () => {
      const shadow = await entitySemVerManager.update(
        person,
        {
          incrementFormat: SemVerManagerIncrement.MAJOR,
        },
      );

      expect(shadow).toBe(null);
    });

    test('returned value is null when entity is not found', async () => {
      const invalidPerson = Object.assign(
        {},
        person,
      );

      invalidPerson.id = faker.random.uuid();

      const shadow = await entitySemVerManager.update(
        person,
        {
          incrementFormat: SemVerManagerIncrement.MAJOR,
        },
      );

      expect(shadow).toBe(null);
    });

    test('throws an error when custom SemVer parameter is invalid', async () => {
      person.name = faker.name.findName();

      await connection.manager.save(person);

      const invalidSemVer = '^3.0.0';

      await expect(async () => {
        await entitySemVerManager.update(
          person,
          {
            customSemVer: invalidSemVer,
          },
        );
      }).rejects.toThrow(`Semantic Version [${invalidSemVer}] does not match the Semantic Versioning 2.0.0 specs.`);
    });

    test('throws an error when pre-release and build-metadata parameters are invalid', async () => {
      person.name = faker.name.findName();

      await connection.manager.save(person);

      const preRelease = '^alpha1';

      const buildMetadata = 'BX012399A1';

      await expect(async () => {
        await entitySemVerManager.update(
          person,
          {
            incrementFormat: SemVerManagerIncrement.MAJOR,
            preRelease,
            buildMetadata,
          },
        );
      }).rejects.toThrow();
    });
  });
});
