/* eslint-disable no-console */
import Bluebird from 'bluebird';

export default function ask(question: string): Promise<string> {
  console.log(question);

  return new Bluebird((resolve) => {
    process.stdin.once('data', (data) => {
      resolve(data.toString().trim());
    });
  });
}
