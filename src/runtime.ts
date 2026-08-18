import * as BunRuntime from '@effect/platform-bun/BunRuntime';
import * as BunServices from '@effect/platform-bun/BunServices';
import * as Effect from 'effect/Effect';

/** Provide the Bun platform services and run an Effect as the main program. */
export const runMain = <A, E>(
	program: Effect.Effect<A, E, BunServices.BunServices>
): void => BunRuntime.runMain(program.pipe(Effect.provide(BunServices.layer)));
