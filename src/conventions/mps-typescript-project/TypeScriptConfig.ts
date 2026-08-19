import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as R from 'effect/Record';
import * as Schema from 'effect/Schema';

import * as Convention from '../Convention.ts';
import * as ConventionId from '../ConventionId.ts';
import * as RootEntries from '../facts/RootEntries.ts';
import * as RootTsconfig from '../facts/RootTsconfig.ts';
import * as Finding from '../Finding.ts';
import { runtime } from '../runtime.ts';
import * as Support from '../support.ts';

/** Atom checking the canonical root TypeScript configuration hierarchy. */
export const atom = runtime.atom((get) =>
	Effect.gen(function*() {
		const entries = yield* get.result(RootEntries.atom, {
			suspendOnWaiting: true
		});
		const presenceFindings = Arr.getSomes(
			Arr.map([
				RootEntries.has(entries, 'tsconfig.json', 'File')
					? undefined
					: Finding.make(
						'missing-root-tsconfig',
						'Repository must contain tsconfig.json.',
						'tsconfig.json'
					),
				RootEntries.has(entries, 'tsconfig.base.json', 'File')
					? undefined
					: Finding.make(
						'missing-base-tsconfig',
						'Repository must contain tsconfig.base.json.',
						'tsconfig.base.json'
					)
			], Option.fromNullishOr)
		);
		if (Arr.isReadonlyArrayNonEmpty(presenceFindings)) {
			return Support.findingsOutcome(presenceFindings);
		}

		const [root, base] = yield* Effect.all([
			get.result(RootTsconfig.atom, { suspendOnWaiting: true }),
			get.result(RootTsconfig.baseAtom, { suspendOnWaiting: true })
		], { concurrency: 2 });
		const stringEquivalence = Schema.toEquivalence(Schema.String);
		return Support.findingsOutcome(
			Arr.getSomes(
				Arr.map([
					Option.exists(
							root.extends,
							(value) =>
								stringEquivalence(value, './tsconfig.base.json')
								|| stringEquivalence(
									value,
									'tsconfig.base.json'
								)
						)
						? undefined
						: Finding.make(
							'root-tsconfig-does-not-extend-base',
							'tsconfig.json must extend ./tsconfig.base.json.',
							'tsconfig.json'
						),
					Option.exists(
							base.compilerOptions,
							(options) => !R.isEmptyReadonlyRecord(options)
						)
						? undefined
						: Finding.make(
							'empty-base-compiler-options',
							'tsconfig.base.json must declare compiler options.',
							'tsconfig.base.json'
						)
				], Option.fromNullishOr)
			)
		);
	})
);

/** Root TypeScript configuration convention. */
export const convention = Convention.make({
	id: ConventionId.make('mps-typescript-project/typescript-config'),
	title: 'TypeScript configuration',
	atom
});
