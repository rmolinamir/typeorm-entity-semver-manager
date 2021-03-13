/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
// Libraries
import {
  Connection,
  // MongoEntityManager,
  MongoRepository,
  // getMongoManager,
  getMongoRepository,
  DeepPartial,
} from 'typeorm';
import { diff } from 'deep-object-diff';

// Locals
import {
  REGEXP_SEM_VER,
  Shadow,
  ShadowEntity,
} from './shadow';

// Types
import {
  SemVerManager,
  SemVerManagerIncrement,
} from './SemVerManager';

export class TypeOrmSemVerManager<T extends { id: Shadow['id'] } | { _id: Shadow['id'] }> implements SemVerManager<T> {
  static _DEFAULT_INITIAL_VERSION = '1.0.0';

  static _DEFAULT_DELETE_DUMMY_VERSION = '1.0.0';

  /**
   * Serializes a Semantic Version (SemVer) based on a base SemVer (major, minor, and patch components),
   * a pre-release component, and a build-metadata component.
   * 
   * @param options - Options object.
   */
  static serializeSemVer(options: {
    semVer: string;
    preRelease?: string;
    buildMetadata?: string;
  }): string {
    const {
      semVer,
      preRelease,
      buildMetadata,
    } = options;

    let serializedSemVer: string = semVer;

    if (preRelease) {
      serializedSemVer = `${serializedSemVer}-${preRelease}`;
    }

    if (buildMetadata) {
      serializedSemVer = `${serializedSemVer}+${buildMetadata}`;
    }

    const matches = REGEXP_SEM_VER.test(serializedSemVer);

    if (!matches) {
      throw new Error(`Serialized Semantic Version [${serializedSemVer}] does not match the Semantic Versioning 2.0.0 specs.`);
    }

    return serializedSemVer;
  }

  /**
   * Parses a Semantic Version (SemVer) into a Plain Object. If the SemVer is invalid, an error will be thrown.
   * Given a SemVer of `1.0.0-alpha1+BX01.92A`, the output would be:
   * ```js
   *    {
   *     match: "1.0.0-alpha1+BX01.92A",
   *     major: "1",
   *     minor: "0",
   *     patch: "0",
   *     preRelease: "alpha1",
   *     buildMetadata: "BX01.92A",
   *    }
   * ```
   * 
   * @param semVer - SemVer string.
   */
  static parseSemVer(semVer: string): {
    match: string;
    major: string;
    minor: string;
    patch: string;
    preRelease?: string;
    buildMetadata?: string;
  } {
    const matches = REGEXP_SEM_VER.exec(semVer);

    if (!matches) {
      throw new Error(`Semantic Version [${semVer}] does not match the Semantic Versioning 2.0.0 specs.`);
    }

    const [
      match,
      major,
      minor,
      patch,
      preRelease,
      buildMetadata,
    ] = matches;

    return {
      match,
      major,
      minor,
      patch,
      preRelease,
      buildMetadata,
    };
  }

  /**
   * Parses a Semantic Version (SemVer) into a Plain Object. If the SemVer is invalid, an error will be thrown.
   * Given a SemVer of `1.0.0-alpha1+BX01.92A`, the output would be:
   * 
   * @param oldSemVer - Previous SemVer.
   * @param options - Options object.
   */
  static increaseSemVer(
    oldSemVer: string,
    options: (
      {
        customSemVer: string;
      } |
      {
        incrementFormat: SemVerManagerIncrement,
        preRelease?: string;
        buildMetadata?: string;
      }
    ),
  ): string {
    let newSemVer: string;

    const {
      major: oldSemVerMajor,
      minor: oldSemVerMinor,
      patch: oldSemVerPatch,
      preRelease: oldSemVerPreRelease,
      buildMetadata: oldSemVerBuildMetadata,
    } = TypeOrmSemVerManager.parseSemVer(oldSemVer);

    if (options && 'customSemVer' in options) {
      newSemVer = options.customSemVer;
    } else {
      let semVer: string;

      switch (options.incrementFormat) {
        case SemVerManagerIncrement.MAJOR: {
          semVer = `${Number(oldSemVerMajor) + 1}.${Number(oldSemVerMinor)}.${Number(oldSemVerPatch)}`;
          break;
        }
        case SemVerManagerIncrement.MINOR: {
          semVer = `${Number(oldSemVerMajor)}.${Number(oldSemVerMinor) + 1}.${Number(oldSemVerPatch)}`;
          break;
        }
        case SemVerManagerIncrement.PATCH: {
          semVer = `${Number(oldSemVerMajor)}.${Number(oldSemVerMinor)}.${Number(oldSemVerPatch) + 1}`;
          break;
        }
      }

      newSemVer = TypeOrmSemVerManager.serializeSemVer({
        semVer: semVer,
        preRelease: options?.preRelease ?? oldSemVerPreRelease,
        buildMetadata: options?.buildMetadata ?? oldSemVerBuildMetadata,
      });
    }

    const {
      major: newSemVerMajor,
      minor: newSemVerMinor,
      patch: newSemVerPatch,
    } = TypeOrmSemVerManager.parseSemVer(newSemVer);

    const oldSemVerBaseNumber = Number(`${oldSemVerMajor}${oldSemVerMinor}${oldSemVerPatch}`);
    const newSemVerBaseNumber = Number(`${newSemVerMajor}${newSemVerMinor}${newSemVerPatch}`);

    // Validating precedence:
    if (oldSemVerBaseNumber > newSemVerBaseNumber) {
      throw new Error(`Previous Semantic Version [${oldSemVer}] is bigger than new Semantic Versioning [${newSemVer}].`);
    }

    return newSemVer;
  }

