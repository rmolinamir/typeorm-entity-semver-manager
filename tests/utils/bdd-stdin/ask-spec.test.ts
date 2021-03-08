import bddStdin from './index';
import ask from './utils/ask';

describe('ask', function () {

  it('asks one question', async function () {
    bddStdin('response');

    const response = await ask('question: test');
    expect(response).toBe('response');
  });

  it('asks two questions', async function () {
    bddStdin('one', 'two');

    console.log('first answer');

    const response = await ask('first question');
    console.log('received response ' + response);
    expect(response).toBe('one');

    const response_1 = await ask('second question');
    console.log('received response ' + response_1);
    expect(response_1).toBe('two');
  });

  it('asks three questions', async function () {
    bddStdin('one', 'two', 'three');

    const response = await ask('question 1');
    console.log(response === 'one');
    expect(response).toBe('one');

    const response_1 = await ask('question 2');
    console.log(response_1 === 'two');
    expect(response_1).toBe('two');

    const response_2 = await ask('question 3');
    console.log(response_2 === 'three');
    expect(response_2).toBe('three');
  });

  it('asks three questions separately', async function () {
    bddStdin('one');

    const response = await ask('question 1');
    console.log('received response ' + response);
    expect(response).toBe('one');

    bddStdin('two');

    const response_1 = await ask('question 2');
    console.log('received response ' + response_1);
    expect(response_1).toBe('two');

    bddStdin('three');

    const response_2 = await ask('question 3');
    console.log('received response ' + response_2);
    expect(response_2).toBe('three');
  });

});
