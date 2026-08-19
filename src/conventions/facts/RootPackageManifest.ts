import * as Effect from 'effect/Effect';
import * as Path from 'effect/Path';

import * as CurrentRepo from '../CurrentRepo.ts';
import { runtime } from '../runtime.ts';
import * as PackageManifest from './PackageManifest.ts';
import * as Read from './read.ts';

/** Parsed root package manifest for the current repository. */
export const atom = runtime.atom((get) =>
	Effect.gen(function*() {
		const repo = yield* get.some(CurrentRepo.atom);
		const path = yield* Path.Path;
		return yield* Read.json(
			path.join(repo.path, 'package.json'),
			PackageManifest.PackageManifest
		);
	})
);
