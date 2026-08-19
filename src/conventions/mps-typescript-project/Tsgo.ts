import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';
import * as Str from 'effect/String';

import * as Convention from '../Convention.ts';
import * as ConventionId from '../ConventionId.ts';
import * as Outcome from '../ConventionOutcome.ts';
import * as RootEntries from '../facts/RootEntries.ts';
import * as RootPackageManifest from '../facts/RootPackageManifest.ts';
import * as RootTsconfig from '../facts/RootTsconfig.ts';
import * as Finding from '../Finding.ts';
import { runtime } from '../runtime.ts';
import * as Support from '../support.ts';

/** Atom checking the native TypeScript/tsgo toolchain. */
export const atom = runtime.atom((get) =>
	Effect.gen(function*() {
		const entries = yield* get.result(RootEntries.atom, {
			suspendOnWaiting: true
		});
		if (!RootEntries.has(entries, 'tsconfig.json', 'File')) {
			return new Outcome.NotApplicable({
				reason: 'The root TypeScript configuration is unavailable.'
			});
		}

		const [manifest, tsconfig] = yield* Effect.all([
			get.result(RootPackageManifest.atom, { suspendOnWaiting: true }),
			get.result(RootTsconfig.atom, { suspendOnWaiting: true })
		], { concurrency: 2 });
		const stringEquivalence = Schema.toEquivalence(Schema.String);
		const hasTypecheckScript = Option.exists(
			manifest.scripts,
			(scripts) =>
				Option.exists(
					Option.fromNullishOr(scripts.typecheck),
					(script) =>
						Arr.some(
							Str.split('&&')(script),
							(segment) =>
								Option.exists(
									Arr.head(
										Str.split(/\s+/)(Str.trim(segment))
									),
									(token) => stringEquivalence(token, 'tsc')
								)
						)
				)
		);
		const hasEffectSchema = Option.exists(
			tsconfig.$schema,
			(value) =>
				stringEquivalence(
					value,
					'./node_modules/@effect/tsgo/schema.json'
				)
		);

		return Support.findingsOutcome(
			Arr.getSomes(
				Arr.map([
					Support.hasDependency(manifest, 'typescript')
						? undefined
						: Finding.make(
							'missing-typescript-dependency',
							'typescript must be declared as a dependency.',
							'package.json'
						),
					Support.hasDependency(manifest, 'oxlint-tsgolint')
						? undefined
						: Finding.make(
							'missing-oxlint-tsgolint-dependency',
							'oxlint-tsgolint must be declared as a dependency.',
							'package.json'
						),
					hasTypecheckScript
						? undefined
						: Finding.make(
							'missing-tsgo-typecheck-script',
							'The typecheck script must invoke the patched tsc/tsgo binary.',
							'package.json'
						),
					hasEffectSchema
						? undefined
						: Finding.make(
							'missing-effect-tsgo-schema',
							'tsconfig.json must use @effect/tsgo/schema.json.',
							'tsconfig.json'
						)
				], Option.fromNullishOr)
			)
		);
	})
);

/** Native TypeScript/tsgo convention. */
export const convention = Convention.make({
	id: ConventionId.make('mps-typescript-project/tsgo'),
	title: 'tsgo',
	atom
});
