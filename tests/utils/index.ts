import stdin from './bdd-stdin'; // TODO: Make a package out of this module.

export const ENTER = '\x0D';

export async function runWithAnswers<A>(
  command: () => Promise<A>,
  combo: Array<string> = [],
): Promise<A> {
  if (combo.length > 0) {
    stdin(...combo);
  };

  return command();
}
