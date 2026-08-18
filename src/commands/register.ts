import * as Console from 'effect/Console';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as Path from 'effect/Path';
import * as S from 'effect/Schema';
import * as Argument from 'effect/unstable/cli/Argument';
import * as Command from 'effect/unstable/cli/Command';

import * as Output from '../output.ts';
import * as PersistedAppData from '../PersistedAppData.ts';
import { AbsolutePath } from '../schemas/AbsolutePath.ts';

const handler = Effect.fn('Register.run')(function*({ path: input }) {
	const path = yield* Path.Path;
	const repoPath = yield* S.decodeUnknownEffect(AbsolutePath)(
		Option.getOrElse(input, () => path.resolve('.'))
	);
	const persistedAppData = yield* PersistedAppData.Service;

	yield* persistedAppData.register(repoPath);
	const jsonl = yield* Output.Jsonl;
	yield* Console.log(
		Output.formatRegistrationResult('register', repoPath, jsonl)
	);
});

/** Register a repo directory. */
export const command = Command.make(
	'register',
	{
		path: Argument.directory('path', { mustExist: true }).pipe(
			Argument.optional
		)
	},
	handler
).pipe(
	Command.withDescription('Register a repo directory'),
	Command.provide(PersistedAppData.layer)
);
