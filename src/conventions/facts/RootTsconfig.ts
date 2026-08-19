import * as Effect from 'effect/Effect';
import * as Path from 'effect/Path';
import * as Schema from 'effect/Schema';

import * as CurrentRepo from '../CurrentRepo.ts';
import { runtime } from '../runtime.ts';
import * as Read from './read.ts';

/** Root TypeScript configuration fields consumed by universal conventions. */
export class RootTsconfig extends Schema.Class<RootTsconfig>(
	'ConventionRootTsconfig'
)({
	$schema: Schema.OptionFromOptionalKey(Schema.String),
	extends: Schema.OptionFromOptionalKey(Schema.String),
	compilerOptions: Schema.OptionFromOptionalKey(
		Schema.Record(Schema.String, Schema.Unknown)
	)
}) {}

/** Parsed root TypeScript configuration for the current repository. */
export const atom = runtime.atom((get) =>
	Effect.gen(function*() {
		const repo = yield* get.some(CurrentRepo.atom);
		const path = yield* Path.Path;
		return yield* Read.json(
			path.join(repo.path, 'tsconfig.json'),
			RootTsconfig
		);
	})
);

/** Parsed base TypeScript configuration for the current repository. */
export const baseAtom = runtime.atom((get) =>
	Effect.gen(function*() {
		const repo = yield* get.some(CurrentRepo.atom);
		const path = yield* Path.Path;
		return yield* Read.json(
			path.join(repo.path, 'tsconfig.base.json'),
			RootTsconfig
		);
	})
);
