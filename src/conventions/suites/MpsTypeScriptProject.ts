import * as Convention from '../Convention.ts';
import * as AgentsInstructions from '../mps-typescript-project/AgentsInstructions.ts';
import * as AntiSlop from '../mps-typescript-project/AntiSlop.ts';
import * as BunWorkspaces from '../mps-typescript-project/BunWorkspaces.ts';
import * as CatalogDependencies from '../mps-typescript-project/CatalogDependencies.ts';
import * as Dprint from '../mps-typescript-project/Dprint.ts';
import * as EffectTsgoOxlint from '../mps-typescript-project/EffectTsgoOxlint.ts';
import * as Lefthook from '../mps-typescript-project/Lefthook.ts';
import * as MpsOxlintPlugin from '../mps-typescript-project/MpsOxlintPlugin.ts';
import * as Oxlint from '../mps-typescript-project/Oxlint.ts';
import * as PackagesDirectory from '../mps-typescript-project/PackagesDirectory.ts';
import * as Readme from '../mps-typescript-project/Readme.ts';
import * as Tsgo from '../mps-typescript-project/Tsgo.ts';
import * as TypeScriptConfig from '../mps-typescript-project/TypeScriptConfig.ts';
import * as Vitest from '../mps-typescript-project/Vitest.ts';

/** Ordered universal convention suite for MPS TypeScript projects. */
export const conventions: ReadonlyArray<Convention.Convention> = Convention
	.suite([
		BunWorkspaces.convention,
		CatalogDependencies.convention,
		PackagesDirectory.convention,
		Oxlint.convention,
		MpsOxlintPlugin.convention,
		AntiSlop.convention,
		EffectTsgoOxlint.convention,
		Tsgo.convention,
		Dprint.convention,
		Lefthook.convention,
		Vitest.convention,
		TypeScriptConfig.convention,
		Readme.convention,
		AgentsInstructions.convention
	]);
