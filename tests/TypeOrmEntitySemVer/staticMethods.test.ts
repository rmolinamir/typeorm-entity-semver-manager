import faker from 'faker';
import { TypeOrmEntitySemVer } from '../../src';

describe('TypeOrmEntitySemVer static methods', () => {
  describe('serializeSemVer API works correctly', () => {
    test('correctly serializes a SemVer', () => {
      const semVer = faker.system.semver();
      const preRelease = 'alpha1';
      const buildMetadata = 'BX012399A1';

      const serializedSemVer = TypeOrmEntitySemVer.serializeSemVer({
        semVer,
        preRelease,
        buildMetadata,
      });

      console.log('DEBUG - serializedSemVer: ', serializedSemVer);

      expect(serializedSemVer).toBe(`${semVer}-${preRelease}+${buildMetadata}`);
    });
  });

  // describe('parseSemVer API works correctly', () => {

  // });

  // describe('increaseSemVer API works correctly', () => {

  // });
});
