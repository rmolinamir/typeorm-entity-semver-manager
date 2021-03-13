// Types
import { Shadow } from './shadow';

export enum EntitySemVerIncrement {
  MAJOR, // Version when you make incompatible API changes
  MINOR, // Version when you add functionality in a backwards compatible manner
  PATCH, // Version when you make backwards compatible bug fixes.
}

export interface EntitySemVer<T extends { id: Shadow['id'] } | { _id: Shadow['id'] }> {
  
	/**
	 * Inserts an entity into its shadow table by storing a snapshot of the entity (an image),
   * and creates its SemVer following the 2.0.0 specs.
   * 
   * The entity must have an `id` or `_id` property.
	 * 
	 * @param entity - Entity Plain Object.
	 * @param options - Options object.
	 */
  insert(
    entity: T,
    options?: (
      {
        customSemVer: string;
      } |
      {
        initialSemVer?: string;
        preRelease?: string;
        buildMetadata?: string;
      }
    ),
  ): Promise<Shadow<T>>;

  // insertMany();

  /**
	 * Updates the shadow of an entity and increases its SemVer following the 2.0.0 specs. The changes
   * of the image are also stored.
   * 
   * If the current shadow in the database does not have a matching ID, the operation aborts with an
   * error. After the update is successful, shadow's SemVer is updated to the new version.
   * 
	 * @param entity - Entity Plain Object.
	 * @param options - Options object.
   */
  update(
    entity: T,
    options: (
      {
        customSemVer: string;
      } |
      {
        incrementFormat: EntitySemVerIncrement,
        preRelease?: string;
        buildMetadata?: string;
      }
    ),
  ): Promise<Shadow<T>>;

  // updateMany();


  /**
	 * Removes the shadow of an entity from the database by replacing its version
   * with a dummy version to mark the deletion. This dummy version can contain optional
   * meta-data (such as who deleted the object, and when)
   * 
   * 
	 * @param entity - Entity Plain Object.
	 * @param options - Options object.
   */
  remove(
    entity: T,
    options?: {
      preRelease?: string;
      buildMetadata?: string;
    },
  ): Promise<void>;

  // removeMany();
}
