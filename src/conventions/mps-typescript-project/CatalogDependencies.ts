import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as R from 'effect/Record';
import * as Result from 'effect/Result';
import * as Schema from 'effect/Schema';

import * as Convention from '../Convention.ts';
import * as ConventionId from '../ConventionId.ts';
import * as Outcome from '../ConventionOutcome.ts';
import * as PackageManifest from '../facts/PackageManifest.ts';
import * as RootPackageManifest from '../facts/RootPackageManifest.ts';
import * as WorkspaceManifests from '../facts/WorkspaceManifests.ts';
import * as Finding from '../Finding.ts';
import { runtime } from '../runtime.ts';
import * as Support from '../support.ts';

const sectionFindings = (
	manifest: PackageManifest.PackageManifest,
	manifestPath: string,
	internalNames: ReadonlyArray<string>,
	workspaces: PackageManifest.BunWorkspaces
): ReadonlyArray<Finding.Finding> => {
	const scan = (
		dependencies: Option.Option<Readonly<Record<string, string>>>
	): ReadonlyArray<Finding.Finding> =>
		Option.match(dependencies, {
			onNone: Arr.empty<Finding.Finding>,
			onSome: (values) =>
				Arr.getSomes(R.collect(values, (name, spec) => {
					const isInternal = Arr.contains(internalNames, name);
					const isExpected = isInternal
						? spec === 'workspace:*'
						: spec === 'catalog:'
						? R.has(workspaces.catalog, name)
						: spec === 'catalog:dev'
						? R.has(workspaces.catalogs.dev, name)
						: false;
					return isExpected
						? Option.none()
						: Option.some(
							Finding.make(
								'non-catalog-dependency',
								isInternal
									? `${name} must use workspace:*; found ${spec}.`
									: `${name} must use a catalog protocol backed by the matching catalog; found ${spec}.`,
								manifestPath
							)
						);
				}))
		});

	return [
		...scan(manifest.dependencies),
		...scan(manifest.devDependencies),
		...scan(manifest.peerDependencies),
		...scan(manifest.optionalDependencies)
	];
};

/** Atom checking catalog and workspace dependency protocols. */
export const atom = runtime.atom((get) =>
	Effect.gen(function*() {
		const [root, workspaces] = yield* Effect.all([
			get.result(RootPackageManifest.atom, { suspendOnWaiting: true }),
			get.result(WorkspaceManifests.atom, { suspendOnWaiting: true })
		], { concurrency: 2 });
		const internalNames = Arr.getSomes(
			Arr.map(workspaces, (workspace) => workspace.manifest.name)
		);
		const decodedWorkspaces = Option.flatMap(
			root.workspaces,
			(value) =>
				Result.getSuccess(
					Schema.decodeUnknownResult(PackageManifest.BunWorkspaces)(
						value
					)
				)
		);

		return Option.match(decodedWorkspaces, {
			onNone: () =>
				new Outcome.NotApplicable({
					reason: 'Bun workspace catalogs are not valid.'
				}),
			onSome: (workspaceConfig) => {
				const unnamed = Arr.getSomes(
					Arr.map(workspaces, (workspace) =>
						Option.match(workspace.manifest.name, {
							onNone: () =>
								Option.some(Finding.make(
									'missing-workspace-name',
									'Workspace package must declare a name.',
									workspace.path
								)),
							onSome: () =>
								Option.none()
						}))
				);
				const groupedNames = Arr.groupBy(internalNames, (name) =>
					name);
				const duplicates = Arr.getSomes(
					R.collect(groupedNames, (name, occurrences) =>
						Arr.isReadonlyArrayNonEmpty(Arr.drop(occurrences, 1))
							? Option.some(Finding.make(
								'duplicate-workspace-name',
								`Workspace package name ${name} is declared more than once.`
							))
							: Option.none())
				);
				const findings = [
					...unnamed,
					...duplicates,
					...sectionFindings(
						root,
						'package.json',
						internalNames,
						workspaceConfig
					),
					...Arr.flatMap(workspaces, (workspace) =>
						sectionFindings(
							workspace.manifest,
							workspace.path,
							internalNames,
							workspaceConfig
						))
				];

				return Support.findingsOutcome(findings);
			}
		});
	})
);

/** Catalog-only external dependency convention. */
export const convention = Convention.make({
	id: ConventionId.make('mps-typescript-project/catalog-dependencies'),
	title: 'Catalog dependency protocols',
	atom
});
