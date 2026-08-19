import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as FileSystem from 'effect/FileSystem';
import * as Option from 'effect/Option';
import * as Order from 'effect/Order';
import * as Path from 'effect/Path';
import * as Result from 'effect/Result';
import * as Schema from 'effect/Schema';

import { ConventionEvaluationError } from '../ConventionEvaluationError.ts';
import * as CurrentRepo from '../CurrentRepo.ts';
import { runtime } from '../runtime.ts';
import * as PackageManifest from './PackageManifest.ts';
import * as Read from './read.ts';
import * as RootPackageManifest from './RootPackageManifest.ts';

/** A decoded workspace package manifest and its repository-relative path. */
export class WorkspaceManifest extends Schema.Class<WorkspaceManifest>(
	'ConventionWorkspaceManifest'
)({
	path: Schema.String,
	manifest: PackageManifest.PackageManifest
}) {}

/** Parsed package manifests declared by the current repository's workspaces. */
export const atom = runtime.atom((get) =>
	Effect.gen(function*() {
		const repo = yield* get.some(CurrentRepo.atom);
		const rootManifest = yield* get.result(RootPackageManifest.atom, {
			suspendOnWaiting: true
		});
		const fileSystem = yield* FileSystem.FileSystem;
		const path = yield* Path.Path;
		const workspacePatterns = Option.flatMap(
			rootManifest.workspaces,
			(workspaces) =>
				Result.getSuccess(
					Schema.decodeUnknownResult(PackageManifest.BunWorkspaces)(
						workspaces
					)
				)
		);
		const manifestPaths = yield* Effect.forEach(
			Option.getOrElse(
				Option.map(
					workspacePatterns,
					(workspaces) => workspaces.packages
				),
				Arr.empty<string>
			),
			(pattern) =>
				fileSystem.glob(`${pattern}/package.json`, {
					root: repo.path,
					exclude: ['**/node_modules/**']
				}),
			{ concurrency: 8 }
		).pipe(
			Effect.map(Arr.flatten),
			Effect.map(Arr.dedupe),
			// oxlint-disable-next-line unicorn/no-array-sort -- Effect Array.sort is immutable.
			Effect.map(Arr.sort(Order.String)),
			Effect.map(
				Arr.filter((manifestPath) => manifestPath !== 'package.json')
			),
			Effect.mapError(
				(cause) =>
					new ConventionEvaluationError({
						path: repo.path,
						message:
							`Unable to discover workspace manifests in ${repo.path}`,
						details: cause.message,
						cause
					})
			)
		);

		return yield* Effect.forEach(
			manifestPaths,
			(relativeManifestPath) =>
				Read.json(
					path.join(repo.path, relativeManifestPath),
					PackageManifest.PackageManifest
				).pipe(
					Effect.map(
						(manifest) =>
							new WorkspaceManifest({
								path: relativeManifestPath,
								manifest
							})
					)
				),
			{ concurrency: 8 }
		);
	})
);
