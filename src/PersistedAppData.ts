import * as Arr from 'effect/Array';
import * as Config from 'effect/Config';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as FileSystem from 'effect/FileSystem';
import { flow, pipe } from 'effect/Function';
import * as Layer from 'effect/Layer';
import * as Match from 'effect/Match';
import * as Option from 'effect/Option';
import * as Path from 'effect/Path';
import * as PlatformError from 'effect/PlatformError';
import * as S from 'effect/Schema';
import * as SynchronizedRef from 'effect/SynchronizedRef';
import * as Tuple from 'effect/Tuple';
import * as Toml from 'effect/unstable/encoding/Toml';

import { AbsolutePath } from './schemas/AbsolutePath.ts';

class TomlParseError extends S.TaggedError<TomlParseError>()(
	'TomlParseError',
	{
		path: S.String,
		message: S.String,
		cause: S.Defect()
	},
	{ description: 'The persisted repo CLI data is not valid TOML.' }
) {}

/** Data persisted in the repo CLI configuration file. */
export class Schema extends S.Class<Schema>('PersistedAppData')({
	repoPaths: S.Array(AbsolutePath)
}) {}

interface Interface {
	/** The currently registered repo paths. */
	readonly repoPaths: Effect.Effect<ReadonlyArray<AbsolutePath>>;
	/** Register a repo path. */
	readonly register: (
		path: AbsolutePath
	) => Effect.Effect<void, PlatformError.PlatformError>;
	/** Deregister a repo path. */
	readonly deregister: (
		path: AbsolutePath
	) => Effect.Effect<void, PlatformError.PlatformError>;
}

/** Access to the persisted repo CLI data. */
export class Service extends Context.Service<Service, Interface>()(
	'@repo/PersistedAppData'
) {}

const AbsolutePathJson = S.fromJsonString(AbsolutePath);
const encodeAbsolutePath = S.encodeSync(AbsolutePathJson);
const absolutePathEquivalence = S.toEquivalence(AbsolutePath);

const encode = flow(
	(data: Schema) => data.repoPaths,
	Arr.map((path) => encodeAbsolutePath(path)),
	Arr.join(', '),
	(paths) => `repoPaths = [${paths}]\n`
);

const makeService = Effect.fnUntraced(function*(
	initial: Schema,
	persist: (
		data: Schema
	) => Effect.Effect<void, PlatformError.PlatformError>
) {
	const state = yield* SynchronizedRef.make(initial.repoPaths);
	const update = Effect.fnUntraced(function*(
		transform: (
			paths: ReadonlyArray<AbsolutePath>
		) => ReadonlyArray<AbsolutePath>
	) {
		yield* SynchronizedRef.modifyEffect(state, (repoPaths) => {
			const next = transform(repoPaths);
			return persist(new Schema({ repoPaths: next })).pipe(
				Effect.as(Tuple.make(undefined, next))
			);
		});
	});

	return Service.of({
		repoPaths: SynchronizedRef.get(state),
		register: Effect.fn('PersistedAppData.register')(function*(repoPath) {
			yield* update((repoPaths) =>
				pipe(
					repoPaths,
					Arr.append(repoPath),
					Arr.dedupeWith(absolutePathEquivalence)
				)
			);
		}),
		deregister: Effect.fn('PersistedAppData.deregister')(function*(
			repoPath
		) {
			yield* update(
				Arr.filter(
					(candidate) => !absolutePathEquivalence(candidate, repoPath)
				)
			);
		})
	});
});

/** Load persisted repo CLI data from `~/.repos/config.toml`. */
export const layer = Layer.effect(
	Service,
	Effect.gen(function*() {
		const fileSystem = yield* FileSystem.FileSystem;
		const path = yield* Path.Path;
		const home = yield* Config.nonEmptyString('HOME');
		const configDirectory = path.join(home, '.repos');
		const configPath = path.join(configDirectory, 'config.toml');
		const contents = yield* fileSystem.readFileString(configPath).pipe(
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
		const initial = yield* Option.match(contents, {
			onNone: () =>
				Effect.succeed(
					new Schema({ repoPaths: Arr.empty<AbsolutePath>() })
				),
			onSome: (configContents) =>
				Effect.try({
					try: () => Toml.parse(configContents),
					catch: (cause) =>
						new TomlParseError({
							path: configPath,
							message: 'Failed to parse persisted repo CLI data',
							cause
						})
				}).pipe(Effect.flatMap(S.decodeUnknownEffect(Schema)))
		});
		const persist = Effect.fn('PersistedAppData.persist')(function*(
			data: Schema
		) {
			yield* fileSystem.makeDirectory(configDirectory, {
				recursive: true
			});
			yield* fileSystem.writeFileString(configPath, encode(data));
		});

		return yield* makeService(initial, persist);
	})
);

/** Provide mutable persisted repo CLI data without filesystem access. */
export const testLayer = (repoPaths: ReadonlyArray<AbsolutePath>) =>
	Layer.effect(
		Service,
		makeService(
			new Schema({ repoPaths }),
			() => Effect.void
		)
	);
