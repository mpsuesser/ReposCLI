import * as Effect from 'effect/Effect';
import * as Command from 'effect/unstable/cli/Command';

import { command as name } from './print.name.ts';

const handler = Effect.fn('Print.run')(function*() {
	return yield* Effect.succeed('print');
});

/** Print command and its nested commands. */
export const command = Command.make('print', {}, handler).pipe(
	Command.withSubcommands([name])
);
