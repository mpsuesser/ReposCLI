import * as Effect from 'effect/Effect';
import * as Path from 'effect/Path';
import * as Schema from 'effect/Schema';

import * as CurrentRepo from '../CurrentRepo.ts';
import { runtime } from '../runtime.ts';
import * as Read from './read.ts';

/** Dprint configuration fields required by the universal convention. */
export class DprintConfig extends Schema.Class<DprintConfig>(
	'ConventionDprintConfig'
)({
	plugins: Schema.NonEmptyArray(Schema.String)
}) {}

/** Parsed root Dprint configuration for the current repository. */
export const atom = runtime.atom((get) =>
	Effect.gen(function*() {
		const repo = yield* get.some(CurrentRepo.atom);
		const path = yield* Path.Path;
		return yield* Read.json(
			path.join(repo.path, 'dprint.json'),
			DprintConfig
		);
	})
);
