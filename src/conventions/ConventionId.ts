import * as Schema from 'effect/Schema';

/** Stable identifier for a repository convention. */
export const ConventionId = Schema.NonEmptyString.pipe(
	Schema.brand('ConventionId')
);

/** Stable identifier for a repository convention. */
export type ConventionId = typeof ConventionId.Type;

/** Construct a convention identifier from a trusted declaration. */
export function make(value: string): ConventionId {
	return Schema.decodeSync(ConventionId)(value);
}
