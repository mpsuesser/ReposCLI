import * as Match from 'effect/Match';

import type * as RepoKind from '../schemas/RepoKind.ts';
import type * as Convention from './Convention.ts';
import * as MpsTypeScriptProject from './suites/MpsTypeScriptProject.ts';

/** Select the conventions owned by a repository kind. */
export const forKind = Match.type<RepoKind.RepoKind>().pipe(
	Match.when(
		'mps-typescript-project',
		(): ReadonlyArray<Convention.Convention> =>
			MpsTypeScriptProject.conventions
	),
	Match.when('fork', (): ReadonlyArray<Convention.Convention> => []),
	Match.when('resources', (): ReadonlyArray<Convention.Convention> => []),
	Match.exhaustive
);
