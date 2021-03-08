// Libraries
import {
  Schema,
  Document,
  SchemaDefinition,
} from 'mongoose';

// Locals
import { REGEXP_SEM_VER } from './regexp';

// Types
import { Shadow } from './shadow';

/**
 * > Following the semantic versioning spec helps other developers who depend
 * on your code understand the extent of changes in a given version, and
 * adjust their own code if necessary.
 * 
 * The shadow schema of a collection that follows the semantic versioning
 * spec.
 */
export const shadowSchema = new Schema<Document<Shadow>>(
  {
    id: {
      type: Schema.Types.String,
      required: true,
      unique: true,
    },
    version: {
      type: Schema.Types.String,
      required: true,
      match: REGEXP_SEM_VER,
    },
    data: {
      type: Schema.Types.Mixed,
      required: true,
    },
    changes: [{
      type: Schema.Types.Mixed,
      required: true,
    }],
    createdAt: {
      type: Schema.Types.Date,
      required: true,
    },
    updateAt: {
      type: Schema.Types.Date,
      required: true,
    },
  } as SchemaDefinition<Shadow>,
  {
    _id: true,
    id: false,
    autoIndex: true,
    timestamps: true,
    versionKey: false,
  },
);
