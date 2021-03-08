// NOTE: https://stackoverflow.com/questions/8572826/generic-deep-diff-between-two-objects
// https://www.npmjs.com/package/deep-object-diff

import { Shadow } from './shadow';

export enum EntitySemVerIncrement {
  MAJOR, // Version when you make incompatible API changes
  MINOR, // Version when you add functionality in a backwards compatible manner
  PATCH, // Version when you make backwards compatible bug fixes.
}

export interface EntitySemVer<T> {
  
	/**
	 * Inserts a entity into its table and shadow table. The entity's
   * initial semantic version can be c
	 * 
	 * @param data
	 * @param options
	 */
  insert(
    data: T,
    options?: {  
      initialSemVer?: string;
      preRelease?: string;
      buildMetadata?: string;
    },
  ): Promise<{ data: T; shadow: Shadow<T>; }>;

  // insertMany();

  update(
    data: T,
    incrementFormat: EntitySemVerIncrement,
    options?: {
      semVer?: string;
      preRelease?: string;
      buildMetadata?: string;
    },
  ): Promise<{ data: T; shadow: Shadow<T>; }>;

  // updateMany();

  remove(
    data: T,
    options: {  
      semVer?: string;
      preRelease?: string;
      buildMetadata?: string;
    },
  ): Promise<void>;

  // removeMany();
}
