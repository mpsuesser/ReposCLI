import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';

import * as Convention from '../Convention.ts';
import * as ConventionId from '../ConventionId.ts';
import * as Outcome from '../ConventionOutcome.ts';
import * as OxlintConfig from '../facts/OxlintConfig.ts';
import * as RootEntries from '../facts/RootEntries.ts';
import * as RootPackageManifest from '../facts/RootPackageManifest.ts';
import * as Finding from '../Finding.ts';
import { runtime } from '../runtime.ts';
import * as Support from '../support.ts';

const pluginName = '@mpsuesser/oxlint-plugin-effect';

/** Atom checking the MPS Effect Oxlint plugin wiring. */
export const atom = runtime.atom((get) =>
	Effect.gen(function*() {
		const entries = yield* get.result(RootEntries.atom, {
			suspendOnWaiting: true
		});
		if (!RootEntries.has(entries, '.oxlintrc.json', 'File')) {
			return new Outcome.NotApplicable({
				reason: 'The root Oxlint configuration is unavailable.'
			});
		}

		const [manifest, config] = yield* Effect.all([
			get.result(RootPackageManifest.atom, { suspendOnWaiting: true }),
			get.result(OxlintConfig.atom, { suspendOnWaiting: true })
		], { concurrency: 2 });
		return Support.findingsOutcome(
			Arr.getSomes(
				Arr.map([
					Support.hasDependency(manifest, pluginName)
						? undefined
						: Finding.make(
							'missing-mps-oxlint-plugin-dependency',
							`${pluginName} must be declared as a dependency.`,
							'package.json'
						),
					Support.hasOxlintJsPlugin(config, 'effect', pluginName)
						? undefined
						: Finding.make(
							'missing-mps-oxlint-plugin-config',
							`.oxlintrc.json must declare the effect JavaScript plugin from ${pluginName}.`,
							'.oxlintrc.json'
						)
				], Option.fromNullishOr)
			)
		);
	})
);

/** MPS Effect Oxlint plugin convention. */
export const convention = Convention.make({
	id: ConventionId.make('mps-typescript-project/mps-oxlint-plugin'),
	title: '@mpsuesser/oxlint-plugin-effect',
	atom
});
