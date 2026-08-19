import * as Schema from 'effect/Schema';

import * as AbsolutePath from '../schemas/AbsolutePath.ts';
import * as RepoKind from '../schemas/RepoKind.ts';
import * as ConventionEvaluation from './ConventionEvaluation.ts';

/** Complete convention report for one repository. */
export class RepoReport
	extends Schema.Class<RepoReport>('RepoConventionReport')({
		name: Schema.String,
		path: AbsolutePath.AbsolutePath,
		kind: RepoKind.RepoKind,
		evaluations: Schema.Array(ConventionEvaluation.ConventionEvaluation)
	})
{}
