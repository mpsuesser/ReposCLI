import * as Schema from 'effect/Schema';

import * as GithubUrl from './GithubUrl.ts';

/** Metadata describing the upstream remote for a fork. */
export class ForkMetadata extends Schema.Class<ForkMetadata>('ForkMetadata')({
	remote: GithubUrl.GithubUrl
}) {}
