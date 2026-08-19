import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';

import * as Convention from '../Convention.ts';
import * as ConventionId from '../ConventionId.ts';
import * as LefthookConfig from '../facts/LefthookConfig.ts';
import * as RootEntries from '../facts/RootEntries.ts';
import * as RootPackageManifest from '../facts/RootPackageManifest.ts';
import * as Finding from '../Finding.ts';
import { runtime } from '../runtime.ts';
import * as Support from '../support.ts';

/** Atom checking Lefthook installation and configuration. */
export const atom = runtime.atom((get) =>
	Effect.gen(function*() {
		const entries = yield* get.result(RootEntries.atom, {
			suspendOnWaiting: true
		});
		const manifest = yield* get.result(RootPackageManifest.atom, {
			suspendOnWaiting: true
		});
		const hasConfig = RootEntries.has(entries, 'lefthook.yml', 'File');
		if (hasConfig) {
			yield* get.result(LefthookConfig.atom, { suspendOnWaiting: true });
		}
		return Support.findingsOutcome(
			Arr.getSomes(
				Arr.map([
					Support.hasDependency(manifest, 'lefthook')
						? undefined
						: Finding.make(
							'missing-lefthook-dependency',
							'lefthook must be declared as a dependency.',
							'package.json'
						),
					hasConfig
						? undefined
						: Finding.make(
							'missing-lefthook-config',
							'Repository must contain lefthook.yml.',
							'lefthook.yml'
						)
				], Option.fromNullishOr)
			)
		);
	})
);

/** Lefthook toolchain convention. */
export const convention = Convention.make({
	id: ConventionId.make('mps-typescript-project/lefthook'),
	title: 'Lefthook',
	atom
});
