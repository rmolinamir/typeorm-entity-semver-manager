import faker from 'faker';
import { SemVerManagerIncrement, EntitySemVerManager } from '../src';

describe('EntitySemVerManager static methods', () => {
  describe('serializeSemVer API works correctly', () => {
    test('correctly serializes a SemVer', () => {
      const semVer = faker.system.semver();
      const preRelease = 'alpha1';
      const buildMetadata = 'BX012399A1';

      const serializedSemVer = EntitySemVerManager.serializeSemVer({
        semVer,
        preRelease,
        buildMetadata,
      });

      // console.log('DEBUG - serializedSemVer: ', serializedSemVer);

      expect(serializedSemVer).toBe(`${semVer}-${preRelease}+${buildMetadata}`);
    });

    test('throws an error when serializing with invalid parameters', () => {
      const semVer = '~1.0.0';
      const preRelease = 'alpha1';
      const buildMetadata = 'BX012399A1';

      expect(() => {
        EntitySemVerManager.serializeSemVer({
          semVer,
          preRelease,
          buildMetadata,
        });
      }).toThrow(`Serialized Semantic Version [${semVer}-${preRelease}+${buildMetadata}] does not match the Semantic Versioning 2.0.0 specs.`);
    });
  });

  describe('parseSemVer API works correctly', () => {
    test('correctly parses a SemVer', () => {
      const semVer = '1.0.0-alpha1+21AF26D3--117B344092BD';

      const parsedSemVer = EntitySemVerManager.parseSemVer(semVer);

      expect(parsedSemVer).toBeInstanceOf(Object);

      expect(parsedSemVer.match).toBe(semVer);
      expect(parsedSemVer.major).toBe('1');
      expect(parsedSemVer.minor).toBe('0');
      expect(parsedSemVer.patch).toBe('0');
      expect(parsedSemVer.preRelease).toBe('alpha1');
      expect(parsedSemVer.buildMetadata).toBe('21AF26D3--117B344092BD');
    });

    test('throws an error when parsing invalid SemVer', () => {
      const semVer = '~1.0.0';

      expect(() => {
        EntitySemVerManager.parseSemVer(semVer);
      }).toThrow(`Semantic Version [${semVer}] does not match the Semantic Versioning 2.0.0 specs.`);

    });
  });

  describe('increaseSemVer API works correctly', () => {
    test('correctly increases a SemVer using custom SemVer parameters', () => {
      const semVer = '1.0.0';

      const customSemVer = '1.0.2-alpha1+BX012399A1';

      const increasedSemVer = EntitySemVerManager.increaseSemVer(
        semVer,
        {
          customSemVer,
        },
      );

      expect(increasedSemVer).toBe(customSemVer);
    });

    test('correctly increases a SemVer using SemVerManagerIncrement parameters', () => {
      const semVer = '0.0.0';
      const preRelease = 'alpha1';
      const buildMetadata = 'BX012399A1';

      const fixtures = [
        { expectedSemVer: '1.0.0', incrementFormat: SemVerManagerIncrement.MAJOR },
        { expectedSemVer: '0.1.0', incrementFormat: SemVerManagerIncrement.MINOR },
        { expectedSemVer: '0.0.1', incrementFormat: SemVerManagerIncrement.PATCH },
      ];

      for (const { expectedSemVer, incrementFormat } of fixtures) {
        // console.log('DEBUG - incrementFormat: ', incrementFormat);

        const increasedSemVer = EntitySemVerManager.increaseSemVer(
          semVer,
          {
            incrementFormat,
            preRelease,
            buildMetadata,
          },
        );

        expect(increasedSemVer).toBe(EntitySemVerManager.serializeSemVer({
          semVer: expectedSemVer,
          preRelease,
          buildMetadata,
        }));
      }
    });

    test('throws an error when the increased SemVer does not comply with 2.0.0 precedence sepcs', () => {
      const semVer = '1.0.0';

      const customSemVer = '0.0.2-alpha1+BX012399A1';

      expect(() => {
        EntitySemVerManager.increaseSemVer(
          semVer,
          {
            customSemVer,
          },
        );
      }).toThrow(`Previous Semantic Version [${semVer}] is bigger than new Semantic Versioning [${customSemVer}].`);
    });

    test('throws an error when the original SemVer is invalid', () => {
      const semVer = '~1.0.0';

      expect(() => {
        EntitySemVerManager.increaseSemVer(
          semVer,
          {
            incrementFormat: SemVerManagerIncrement.MAJOR,
          },
        );
      }).toThrow(`Semantic Version [${semVer}] does not match the Semantic Versioning 2.0.0 specs.`);
    });

    test('throws an error when the custom SemVer is invalid', () => {
      const semVer = '1.0.0';

      const customSemVer = '~1.0.2';

      expect(() => {
        EntitySemVerManager.increaseSemVer(
          semVer,
          {
            customSemVer,
          },
        );
      }).toThrow(`Semantic Version [${customSemVer}] does not match the Semantic Versioning 2.0.0 specs`);
    });
  });
});
