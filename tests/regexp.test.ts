import { REGEXP_SEM_VER } from '../src';
import { invalidSemVers, validSemVers } from './fixtures';

describe('REGEXP_SEM_VER works as expected', () => {
  test('correctly matches valid semantic versions', () => {
    validSemVers.forEach(semVer => {
      const matches = REGEXP_SEM_VER.test(semVer);

      if (!matches) {
        console.log('DEBUG - semVer: ', semVer);
      }

      expect(matches).toBe(true);
    });
  });

  test('correctly fails to match invalid semantic versions', () => {
    invalidSemVers.forEach(semVer => {
      const matches = REGEXP_SEM_VER.test(semVer);

      if (matches) {
        console.log('DEBUG - semVer: ', semVer);
      }

      expect(matches).toBe(false);
    });
  });
});
