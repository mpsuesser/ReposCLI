import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';

import * as Convention from '../Convention.ts';
import * as ConventionId from '../ConventionId.ts';
import * as Outcome from '../ConventionOutcome.ts';
import * as DprintConfig from '../facts/DprintConfig.ts';
import * as RootEntries from '../facts/RootEntries.ts';
import * as RootPackageManifest from '../facts/RootPackageManifest.ts';
import * as Finding from '../Finding.ts';
import { runtime } from '../runtime.ts';
import * as Support from '../support.ts';

/** Atom checking Dprint installation and configuration. */
export const atom = runtime.atom((get) =>
	Effect.gen(function*() {
		const entries = yield* get.result(RootEntries.atom, {
			suspendOnWaiting: true
		});
		const manifest = yield* get.result(RootPackageManifest.atom, {
			suspendOnWaiting: true
		});
		const hasConfig = RootEntries.has(entries, 'dprint.json', 'File');
		if (hasConfig) {
			yield* get.result(DprintConfig.atom, { suspendOnWaiting: true });
		}
		const findings = Arr.getSomes(
			Arr.map([
				Support.hasDependency(manifest, 'dprint')
					? undefined
					: Finding.make(
						'missing-dprint-dependency',
						'dprint must be declared as a dependency.',
						'package.json'
					),
				hasConfig
					? undefined
					: Finding.make(
						'missing-dprint-config',
						'Repository must contain dprint.json.',
						'dprint.json'
					)
			], Option.fromNullishOr)
		);

		return Arr.match(findings, {
			onEmpty: () => Outcome.satisfied,
			onNonEmpty: Outcome.violated
		});
	})
);

/** Dprint toolchain convention. */
export const convention = Convention.make({
	id: ConventionId.make('mps-typescript-project/dprint'),
	title: 'Dprint',
	atom
});
