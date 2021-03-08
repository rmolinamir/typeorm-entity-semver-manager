export interface Shadow<T = unknown> {
  id: string;
  version: string;
  data: T;
  changes: Partial<T>[];
  createdAt: Date;
}
