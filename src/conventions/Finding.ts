import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';

/** One actionable way in which a repository violates a convention. */
export class Finding extends Schema.Class<Finding>('ConventionFinding')({
	code: Schema.NonEmptyString,
	message: Schema.NonEmptyString,
	path: Schema.OptionFromNullishOr(Schema.String)
}) {}

/** Construct a finding with an optional repository-relative path. */
export const make = (
	code: string,
	message: string,
	path?: string
): Finding =>
	new Finding({
		code,
		message,
		path: Option.fromNullishOr(path)
	});
