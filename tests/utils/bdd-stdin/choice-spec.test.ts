/* eslint-disable no-console */
import inquirer from 'inquirer';
import bddStdin from './index';

async function choice(message: string, list: string[]): Promise<string> {
  const question = {
    type: 'list',
    name: 'choice',
    message: message,
    choices: list,
  };

  const answers: Partial<{ choice: string; }> = await inquirer.prompt([question]);

  return answers!.choice!.trim();
}

describe('choice from inquirer', function () {

  it('selects the default choice', async function () {
    bddStdin('\n');

    const response = await choice('pick one', ['one', 'two']);
    console.log('received response ' + response);
    expect(response).toBe('one');
  });

  it('selects the second choice - nogit', async function () {
    bddStdin(bddStdin.keys.down, '\n');

    const response = await choice('pick two', ['one', 'two']);
    console.log('received response ' + response);
    expect(response).toBe('two');
  });

  it('selects the third choice - nogit', async function () {
    bddStdin(bddStdin.keys.down, bddStdin.keys.down, '\n');

    const response = await choice('pick three', ['one', 'two', 'three']);
    console.log('received response ' + response);
    expect(response).toBe('three');
  });

});
