import * as Bool from 'effect/Boolean';
import * as Match from 'effect/Match';
import * as Schema from 'effect/Schema';
import * as Flag from 'effect/unstable/cli/Flag';
import * as GlobalFlag from 'effect/unstable/cli/GlobalFlag';

import * as AbsolutePath from './schemas/AbsolutePath.ts';
import * as RepoKind from './schemas/RepoKind.ts';

/** Global setting selecting JSON Lines output. */
export const Jsonl = GlobalFlag.setting('jsonl')({
	flag: Flag.boolean('jsonl').pipe(
		Flag.withDescription('Format command output as JSON Lines')
	)
});

const RegistrationAction = Schema.Literals(['register', 'deregister']);
type RegistrationAction = typeof RegistrationAction.Type;

class RegistrationResult extends Schema.Class<RegistrationResult>(
	'RegistrationResult'
)({
	action: RegistrationAction,
	path: AbsolutePath.AbsolutePath
}) {}

const RegistrationResultJson = Schema.fromJsonString(RegistrationResult);
const encodeRegistrationResult = Schema.encodeSync(RegistrationResultJson);

const registrationVerb = Match.type<RegistrationAction>().pipe(
	Match.when('register', () => 'Registered'),
	Match.when('deregister', () => 'Deregistered'),
	Match.exhaustive
);

/** Format a successful repo registration change. */
export const formatRegistrationResult = (
	action: RegistrationAction,
	path: AbsolutePath.AbsolutePath,
	jsonl: boolean
): string =>
	Bool.match(jsonl, {
		onFalse: () => `${registrationVerb(action)} ${path}`,
		onTrue: () =>
			encodeRegistrationResult(new RegistrationResult({ action, path }))
	});

class SetKindResult extends Schema.Class<SetKindResult>('SetKindResult')({
	action: Schema.tag('set-kind'),
	path: AbsolutePath.AbsolutePath,
	kind: RepoKind.RepoKind
}) {}

const SetKindResultJson = Schema.fromJsonString(SetKindResult);
const encodeSetKindResult = Schema.encodeSync(SetKindResultJson);

/** Format a successful repo-kind update. */
export const formatSetKindResult = (
	path: AbsolutePath.AbsolutePath,
	kind: RepoKind.RepoKind,
	jsonl: boolean
): string =>
	Bool.match(jsonl, {
		onFalse: () => `Set ${path} to ${kind}`,
		onTrue: () => encodeSetKindResult(new SetKindResult({ path, kind }))
	});
