import * as Schema from 'effect/Schema';

const DependencyMap = Schema.Record(Schema.String, Schema.String);

/** Named Bun workspace catalogs. */
export class WorkspaceCatalogs extends Schema.Class<WorkspaceCatalogs>(
	'ConventionWorkspaceCatalogs'
)({
	dev: DependencyMap
}) {}

/** Package manifest fields consumed by universal TypeScript conventions. */
export class PackageManifest extends Schema.Class<PackageManifest>(
	'ConventionPackageManifest'
)({
	name: Schema.OptionFromOptionalKey(Schema.String),
	packageManager: Schema.OptionFromOptionalKey(Schema.String),
	workspaces: Schema.OptionFromOptionalKey(Schema.Unknown),
	scripts: Schema.OptionFromOptionalKey(DependencyMap),
	dependencies: Schema.OptionFromOptionalKey(DependencyMap),
	devDependencies: Schema.OptionFromOptionalKey(DependencyMap),
	peerDependencies: Schema.OptionFromOptionalKey(DependencyMap),
	optionalDependencies: Schema.OptionFromOptionalKey(DependencyMap)
}) {}

/** Bun object-form workspace declaration with default and dev catalogs. */
export class BunWorkspaces extends Schema.Class<BunWorkspaces>(
	'ConventionBunWorkspaces'
)({
	packages: Schema.Array(Schema.String),
	catalog: DependencyMap,
	catalogs: WorkspaceCatalogs
}) {}
