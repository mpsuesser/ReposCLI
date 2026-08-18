import * as Effect from 'effect/Effect';
import * as FileSystem from 'effect/FileSystem';
import * as Match from 'effect/Match';
import * as Option from 'effect/Option';
import * as Path from 'effect/Path';
import * as Schema from 'effect/Schema';
import * as Toml from 'effect/unstable/encoding/Toml';

import * as AbsolutePath from './schemas/AbsolutePath.ts';
import * as RepoKind from './schemas/RepoKind.ts';

class TomlParseError extends Schema.TaggedError<TomlParseError>()(
	'TomlParseError',
	{
		path: Schema.String,
		message: Schema.String,
		cause: Schema.Defect()
	},
	{ description: 'A repo.toml file is not valid TOML.' }
) {}

/** Data persisted in a repository's local `repo.toml` file. */
export class Data extends Schema.Class<Data>('PersistedRepoData')({
	kind: RepoKind.RepoKind
}) {}

const RepoKindJson = Schema.fromJsonString(RepoKind.RepoKind);
const encodeRepoKind = Schema.encodeSync(RepoKindJson);

/** Load local repo data, defaulting repos without metadata to TypeScript. */
export const load = Effect.fn('PersistedRepoData.load')(function*(
	repoPath: AbsolutePath.AbsolutePath
) {
	const fileSystem = yield* FileSystem.FileSystem;
	const path = yield* Path.Path;
	const metadataPath = path.join(repoPath, 'repo.toml');
	const contents = yield* fileSystem.readFileString(metadataPath).pipe(
		Effect.map(Option.some),
		Effect.catchTag(
			'PlatformError',
			(error) =>
				Match.value(error.reason).pipe(
					Match.tag(
						'NotFound',
						() => Effect.succeed(Option.none<string>())
					),
					Match.orElse(() => Effect.fail(error))
				)
		)
	);

	return yield* Option.match(contents, {
		onNone: () =>
			Effect.succeed(new Data({ kind: 'mps-typescript-project' })),
		onSome: (metadataContents) =>
			Effect.try({
				try: () => Toml.parse(metadataContents),
				catch: (cause) =>
					new TomlParseError({
						path: metadataPath,
						message: 'Failed to parse local repo data',
						cause
					})
			}).pipe(Effect.flatMap(Schema.decodeUnknownEffect(Data)))
	});
});

/** Persist a repo kind in the repository's local `repo.toml` file. */
export const save = Effect.fn('PersistedRepoData.save')(function*(
	repoPath: AbsolutePath.AbsolutePath,
	kind: RepoKind.RepoKind
) {
	const fileSystem = yield* FileSystem.FileSystem;
	const path = yield* Path.Path;
	const metadataPath = path.join(repoPath, 'repo.toml');

	yield* fileSystem.writeFileString(
		metadataPath,
		`kind = ${encodeRepoKind(kind)}\n`
	);
});
