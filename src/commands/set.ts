import * as Arr from 'effect/Array';
import * as Console from 'effect/Console';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as Path from 'effect/Path';
import * as Schema from 'effect/Schema';
import * as Argument from 'effect/unstable/cli/Argument';
import * as Command from 'effect/unstable/cli/Command';
import * as Prompt from 'effect/unstable/cli/Prompt';

import * as Output from '../output.ts';
import * as PersistedAppData from '../PersistedAppData.ts';
import * as PersistedRepoData from '../PersistedRepoData.ts';
import * as AbsolutePath from '../schemas/AbsolutePath.ts';
import * as RepoKind from '../schemas/RepoKind.ts';

const repoKindEquivalence = Schema.toEquivalence(RepoKind.RepoKind);

const handler = Effect.fn('Set.run')(function*({ path: input }) {
	const path = yield* Path.Path;
	const repoPath = yield* Schema.decodeUnknownEffect(
		AbsolutePath.AbsolutePath
	)(Option.getOrElse(input, () => path.resolve('.')));
	const current = yield* PersistedRepoData.load(repoPath);
	const kind = yield* Prompt.run(
		Prompt.autoComplete({
			message: 'Repo kind',
			filterLabel: 'kind',
			choices: Arr.map(RepoKind.RepoKind.literals, (choiceKind) => ({
				title: choiceKind,
				value: choiceKind,
				selected: repoKindEquivalence(choiceKind, current.kind)
			}))
		})
	);

	yield* PersistedRepoData.save(repoPath, kind);
	const persistedAppData = yield* PersistedAppData.Service;
	yield* persistedAppData.register(repoPath);
	const jsonl = yield* Output.Jsonl;
	yield* Console.log(Output.formatSetKindResult(repoPath, kind, jsonl));
});

/** Select and persist a repo's kind. */
export const command = Command.make(
	'set',
	{
		path: Argument.directory('path', { mustExist: true }).pipe(
			Argument.optional
		)
	},
	handler
).pipe(
	Command.withDescription("Select a repo's kind"),
	Command.provide(PersistedAppData.layer)
);
