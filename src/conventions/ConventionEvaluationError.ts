import * as Schema from 'effect/Schema';

/** A repository artifact could not be read or decoded for evaluation. */
export class ConventionEvaluationError
	extends Schema.TaggedError<ConventionEvaluationError>()(
		'ConventionEvaluationError',
		{
			path: Schema.String,
			message: Schema.String,
			details: Schema.String,
			cause: Schema.Defect()
		},
		{ description: 'A convention could not be evaluated.' }
	)
{}
