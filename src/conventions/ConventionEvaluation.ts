import * as Schema from 'effect/Schema';

import * as ConventionId from './ConventionId.ts';
import * as ConventionOutcome from './ConventionOutcome.ts';

/** A convention that was successfully evaluated. */
export class Checked extends Schema.TaggedClass<Checked>()('Checked', {
	id: ConventionId.ConventionId,
	title: Schema.String,
	outcome: ConventionOutcome.ConventionOutcome
}) {}

/** A convention whose repository evidence could not be evaluated. */
export class EvaluationFailed extends Schema.TaggedClass<EvaluationFailed>()(
	'EvaluationFailed',
	{
		id: ConventionId.ConventionId,
		title: Schema.String,
		message: Schema.String,
		path: Schema.String,
		details: Schema.String
	}
) {}

/** Result of attempting to evaluate one convention. */
export const ConventionEvaluation = Schema.Union([
	Checked,
	EvaluationFailed
]);

/** Result of attempting to evaluate one convention. */
export type ConventionEvaluation = typeof ConventionEvaluation.Type;
