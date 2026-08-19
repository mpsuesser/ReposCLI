import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as R from 'effect/Record';
import * as Result from 'effect/Result';
import * as Schema from 'effect/Schema';
import * as Str from 'effect/String';

import * as Convention from '../Convention.ts';
import * as ConventionId from '../ConventionId.ts';
import * as Outcome from '../ConventionOutcome.ts';
import * as PackageManifest from '../facts/PackageManifest.ts';
import * as RootPackageManifest from '../facts/RootPackageManifest.ts';
import * as Finding from '../Finding.ts';
import { runtime } from '../runtime.ts';

/** Atom checking the canonical Bun workspace and catalog shape. */
export const atom = runtime.atom((get) =>
	Effect.gen(function*() {
		const manifest = yield* get.result(RootPackageManifest.atom, {
			suspendOnWaiting: true
		});
		const decoded = Option.flatMap(
			manifest.workspaces,
			(workspaces) =>
				Result.getSuccess(
					Schema.decodeUnknownResult(PackageManifest.BunWorkspaces)(
						workspaces
					)
				)
		);

		return Option.match(decoded, {
			onNone: () =>
				Outcome.violated([
					Finding.make(
						'invalid-bun-workspaces',
						'package.json must declare object-form Bun workspaces with packages, catalog, and catalogs.dev.',
						'package.json'
					)
				]),
			onSome: (workspaces) => {
				const findings = Arr.getSomes(
					Arr.map([
						Option.exists(
								manifest.packageManager,
								Str.startsWith('bun@')
							)
							? undefined
							: Finding.make(
								'missing-bun-package-manager',
								'package.json packageManager must declare a Bun version.',
								'package.json'
							),
						Arr.isReadonlyArrayNonEmpty(workspaces.packages)
							? undefined
							: Finding.make(
								'empty-bun-workspaces',
								'package.json workspaces.packages must not be empty.',
								'package.json'
							),
						R.isEmptyReadonlyRecord(workspaces.catalog)
							? Finding.make(
								'empty-default-catalog',
								'package.json workspaces.catalog must not be empty.',
								'package.json'
							)
							: undefined,
						R.isEmptyReadonlyRecord(workspaces.catalogs.dev)
							? Finding.make(
								'empty-dev-catalog',
								'package.json workspaces.catalogs.dev must not be empty.',
								'package.json'
							)
							: undefined
					], Option.fromNullishOr)
				);
				return Arr.match(findings, {
					onEmpty: () => Outcome.satisfied,
					onNonEmpty: Outcome.violated
				});
			}
		});
	})
);

/** Bun workspaces monorepo convention. */
export const convention = Convention.make({
	id: ConventionId.make('mps-typescript-project/bun-workspaces'),
	title: 'Bun workspaces',
	atom
});
