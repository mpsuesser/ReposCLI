import * as Arr from 'effect/Array';
import * as Bool from 'effect/Boolean';
import * as Console from 'effect/Console';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Match from 'effect/Match';
import * as Num from 'effect/Number';
import * as Schema from 'effect/Schema';
import * as Str from 'effect/String';
import * as Command from 'effect/unstable/cli/Command';

import * as Output from '../output.ts';
import * as PersistedAppData from '../PersistedAppData.ts';
import { Repos } from '../Repos.ts';
import * as AbsolutePath from '../schemas/AbsolutePath.ts';
import * as Repo from '../schemas/Repo.ts';
import * as RepoKind from '../schemas/RepoKind.ts';

class RepoJsonLine extends Schema.Class<RepoJsonLine>('RepoJsonLine')({
	name: Schema.String,
	path: AbsolutePath.AbsolutePath,
	kind: RepoKind.RepoKind
}) {}

const RepoJsonLineString = Schema.fromJsonString(RepoJsonLine);
const encodeJsonLine = Schema.encodeSync(RepoJsonLineString);
const repoKindEquivalence = Schema.toEquivalence(RepoKind.RepoKind);

const ansi = {
	reset: '\u001b[0m',
	bold: '\u001b[1m',
	dim: '\u001b[2m',
	cyan: '\u001b[36m',
	green: '\u001b[32m',
	magenta: '\u001b[35m'
};

const decorate = (
	text: string,
	styles: ReadonlyArray<string>,
	colors: boolean
): string =>
	Bool.match(colors, {
		onFalse: () => text,
		onTrue: () => `${Arr.join(styles, '')}${text}${ansi.reset}`
	});

const kindColor = Match.type<RepoKind.RepoKind>().pipe(
	Match.when('mps-typescript-project', () => ansi.magenta),
	Match.when('fork', () => ansi.cyan),
	Match.when('resources', () => ansi.green),
	Match.exhaustive
);

const formatGroup = (
	kind: RepoKind.RepoKind,
	repos: ReadonlyArray<Repo.Repo>,
	colors: boolean
): string => {
	const nameWidth = Arr.reduce(
		repos,
		0,
		(width, repo) => Num.max(width, Str.length(repo.name))
	);
	const heading = decorate(kind, [ansi.bold, kindColor(kind)], colors);
	const lines = Arr.map(repos, (repo) => {
		const name = decorate(
			Str.padEnd(nameWidth)(repo.name),
			[ansi.bold],
			colors
		);
		const path = decorate(repo.path, [ansi.dim], colors);

		return `  ${name}  ${path}`;
	});

	return Arr.join(Arr.prepend(lines, heading), '\n');
};

/** Format repos as compact, kind-grouped terminal output. */
export const formatHuman = (
	repos: ReadonlyArray<Repo.Repo>,
	options: { readonly colors: boolean }
): string =>
	Arr.join(
		Arr.flatMap(RepoKind.RepoKind.literals, (kind) => {
			const matching = Arr.filter(repos, (repo) =>
				repoKindEquivalence(repo.kind, kind));

			return Arr.match(matching, {
				onEmpty: Arr.empty<string>,
				onNonEmpty: (matchingRepos) =>
					Arr.of(formatGroup(kind, matchingRepos, options.colors))
			});
		}),
		'\n\n'
	);

/** Format repos as one JSON object per line. */
export const formatJsonl = (repos: ReadonlyArray<Repo.Repo>): string =>
	Arr.join(
		Arr.map(repos, (repo) =>
			encodeJsonLine(
				new RepoJsonLine({
					name: repo.name,
					path: repo.path,
					kind: repo.kind
				})
			)),
		'\n'
	);

const handler = Effect.fn('PrintRepos.run')(function*() {
	const jsonl = yield* Output.Jsonl;
	const repos = yield* Repos;
	const output = Bool.match(jsonl, {
		onFalse: () => formatHuman(repos.repos, { colors: true }),
		onTrue: () => formatJsonl(repos.repos)
	});

	yield* Bool.match(Str.isNonEmpty(output), {
		onFalse: () => Effect.void,
		onTrue: () => Console.log(output)
	});
});

/** Print all registered repos. */
export const command = Command.make('repos', {}, handler).pipe(
	Command.withDescription('Print all registered repos'),
	Command.provide(
		Repos.layer.pipe(Layer.provide(PersistedAppData.layer))
	)
);
