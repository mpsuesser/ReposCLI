import * as Arr from 'effect/Array';
import * as Option from 'effect/Option';
import * as R from 'effect/Record';

import type * as ConventionOutcome from './ConventionOutcome.ts';
import * as Outcome from './ConventionOutcome.ts';
import type * as OxlintConfig from './facts/OxlintConfig.ts';
import type * as PackageManifest from './facts/PackageManifest.ts';
import type * as Finding from './Finding.ts';

const dependencyMaps = (
	manifest: PackageManifest.PackageManifest
): ReadonlyArray<Option.Option<Readonly<Record<string, string>>>> => [
	manifest.dependencies,
	manifest.devDependencies,
	manifest.peerDependencies,
	manifest.optionalDependencies
];

/** Whether a manifest declares a dependency in any dependency section. */
export const hasDependency = (
	manifest: PackageManifest.PackageManifest,
	name: string
): boolean =>
	Arr.some(
		dependencyMaps(manifest),
		Option.exists((dependencies) => R.has(dependencies, name))
	);

/** Whether an Oxlint config enables a built-in plugin. */
export const hasOxlintPlugin = (
	config: OxlintConfig.OxlintConfig,
	name: string
): boolean => Option.exists(config.plugins, Arr.contains(name));

/** Whether an Oxlint config declares the expected JavaScript plugin. */
export const hasOxlintJsPlugin = (
	config: OxlintConfig.OxlintConfig,
	name: string,
	specifier: string
): boolean =>
	Option.exists(
		config.jsPlugins,
		Arr.some(
			(plugin) => plugin.name === name && plugin.specifier === specifier
		)
	);

/** Convert a predicate and finding into a convention outcome. */
export const outcome = (
	isSatisfied: boolean,
	finding: Finding.Finding
): ConventionOutcome.ConventionOutcome =>
	isSatisfied ? Outcome.satisfied : Outcome.violated([finding]);

/** Convert zero or more findings into a convention outcome. */
export const findingsOutcome = (
	findings: ReadonlyArray<Finding.Finding>
): ConventionOutcome.ConventionOutcome =>
	Arr.match(findings, {
		onEmpty: () => Outcome.satisfied,
		onNonEmpty: Outcome.violated
	});
