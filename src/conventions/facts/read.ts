import * as Effect from 'effect/Effect';
import * as FileSystem from 'effect/FileSystem';
import * as Schema from 'effect/Schema';
import * as SchemaIssue from 'effect/SchemaIssue';

import { ConventionEvaluationError } from '../ConventionEvaluationError.ts';

const formatSchemaIssue = SchemaIssue.makeFormatterDefault();

/** Read a text file for convention evaluation. */
export const text = Effect.fn('ConventionFacts.readText')(function*(
	path: string
) {
	const fileSystem = yield* FileSystem.FileSystem;
	return yield* fileSystem.readFileString(path).pipe(
		Effect.mapError(
			(cause) =>
				new ConventionEvaluationError({
					path,
					message: `Unable to read ${path}`,
					details: cause.message,
					cause
				})
		)
	);
});

/** Read and decode a JSON file for convention evaluation. */
export const json = Effect.fn('ConventionFacts.readJson')(function*<A, I>(
	path: string,
	schema: Schema.Codec<A, I>
) {
	const contents = yield* text(path);

	return yield* Schema.decodeUnknownEffect(Schema.fromJsonString(schema))(
		contents
	).pipe(
		Effect.mapError(
			(cause) =>
				new ConventionEvaluationError({
					path,
					message: `Unable to decode ${path}`,
					details: formatSchemaIssue(cause.issue),
					cause
				})
		)
	);
});
