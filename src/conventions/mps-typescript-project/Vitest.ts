import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';

import * as Convention from '../Convention.ts';
import * as ConventionId from '../ConventionId.ts';
import * as RootEntries from '../facts/RootEntries.ts';
import * as RootPackageManifest from '../facts/RootPackageManifest.ts';
import * as Finding from '../Finding.ts';
import { runtime } from '../runtime.ts';
import * as Support from '../support.ts';

/** Atom checking Vitest installation and root configuration. */
export const atom = runtime.atom((get) =>
	Effect.gen(function*() {
		const entries = yield* get.result(RootEntries.atom, {
			suspendOnWaiting: true
		});
		const manifest = yield* get.result(RootPackageManifest.atom, {
			suspendOnWaiting: true
		});
		return Support.findingsOutcome(
			Arr.getSomes(
				Arr.map([
					Support.hasDependency(manifest, 'vitest')
						? undefined
						: Finding.make(
							'missing-vitest-dependency',
							'vitest must be declared as a dependency.',
							'package.json'
						),
					Support.hasDependency(manifest, '@effect/vitest')
						? undefined
						: Finding.make(
							'missing-effect-vitest-dependency',
							'@effect/vitest must be declared as a dependency.',
							'package.json'
						),
					RootEntries.has(entries, 'vitest.config.ts', 'File')
						? undefined
						: Finding.make(
							'missing-vitest-config',
							'Repository must contain vitest.config.ts.',
							'vitest.config.ts'
						)
				], Option.fromNullishOr)
			)
		);
	})
);

/** Vitest toolchain convention. */
export const convention = Convention.make({
	id: ConventionId.make('mps-typescript-project/vitest'),
	title: 'Vitest',
	atom
});
