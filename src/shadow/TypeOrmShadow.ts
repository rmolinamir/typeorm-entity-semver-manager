// Libraries
import {
  Entity,
  ObjectIdColumn,
  Column,
  Unique,
  Index,
} from 'typeorm';

// Types
import { Shadow } from './Shadow';

@Entity('shadow')
@Unique(['id'])
@Unique(['id', 'version'])
export class TypeOrmShadow<T> implements Shadow<T> {
  constructor(args: Shadow<T>) {
    Object.assign(this, args)
  }

  @ObjectIdColumn()
  id: string;

  @Column('string')
  @Index()
  version: string;

  @Column()
  image: T;

  @Column('array')
  // eslint-disable-next-line @typescript-eslint/ban-types
  changes: Array<{ version: string; change: object }>;

  @Column('date')
  createdAt: Date;

  @Column('date')
  updatedAt: Date;
}
