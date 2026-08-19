import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as FileSystem from 'effect/FileSystem';
import * as Path from 'effect/Path';
import * as Schema from 'effect/Schema';

import { ConventionEvaluationError } from '../ConventionEvaluationError.ts';
import * as CurrentRepo from '../CurrentRepo.ts';
import { runtime } from '../runtime.ts';

const RootEntryType = Schema.Literals([
	'File',
	'Directory',
	'SymbolicLink',
	'BlockDevice',
	'CharacterDevice',
	'FIFO',
	'Socket',
	'Unknown'
]);

/** A typed filesystem entry at a repository root. */
export class RootEntry extends Schema.Class<RootEntry>('ConventionRootEntry')({
	name: Schema.String,
	type: RootEntryType
}) {}

const nameEquivalence = Schema.toEquivalence(Schema.String);
const typeEquivalence = Schema.toEquivalence(RootEntryType);

/** Whether root entries contain the named filesystem artifact and type. */
export const has = (
	entries: ReadonlyArray<RootEntry>,
	name: string,
	type: typeof RootEntryType.Type
): boolean =>
	Arr.some(
		entries,
		(entry) =>
			nameEquivalence(entry.name, name)
			&& typeEquivalence(entry.type, type)
	);

/** Typed files and directories at the current repository root. */
export const atom = runtime.atom((get) =>
	Effect.gen(function*() {
		const repo = yield* get.some(CurrentRepo.atom);
		const fileSystem = yield* FileSystem.FileSystem;
		const path = yield* Path.Path;
		const entries = yield* fileSystem.readDirectory(repo.path).pipe(
			Effect.mapError(
				(cause) =>
					new ConventionEvaluationError({
						path: repo.path,
						message: `Unable to read ${repo.path}`,
						details: cause.message,
						cause
					})
			)
		);

		return yield* Effect.forEach(
			entries,
			(name) =>
				fileSystem.stat(path.join(repo.path, name)).pipe(
					Effect.map((info) =>
						new RootEntry({ name, type: info.type })
					),
					Effect.mapError(
						(cause) =>
							new ConventionEvaluationError({
								path: path.join(repo.path, name),
								message: `Unable to inspect ${name}`,
								details: cause.message,
								cause
							})
					)
				),
			{ concurrency: 16 }
		);
	})
);
