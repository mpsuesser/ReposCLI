import * as Arr from 'effect/Array';
import * as Bool from 'effect/Boolean';
import * as Console from 'effect/Console';
import * as Effect from 'effect/Effect';
import * as Match from 'effect/Match';
import * as Option from 'effect/Option';
import * as Path from 'effect/Path';
import * as Runtime from 'effect/Runtime';
import * as Schema from 'effect/Schema';
import * as Str from 'effect/String';
import * as Argument from 'effect/unstable/cli/Argument';
import * as Command from 'effect/unstable/cli/Command';

import * as ConventionEvaluation from '../conventions/ConventionEvaluation.ts';
import * as ConventionOutcome from '../conventions/ConventionOutcome.ts';
import * as Evaluate from '../conventions/evaluate.ts';
import type * as Finding from '../conventions/Finding.ts';
import * as RepoReport from '../conventions/RepoReport.ts';
import * as Output from '../output.ts';
import * as AbsolutePath from '../schemas/AbsolutePath.ts';
import * as Repo from '../schemas/Repo.ts';
import * as RepoKind from '../schemas/RepoKind.ts';

class ReportedConventionFailure
	extends Schema.TaggedError<ReportedConventionFailure>()(
		'ReportedConventionFailure',
		{ message: Schema.String },
		{ description: 'Convention failures that have already been reported.' }
	)
{
	override readonly [Runtime.errorExitCode] = 1;
	override readonly [Runtime.errorReported] = false;
}

class ConventionJsonRepo extends Schema.Class<ConventionJsonRepo>(
	'ConventionJsonRepo'
)({
	name: Schema.String,
	path: AbsolutePath.AbsolutePath,
	kind: RepoKind.RepoKind
}) {}

class ConventionJsonLine extends Schema.Class<ConventionJsonLine>(
	'ConventionJsonLine'
)({
	repo: ConventionJsonRepo,
	evaluation: ConventionEvaluation.ConventionEvaluation
}) {}

const ConventionJsonLineString = Schema.fromJsonString(ConventionJsonLine);
const encodeJsonLine = Schema.encodeSync(ConventionJsonLineString);

const ansi = {
	reset: '\u001b[0m',
	bold: '\u001b[1m',
	dim: '\u001b[2m',
	red: '\u001b[31m',
	green: '\u001b[32m',
	yellow: '\u001b[33m',
	cyan: '\u001b[36m',
	magenta: '\u001b[35m'
};

const decorate = (
	text: string,
	styles: ReadonlyArray<string>,
	colors: boolean
): string =>
	Bool.match(colors, {
		onFalse: () => text,
		onTrue: () => `${Arr.join(styles, '')}${text}${ansi.reset}`
	});

const formatFinding = (
	finding: Finding.Finding,
	connector: '├─' | '└─',
	colors: boolean
): string =>
	Option.match(finding.path, {
		onNone: () => `  ${connector} ${finding.message}`,
		onSome: (path) =>
			`  ${connector} ${
				decorate(path, [ansi.cyan], colors)
			}  ${finding.message}`
	});

const formatChecked = (
	title: string,
	outcome: ConventionOutcome.ConventionOutcome,
	colors: boolean
): string =>
	Match.typeTags<ConventionOutcome.ConventionOutcome>()({
		Satisfied: () =>
			`${decorate('✓', [ansi.bold, ansi.green], colors)} ${title}`,
		NotApplicable: ({ reason }) =>
			Arr.join([
				`${decorate('○', [ansi.yellow], colors)} ${title}`,
				`  └─ ${decorate(reason, [ansi.dim], colors)}`
			], '\n'),
		Violated: ({ findings }) =>
			Arr.join([
				`${decorate('✗', [ansi.bold, ansi.red], colors)} ${
					decorate(title, [ansi.bold], colors)
				}`,
				...Arr.map(findings, (finding, index) =>
					formatFinding(
						finding,
						index === Arr.length(findings) - 1 ? '└─' : '├─',
						colors
					))
			], '\n')
	})(outcome);

const formatEvaluation = (
	evaluation: ConventionEvaluation.ConventionEvaluation,
	colors: boolean
): string =>
	Match.typeTags<ConventionEvaluation.ConventionEvaluation>()({
		Checked: ({ title, outcome }) => formatChecked(title, outcome, colors),
		EvaluationFailed: ({ title, path, message, details }) =>
			Arr.join([
				`${decorate('!', [ansi.bold, ansi.red], colors)} ${
					decorate(title, [ansi.bold], colors)
				}`,
				`  ├─ ${decorate(path, [ansi.cyan], colors)}  ${message}`,
				`  └─ ${
					decorate(
						Str.replaceAll('\n', '\n     ')(details),
						[ansi.dim],
						colors
					)
				}`
			], '\n')
	})(evaluation);

/** Format a repository convention report for terminal display. */
export const formatHuman = (
	report: RepoReport.RepoReport,
	options: { readonly colors: boolean }
): string =>
	Arr.join([
		`${decorate(report.name, [ansi.bold], options.colors)}  ${
			decorate(report.kind, [ansi.magenta], options.colors)
		}`,
		`${decorate('└─', [ansi.dim], options.colors)} ${
			decorate(report.path, [ansi.dim, ansi.cyan], options.colors)
		}`,
		'',
		...Arr.map(report.evaluations, (evaluation) =>
			formatEvaluation(evaluation, options.colors))
	], '\n');

/** Format a repository convention report as one JSON object per convention. */
export const formatJsonl = (report: RepoReport.RepoReport): string =>
	Arr.join(
		Arr.map(report.evaluations, (evaluation) =>
			encodeJsonLine(
				new ConventionJsonLine({
					repo: new ConventionJsonRepo({
						name: report.name,
						path: report.path,
						kind: report.kind
					}),
					evaluation
				})
			)),
		'\n'
	);

const handler = Effect.fn('Check.run')(function*({ path: input }) {
	const path = yield* Path.Path;
	const repoPath = yield* Schema.decodeUnknownEffect(
		AbsolutePath.AbsolutePath
	)(Option.getOrElse(input, () => path.resolve('.')));
	const repo = yield* Repo.Repo.load(repoPath);
	const report = yield* Evaluate.repo(repo);
	const jsonl = yield* Output.Jsonl;
	const output = Bool.match(jsonl, {
		onFalse: () => formatHuman(report, { colors: true }),
		onTrue: () => formatJsonl(report)
	});

	yield* Bool.match(Str.isNonEmpty(output), {
		onFalse: () => Effect.void,
		onTrue: () => Console.log(output)
	});
	if (Evaluate.hasFailures(report)) {
		return yield* new ReportedConventionFailure({
			message: 'Repository convention checks failed.'
		});
	}
});

/** Check a repository against the conventions selected by its kind. */
export const command = Command.make(
	'check',
	{
		path: Argument.directory('path', { mustExist: true }).pipe(
			Argument.optional
		)
	},
	handler
).pipe(Command.withDescription('Check repository conventions'));
