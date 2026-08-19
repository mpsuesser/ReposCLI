import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as Str from 'effect/String';

import * as Convention from '../Convention.ts';
import * as ConventionId from '../ConventionId.ts';
import * as Outcome from '../ConventionOutcome.ts';
import * as OxlintConfig from '../facts/OxlintConfig.ts';
import * as RootEntries from '../facts/RootEntries.ts';
import * as RootPackageManifest from '../facts/RootPackageManifest.ts';
import * as Finding from '../Finding.ts';
import { runtime } from '../runtime.ts';
import * as Support from '../support.ts';

/** Atom checking the official Effect tsgo Oxlint integration. */
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
		const hasPatchScript = Option.exists(
			manifest.scripts,
			(scripts) =>
				Option.exists(
					Option.fromNullishOr(scripts.prepare),
					(script) =>
						Arr.contains(
							Arr.map(Str.split('&&')(script), Str.trim),
							'effect-tsgo patch --oxlint'
						)
				)
		);
		const isTypeAware = Option.exists(
			config.options,
			(options) => Option.getOrElse(options.typeAware, () => false)
		);

		return Support.findingsOutcome(
			Arr.getSomes(
				Arr.map([
					Support.hasDependency(manifest, '@effect/tsgo')
						? undefined
						: Finding.make(
							'missing-effect-tsgo-dependency',
							'@effect/tsgo must be declared as a dependency.',
							'package.json'
						),
					Support.hasOxlintPlugin(config, 'effecttsgo')
						? undefined
						: Finding.make(
							'missing-effecttsgo-plugin',
							'.oxlintrc.json must enable the effecttsgo plugin.',
							'.oxlintrc.json'
						),
					isTypeAware
						? undefined
						: Finding.make(
							'oxlint-not-type-aware',
							'.oxlintrc.json must set options.typeAware to true.',
							'.oxlintrc.json'
						),
					hasPatchScript
						? undefined
						: Finding.make(
							'missing-effect-tsgo-patch',
							'prepare must run effect-tsgo patch --oxlint.',
							'package.json'
						)
				], Option.fromNullishOr)
			)
		);
	})
);

/** Official Effect tsgo Oxlint integration convention. */
export const convention = Convention.make({
	id: ConventionId.make('mps-typescript-project/effect-tsgo-oxlint'),
	title: 'Effect tsgo Oxlint integration',
	atom
});
