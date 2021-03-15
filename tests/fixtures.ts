// Libraries
import faker from 'faker';
import {
  Entity,
  ObjectIdColumn,
  Column,
  Unique,
  ConnectionOptions,
} from 'typeorm';
import { ShadowEntity } from '../src';

export const validSemVers: string[] = [ // Valid SemVers taken from `https://semver.org/`
  '1.0.0-alpha',
  '1.0.0-alpha.1',
  '1.0.0-alpha.beta',
  '1.0.0-beta',
  '1.0.0-beta.2',
  '1.0.0-beta.11',
  '1.0.0-rc.1',
  '1.0.0',
  '0.0.0',
  '1.0.0-alpha+001',
  '1.0.0+20130313144700',
  '1.0.0-beta+exp.sha.5114f85',
  '1.0.0+21AF26D3--117B344092BD',
];

export const invalidSemVers: string[] = [
  '^1.0.0',
  '~1.0.0',
  '1.0.0-alpha.',
  '1.0.0-alpha.1.',
  '1.0.0-alpha.beta..',
  '1.0.0-beta.11.',
  '1.0.0-rc.1.',
  '1.0.0.',
  '1.0.0&',
  '1.0.0^',
  '1.0.0_',
  '1.0.0_alpha+001',
  '1.0.0+^20130313144700',
  '1.0.0+&20130313144700',
  '1.0.0-beta^exp.sha.5114f85',
  '1.0.0+21AF26D3_-117B344092BD',
];

export interface  Person {
  '@context': 'https://schema.org';
  '@type': 'Person';
  id: string;
  address: PostalAddress;
  colleague: string[];
  email: string;
  image: string;
  jobTitle: string;
  name: string;
  telephone: string;
  url: string;
}

interface PostalAddress {
  '@type': 'PostalAddress';
  addressLocality: string;
  addressRegion: string;
  postalCode: string;
  streetAddress: string;
}

@Entity('person')
@Unique(['id'])
export class PersonEntity implements Person {
  constructor(args: Person) {
    Object.assign(this, args);
    this['@context'] = 'https://schema.org';
    this['@type'] = 'Person';
  }

  @Column()
  '@context': 'https://schema.org';

  @Column()
  '@type': 'Person';

  @ObjectIdColumn()
  _id: string;

  @Column()
  id: string;

  @Column(() => TypeOrmPostalAddress)
  address: PostalAddress;

  @Column('array')
  colleague: string[];

  @Column()
  email: string;

  @Column()
  image: string;

  @Column()
  jobTitle: string;

  @Column()
  name: string;

  @Column()
  telephone: string;

  @Column()
  url: string;
}
class TypeOrmPostalAddress implements PostalAddress {
  constructor(args: Person) {
    Object.assign(this, args);
    this['@type'] = 'PostalAddress';
  }

  @Column()
  '@type': 'PostalAddress';

  @Column()
  addressLocality: string;

  @Column()
  addressRegion: string;

  @Column()
  postalCode: string;

  @Column()
  streetAddress: string;
}

export const connectionOptions: ConnectionOptions = {
  type: 'mongodb',
  host: 'localhost',
  port: 27017,
  database: 'test',
  entities: [PersonEntity, ShadowEntity],
  synchronize: true,
  useUnifiedTopology: true,
};

export function generatePerson(id: string = faker.random.uuid()): Person {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    id,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Seattle',
      addressRegion: 'WA',
      postalCode: '98052',
      streetAddress: '20341 Whitworth Institute 405 N. Whitworth',
    },
    colleague: [
      'http://www.xyz.edu/students/alicejones.html',
      'http://www.xyz.edu/students/bobsmith.html',
    ],
    email: 'mailto:jane-doe@xyz.edu',
    image: 'janedoe.jpg',
    jobTitle: 'Professor',
    name: 'Jane Doe',
    telephone: '(425) 123-4567',
    url: 'http://www.janedoe.com',
  };
}