  public connection?: Connection;

  // private mongoEntityManager: MongoEntityManager;

  private shadowRepository: MongoRepository<ShadowEntity<T>>;

  private initialSemVer: string;

  private getEntityId(entity: T): Shadow['id'] | undefined {
    return (entity as { id: Shadow['id'] }).id || (entity as { _id: Shadow['id'] })._id;
  }

  constructor(
    args?: {
      connection?: Connection;
      shadowedCollectionName?: string;
    },
    options?: {
      initialSemVer?: string;
    },
  ) {
    this.connection = args?.connection;

    this.shadowRepository = getMongoRepository<ShadowEntity<T>>(ShadowEntity, this.connection?.name);

    // Set dynamic table name as shown in: https://avishwakarma.medium.com/typeorm-dynamic-collection-table-name-when-using-mongodb-6ef3f80dd1a6
    this.shadowRepository.metadata.tableName = args?.shadowedCollectionName ? `${args.shadowedCollectionName}_shadow` : this.shadowRepository.metadata.tableName;

    // this.mongoEntityManager = getMongoManager(this.connection?.name);

    this.initialSemVer = options?.initialSemVer || TypeOrmSemVerManager._DEFAULT_INITIAL_VERSION;
  }

  public async insert(
    entity: T,
    options?: (
      {
        customSemVer: string;
      } |
      {
        preRelease?: string;
        buildMetadata?: string;
      }
    ),
  ): Promise<ShadowEntity<T>> {
    const entityId = this.getEntityId(entity);

		if (!entityId) {
			throw new Error(`Document to shadow must have [id] or [_id] properties.`);
    }

    let semVer: string;

    if (options && 'customSemVer' in options) {
      const matches = REGEXP_SEM_VER.test(options.customSemVer);

      if (!matches) {
        throw new Error(`Custom Semantic Version [${options.customSemVer}] does not match the Semantic Versioning 2.0.0 specs.`);
      }

      semVer = options.customSemVer;
    } else {
      semVer = TypeOrmSemVerManager.serializeSemVer({
        semVer: this.initialSemVer,
        preRelease: options?.preRelease,
        buildMetadata: options?.buildMetadata,
      });
    }

    const now = new Date();

		const shadow = new ShadowEntity({
      id: entityId,
      version: semVer,
      image: entity,
      changes: [],
      createdAt: now,
      updatedAt: now,
    });

    await this.shadowRepository.save(shadow as DeepPartial<ShadowEntity<T>>);

    return shadow;
  };

  // insertMany();

  public async update(
    entity: T,
    options: (
      {
        customSemVer: string;
      } |
      {
        incrementFormat: SemVerManagerIncrement,
        preRelease?: string;
        buildMetadata?: string;
      }
    ),
  ): Promise<Shadow<T>> {
    const shadow = await this.shadowRepository.findOne({ id: this.getEntityId(entity) });

    if (!shadow) {
      throw new Error('Document to update not found in shadow collection.')
    }

    const oldSemVer = shadow.version;

    const newSemVer = TypeOrmSemVerManager.increaseSemVer(oldSemVer, options);

    shadow.version = newSemVer;

    shadow.changes.push({ version: oldSemVer, change: diff(shadow.image, entity) });

    shadow.updatedAt = new Date();

    await this.shadowRepository.updateOne({ id: this.getEntityId(entity) }, shadow);

    return shadow;
  };

  // updateMany();

  public async remove(
    entity: T,
    options?: {
      preRelease?: string;
      buildMetadata?: string;
    },
  ): Promise<void> {
    let dummySemVer = TypeOrmSemVerManager._DEFAULT_DELETE_DUMMY_VERSION;

    if (options?.preRelease) {
      dummySemVer = `${dummySemVer}_${options.preRelease}`;
    }

    if (options?.buildMetadata) {
      dummySemVer = `${dummySemVer}+${options.buildMetadata}`;
    }

    const { modifiedCount } = await this.shadowRepository.updateOne(
      { id: this.getEntityId(entity) },
      {
        id: new Date().getTime().toString(),
        version: dummySemVer,
      },
    );

    if (modifiedCount === 0) {
      throw new Error('Document to delete not found in shadow collection.')
    }

    return;
  };

  // removeMany();
}