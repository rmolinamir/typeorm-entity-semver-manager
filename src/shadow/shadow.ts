/**
 * > Following the semantic versioning spec helps other developers who depend
 * on your code understand the extent of changes in a given version, and
 * adjust their own code if necessary.
 * 
 * The shadow of a table that follows the semantic versioning spec.
 */
export interface Shadow<T = unknown> {
  id: string;
  version: string;
  image: T;
  // eslint-disable-next-line @typescript-eslint/ban-types
  changes: Array<{ version: string; change: object }>;
  createdAt: Date;
  updatedAt: Date;
}
