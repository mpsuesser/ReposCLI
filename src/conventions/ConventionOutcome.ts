import * as Schema from 'effect/Schema';

import * as Finding from './Finding.ts';

/** A repository satisfies a convention. */
export class Satisfied
	extends Schema.TaggedClass<Satisfied>()('Satisfied', {})
{}

/** A repository violates a convention in one or more actionable ways. */
export class Violated extends Schema.TaggedClass<Violated>()('Violated', {
	findings: Schema.NonEmptyArray(Finding.Finding)
}) {}

/** A convention does not apply to a repository. */
export class NotApplicable extends Schema.TaggedClass<NotApplicable>()(
	'NotApplicable',
	{ reason: Schema.NonEmptyString }
) {}

/** The possible domain outcomes of evaluating a convention. */
export const ConventionOutcome = Schema.TaggedUnion({
	Satisfied: {},
	Violated: { findings: Schema.NonEmptyArray(Finding.Finding) },
	NotApplicable: { reason: Schema.NonEmptyString }
});

/** The possible domain outcomes of evaluating a convention. */
export type ConventionOutcome = typeof ConventionOutcome.Type;

/** A shared satisfied outcome. */
export const satisfied = new Satisfied({});

/** Construct a violated convention outcome. */
export const violated = (
	findings: readonly [Finding.Finding, ...ReadonlyArray<Finding.Finding>]
): Violated => new Violated({ findings });
