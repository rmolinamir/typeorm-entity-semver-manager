export interface Shadow<T = unknown> {
  id: string;
  version: string;
  data: T;
  createdAt: Date;
}
