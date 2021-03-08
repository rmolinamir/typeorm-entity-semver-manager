// Libraries
import {
  Connection,
  Model,
  Document,
} from 'mongoose';
import { v4 } from 'uuid';

// Locals
import {
  REGEXP_SEM_VER,
  Shadow,
  shadowSchema,
} from './shadow';

// Types
import {
  EntitySemVer,
  EntitySemVerIncrement,
} from './EntitySemVer';

export class MongooseEntitySemVer<T> implements EntitySemVer<T> {
  static _DEFAULT_INITIAL_VERSION = '1.0.0';

  static getShadowCollectionName(Model: Model<Document>): string {
    return `${Model.collection.name}_shadow`;
  }

  static serializeSemVer(args: {
    semVer: string;
    preRelease?: string;
    buildMetadata?: string;
  }): string {
    const {
      semVer,
      preRelease,
      buildMetadata,
    } = args;

    let serializedSemVer: string = semVer;

    if (preRelease) {
      serializedSemVer = `${serializedSemVer}_${preRelease}`;
    }

    if (buildMetadata) {
      serializedSemVer = `${serializedSemVer}+${buildMetadata}`;
    }

    const matches = serializedSemVer.match(REGEXP_SEM_VER);

    if (!matches) {
      throw new Error(`Serialized Semantic Version [${serializedSemVer}] does not match the Semantic Versioning 2.0.0 specs.`);
    }

    return serializedSemVer;
  }

  public connection: Connection;

  public Model: Model<Document<T>>;

  private ShadowModel: Model<Document<Shadow<T>>>;

  private initialSemVer: string;

  constructor(
    args: {
      connection: Connection;
      Model: Model<Document<T>>;
    },
    options?: {
      initialSemVer?: string;
    },
  ) {
    this.connection = args.connection;

    this.Model = args.Model;

    this.ShadowModel = this.connection.model<Document<Shadow<T>>>(
      MongooseEntitySemVer.getShadowCollectionName(this.Model),
      shadowSchema,
    );

    this.initialSemVer = options?.initialSemVer ?? MongooseEntitySemVer._DEFAULT_INITIAL_VERSION;
  }

  public async insert(
    data: T,
    options?: {  
      initialSemVer?: string;
      preRelease?: string;
      buildMetadata?: string;
    },
  ): Promise<{ data: T; shadow: Shadow<T>; }> {
    const version = MongooseEntitySemVer.serializeSemVer({
      semVer: options?.initialSemVer ?? this.initialSemVer,
      preRelease: options?.preRelease,
      buildMetadata: options?.buildMetadata,
    });

    const doc = new this.Model(data);

    await doc.save();

    const now = new Date();

		const shadow = new this.ShadowModel({
      id: doc._id ?? v4(),
      version,
      data,
      changes: [],
      createdAt: now,
      updatedAt: now,
    } as Shadow<T>);

    await shadow.save();

    return {
      data: doc.toObject() as unknown as T,
      shadow: shadow.toObject({ getters: true }) as Shadow<T>,
    };
  };

  // insertMany();

  public async update<T>(
    data: T,
    incrementFormat: EntitySemVerIncrement,
    options?: {
      semVer?: string;
      preRelease?: string;
      buildMetadata: string;
    },
  ): Promise<Shadow<T>> {
    return;
  };

  // updateMany();

  public async remove<T>(
    data: T,
    options: {  
      semVer?: string;
      preRelease?: string;
      buildMetadata: string;
    },
  ): Promise<void> {
    return;
  };

  // removeMany();
}
