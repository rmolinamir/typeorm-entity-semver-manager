import faker from 'faker';
import { Connection, createConnection, MongoRepository } from 'typeorm';
import { EntitySemVerManager, ShadowEntity } from '../src';
import { Person, PersonEntity, connectionOptions, generatePerson } from './fixtures';

let connection: Connection;

class ExposedEntitySemVerManager extends EntitySemVerManager<Person> {
  public _shadowRepository: MongoRepository<ShadowEntity<Person>>;

  public _initialSemVer: string;

  constructor(
    args?: {
      connection?: Connection;
      shadowedCollectionName?: string;
      initialSemVer?: string;
    },
  ) {
    super(args);

    this._shadowRepository = this.shadowRepository;

    this._initialSemVer = this.initialSemVer;
  }
}

describe('EntitySemVerManager constructor API', () => {
  beforeAll(async () => {
    connection = await createConnection(connectionOptions);
  });

  afterAll(async () => {
    await connection.close();
  });

  test('correctly instantiates without parameters', () => {
    const entitySemVerManager = new EntitySemVerManager<Person>();

    expect(entitySemVerManager).toBeInstanceOf(EntitySemVerManager);
  });

  test('correctly instantiates with a TypeORM connection', () => {
    const entitySemVerManager = new EntitySemVerManager<Person>({ connection });

    expect(entitySemVerManager).toBeInstanceOf(EntitySemVerManager);

    expect(entitySemVerManager.connection).toBe(connection);
  });

  test('correctly instantiates with a default shadow collection name', () => {
    const exposedEntitySemVerManager = new ExposedEntitySemVerManager();

    expect(exposedEntitySemVerManager._shadowRepository.metadata.tableName).toBe(ExposedEntitySemVerManager._DEFAULT_SHADOW_COLLECTION_NAME);
  });

  test('correctly instantiates with a passed shadow collection name', async  () => {
    const shadowedCollectionName = faker.random.uuid();

    const shadowCollectionName = `${shadowedCollectionName}_${ExposedEntitySemVerManager._DEFAULT_SHADOW_COLLECTION_NAME}`;

    const exposedEntitySemVerManager = new ExposedEntitySemVerManager({ shadowedCollectionName });

    expect(exposedEntitySemVerManager._shadowRepository.metadata.tableName).toBe(shadowCollectionName);
  });

  test('correctly instantiates with a passed initial SemVer', async  () => {
    const initialSemVer = faker.system.semver();

    const exposedEntitySemVerManager = new ExposedEntitySemVerManager({ initialSemVer });

    expect(exposedEntitySemVerManager._initialSemVer).toBe(initialSemVer);
  });

  test('correctly inserts entities to the shadow collection with dynamic name', async  () => {
    const shadowedCollectionName = 'person';

    const shadowCollectionName = `${shadowedCollectionName}_${ExposedEntitySemVerManager._DEFAULT_SHADOW_COLLECTION_NAME}`;

    await expect(() => {
      try {
        const repository = connection.getMongoRepository(shadowCollectionName);
        return Promise.resolve(repository);
      } catch (e) {
        return Promise.reject(e);
      }
    }).rejects.toThrow(`No repository for "${shadowCollectionName}" was found. Looks like this entity is not registered in current "${connection.name}" connection?`);

    const exposedEntitySemVerManager = new ExposedEntitySemVerManager({ shadowedCollectionName });

    expect(exposedEntitySemVerManager._shadowRepository.metadata.tableName).toBe(shadowCollectionName);

    // TODO: Test that the mongoDB collection name is `shadowCollectionName` IN mongoDB

    const person = new PersonEntity(generatePerson(`${shadowCollectionName}_${faker.random.uuid()}`));

    await connection.manager.save(person);

    await exposedEntitySemVerManager.insert(person);

    expect(connection.getMongoRepository(shadowedCollectionName)).toBeTruthy();

    expect(connection.getMongoRepository(shadowCollectionName)).toBeTruthy();
  });
});
