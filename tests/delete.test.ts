import faker from 'faker';
import { Connection, createConnection } from 'typeorm';
import { EntitySemVerManager, ShadowEntity } from '../src';
import { Person, PersonEntity, connectionOptions, generatePerson } from './fixtures';

let connection: Connection;

let entitySemVerManager: EntitySemVerManager<Person>;

let person: PersonEntity;

describe('EntitySemVerManager remove API', () => {
  beforeAll(async () => {
    connection = await createConnection(connectionOptions);

    entitySemVerManager = new EntitySemVerManager({ connection });
  });

  afterAll(async () => {
    await connection.close();
  });

  beforeEach(async () => {
    person = new PersonEntity(generatePerson());

    await connection.manager.save(person);

    await entitySemVerManager.insert(person);
  })

  describe('remove API works correctly', () => {
    test('correctly removes shadow', async () => {
      const boolean = await entitySemVerManager.remove(person);

      expect(boolean).toBe(true);
    });

    test('correctly removes shadow with pre-release and build-metadata parameters', async () => {
      const preRelease = 'alpha1';
      const buildMetadata = 'BX012399A1';

      const boolean = await entitySemVerManager.remove(
        person, {
          preRelease,
          buildMetadata,
        },
      );

      const repository = connection.getMongoRepository(EntitySemVerManager._DEFAULT_SHADOW_COLLECTION_NAME);

      expect(boolean).toBe(true);

      const shadow = await repository.findOne({ 'image.id': person.id }) as ShadowEntity<Person>;

      const semVer = EntitySemVerManager.serializeSemVer({
        semVer: EntitySemVerManager._DEFAULT_DELETE_DUMMY_VERSION,
        preRelease,
        buildMetadata,
      });

      expect(shadow.version).toBe(semVer);
    });

    test('returns false when entity is not shadowed', async () => {
      person.id = faker.random.uuid();

      const boolean = await entitySemVerManager.remove(person);

      expect(boolean).toBe(false);
    });
  });
});
