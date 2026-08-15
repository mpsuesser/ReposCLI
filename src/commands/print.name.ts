import * as Effect from 'effect/Effect';
import * as Command from 'effect/unstable/cli/Command';

const handler = Effect.fn('PrintName.run')(function*() {
	return yield* Effect.succeed('name');
});

/** Nested name command. */
export const command = Command.make('name', {}, handler);
