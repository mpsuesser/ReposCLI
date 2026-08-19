import * as Effect from 'effect/Effect';
import * as Path from 'effect/Path';
import * as Schema from 'effect/Schema';

import * as CurrentRepo from '../CurrentRepo.ts';
import { runtime } from '../runtime.ts';
import * as Read from './read.ts';

/** JavaScript plugin declaration in an Oxlint configuration. */
export class JsPlugin
	extends Schema.Class<JsPlugin>('ConventionOxlintJsPlugin')({
		name: Schema.String,
		specifier: Schema.String
	})
{}

/** Oxlint execution options consumed by universal conventions. */
export class OxlintOptions extends Schema.Class<OxlintOptions>(
	'ConventionOxlintOptions'
)({
	typeAware: Schema.OptionFromOptionalKey(Schema.Boolean)
}) {}

/** Oxlint configuration fields consumed by universal conventions. */
export class OxlintConfig extends Schema.Class<OxlintConfig>(
	'ConventionOxlintConfig'
)({
	$schema: Schema.OptionFromOptionalKey(Schema.String),
	plugins: Schema.OptionFromOptionalKey(Schema.Array(Schema.String)),
	jsPlugins: Schema.OptionFromOptionalKey(Schema.Array(JsPlugin)),
	options: Schema.OptionFromOptionalKey(OxlintOptions)
}) {}

/** Parsed root Oxlint configuration for the current repository. */
export const atom = runtime.atom((get) =>
	Effect.gen(function*() {
		const repo = yield* get.some(CurrentRepo.atom);
		const path = yield* Path.Path;
		return yield* Read.json(
			path.join(repo.path, '.oxlintrc.json'),
			OxlintConfig
		);
	})
);
