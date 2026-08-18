import * as Schema from 'effect/Schema';

/** The supported categories of repository. */
export const RepoKind = Schema.Literals([
	'mps-typescript-project',
	'fork',
	'resources'
]);

/** A supported repository category. */
export type RepoKind = typeof RepoKind.Type;
