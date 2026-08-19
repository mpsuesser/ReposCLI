import * as Effect from 'effect/Effect';
import * as Path from 'effect/Path';
import * as Schema from 'effect/Schema';
import * as SchemaIssue from 'effect/SchemaIssue';
import * as Yaml from 'effect/unstable/encoding/Yaml';

import { ConventionEvaluationError } from '../ConventionEvaluationError.ts';
import * as CurrentRepo from '../CurrentRepo.ts';
import { runtime } from '../runtime.ts';
import * as Read from './read.ts';

const formatSchemaIssue = SchemaIssue.makeFormatterDefault();

/** Lefthook configuration with both local and push validation hooks. */
export class LefthookConfig extends Schema.Class<LefthookConfig>(
	'ConventionLefthookConfig'
)({
	'pre-commit': Schema.Unknown,
	'pre-push': Schema.Unknown
}) {}

/** Parsed root Lefthook configuration for the current repository. */
export const atom = runtime.atom((get) =>
	Effect.gen(function*() {
		const repo = yield* get.some(CurrentRepo.atom);
		const path = yield* Path.Path;
		const configPath = path.join(repo.path, 'lefthook.yml');
		const contents = yield* Read.text(configPath);
		const parsed = yield* Effect.try({
			try: () => Yaml.parse(contents),
			catch: (cause) =>
				new ConventionEvaluationError({
					path: configPath,
					message: `Unable to decode ${configPath}`,
					details:
						'The YAML parser rejected the Lefthook configuration.',
					cause
				})
		});
		return yield* Schema.decodeUnknownEffect(LefthookConfig)(parsed).pipe(
			Effect.mapError(
				(cause) =>
					new ConventionEvaluationError({
						path: configPath,
						message: `Unable to decode ${configPath}`,
						details: formatSchemaIssue(cause.issue),
						cause
					})
			)
		);
	})
);
