import * as BunServices from '@effect/platform-bun/BunServices';
import { assert, describe, expect, it } from '@effect/vitest';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as FileSystem from 'effect/FileSystem';
import * as Option from 'effect/Option';
import * as Path from 'effect/Path';
import * as Schema from 'effect/Schema';
import * as Str from 'effect/String';

import { formatHuman, formatJsonl } from '../commands/check.ts';
import * as AbsolutePath from '../schemas/AbsolutePath.ts';
import * as Repo from '../schemas/Repo.ts';
import * as Convention from './Convention.ts';
import * as ConventionEvaluation from './ConventionEvaluation.ts';
import * as ConventionId from './ConventionId.ts';
import type * as ConventionOutcome from './ConventionOutcome.ts';
import * as Outcome from './ConventionOutcome.ts';
import { hasFailures, repo as evaluateRepo } from './evaluate.ts';
import * as Finding from './Finding.ts';
import * as Readme from './mps-typescript-project/Readme.ts';
import { RepoReport } from './RepoReport.ts';

const UnknownJson = Schema.fromJsonString(Schema.Unknown);

const writeJson = Effect.fn('Test.writeJson')(function*(
	path: string,
	value: unknown
) {
	const fileSystem = yield* FileSystem.FileSystem;
	const encoded = yield* Schema.encodeUnknownEffect(UnknownJson)(value);
	yield* fileSystem.writeFileString(path, encoded);
});

const compliantRepo = Effect.fn('Test.compliantRepo')(function*() {
	const fileSystem = yield* FileSystem.FileSystem;
	const path = yield* Path.Path;
	const root = yield* fileSystem.makeTempDirectoryScoped();
	const packageDirectory = path.join(root, 'packages', 'example');
	yield* fileSystem.makeDirectory(packageDirectory, { recursive: true });

	const devCatalog = {
		'@dmmulroy/anti-slop': '1.0.0',
		'@effect/tsgo': '1.0.0',
		'@effect/vitest': '1.0.0',
		'@mpsuesser/oxlint-plugin-effect': '1.0.0',
		dprint: '1.0.0',
		lefthook: '1.0.0',
		oxlint: '1.0.0',
		'oxlint-tsgolint': '1.0.0',
		typescript: '1.0.0',
		vitest: '1.0.0'
	};
	yield* writeJson(path.join(root, 'package.json'), {
		name: 'example',
		packageManager: 'bun@1.3.14',
		workspaces: {
			packages: ['packages/*'],
			catalog: { effect: '4.0.0' },
			catalogs: { dev: devCatalog }
		},
		scripts: {
			prepare: 'effect-tsgo patch --oxlint && lefthook install',
			typecheck: 'tsc --noEmit'
		},
		devDependencies: {
			'@dmmulroy/anti-slop': 'catalog:dev',
			'@effect/tsgo': 'catalog:dev',
			'@effect/vitest': 'catalog:dev',
			'@mpsuesser/oxlint-plugin-effect': 'catalog:dev',
			dprint: 'catalog:dev',
			lefthook: 'catalog:dev',
			oxlint: 'catalog:dev',
			'oxlint-tsgolint': 'catalog:dev',
			typescript: 'catalog:dev',
			vitest: 'catalog:dev'
		}
	});
	yield* writeJson(path.join(packageDirectory, 'package.json'), {
		name: '@example/package',
		dependencies: { effect: 'catalog:' }
	});
	yield* writeJson(path.join(root, '.oxlintrc.json'), {
		options: { typeAware: true },
		plugins: ['effecttsgo'],
		jsPlugins: [
			{
				name: 'effect',
				specifier: '@mpsuesser/oxlint-plugin-effect'
			},
			{
				name: 'anti-slop',
				specifier: '@dmmulroy/anti-slop'
			}
		]
	});
	yield* writeJson(path.join(root, 'dprint.json'), {
		plugins: ['https://plugins.dprint.dev/typescript.wasm']
	});
	yield* writeJson(path.join(root, 'tsconfig.json'), {
		$schema: './node_modules/@effect/tsgo/schema.json',
		extends: './tsconfig.base.json'
	});
	yield* writeJson(path.join(root, 'tsconfig.base.json'), {
		compilerOptions: { strict: true }
	});
	yield* Effect.forEach(
		[
			[
				'lefthook.yml',
				'pre-commit:\n  jobs: []\npre-push:\n  jobs: []\n'
			],
			['vitest.config.ts', 'export default {};\n'],
			['README.md', '# Example\n'],
			['AGENTS.md', '# Instructions\n']
		] as const,
		([name, contents]) =>
			fileSystem.writeFileString(path.join(root, name), contents),
		{
			concurrency: 4
		}
	);

	return new Repo.Repo({
		name: 'example',
		path: yield* Schema.decodeUnknownEffect(AbsolutePath.AbsolutePath)(
			root
		),
		kind: 'mps-typescript-project',
		forkMetadata: Option.none()
	});
});

const report = (
	outcome: ConventionOutcome.ConventionOutcome
): RepoReport =>
	new RepoReport({
		name: 'example',
		path: Schema.decodeSync(AbsolutePath.AbsolutePath)('/repos/example'),
		kind: 'mps-typescript-project',
		evaluations: [
			new ConventionEvaluation.Checked({
				id: ConventionId.make('example/convention'),
				title: 'Example convention',
				outcome
			})
		]
	});

const displayReport = new RepoReport({
	name: 'example',
	path: Schema.decodeSync(AbsolutePath.AbsolutePath)('/repos/example'),
	kind: 'mps-typescript-project',
	evaluations: [
		new ConventionEvaluation.Checked({
			id: ConventionId.make('example/passing'),
			title: 'Passing convention',
			outcome: Outcome.satisfied
		}),
		new ConventionEvaluation.Checked({
			id: ConventionId.make('example/skipped'),
			title: 'Skipped convention',
			outcome: new Outcome.NotApplicable({ reason: 'Not needed here.' })
		}),
		new ConventionEvaluation.Checked({
			id: ConventionId.make('example/failing'),
			title: 'Failing convention',
			outcome: Outcome.violated([
				Finding.make('first', 'First finding.', 'package.json'),
				Finding.make('second', 'Second finding.')
			])
		}),
		new ConventionEvaluation.EvaluationFailed({
			id: ConventionId.make('example/error'),
			title: 'Broken convention',
			path: 'config.json',
			message: 'Unable to decode config.',
			details: 'Missing key\nExpected string'
		})
	]
});

describe('convention reports', () => {
	it('rejects duplicate convention identifiers in a suite', () => {
		expect(() => Convention.suite([Readme.convention, Readme.convention]))
			.toThrow('Convention identifiers must be unique');
	});

	it('detects violations after schema class construction', () => {
		expect(hasFailures(report(
			Outcome.violated([
				Finding.make('example-finding', 'Example finding.')
			])
		))).toBe(true);
		expect(hasFailures(report(Outcome.satisfied))).toBe(false);
	});

	it('omits absent finding paths without exposing Option internals', () => {
		const jsonl = formatJsonl(report(
			Outcome.violated([
				Finding.make('example-finding', 'Example finding.')
			])
		));

		expect(jsonl).toContain(
			'"message":"Example finding."}'
		);
		expect(jsonl).not.toContain('"_id":"Option"');
	});

	it('renders a plain terminal tree for every evaluation state', () => {
		expect(formatHuman(displayReport, { colors: false })).toBe([
			'example  mps-typescript-project',
			'└─ /repos/example',
			'',
			'✓ Passing convention',
			'○ Skipped convention',
			'  └─ Not needed here.',
			'✗ Failing convention',
			'  ├─ package.json  First finding.',
			'  └─ Second finding.',
			'! Broken convention',
			'  ├─ config.json  Unable to decode config.',
			'  └─ Missing key',
			'     Expected string'
		].join('\n'));
	});

	it('colors status, metadata, and evidence in terminal output', () => {
		const output = formatHuman(displayReport, { colors: true });

		expect(output).toContain('\u001b[1m\u001b[32m✓\u001b[0m');
		expect(output).toContain('\u001b[1m\u001b[31m✗\u001b[0m');
		expect(output).toContain('\u001b[36mpackage.json\u001b[0m');
		expect(output).toContain('├─');
		expect(output).toContain('└─');
	});

	it.effect('evaluates a compliant repository through the atom registry', () =>
		Effect.gen(function*() {
			const repository = yield* compliantRepo();
			const evaluated = yield* evaluateRepo(repository);

			assert.strictEqual(Arr.length(evaluated.evaluations), 14);
			assert.isFalse(hasFailures(evaluated));
		}).pipe(Effect.provide(BunServices.layer)));

	it.effect('reports malformed shared facts without stopping other checks', () =>
		Effect.gen(function*() {
			const repository = yield* compliantRepo();
			const path = yield* Path.Path;
			yield* writeJson(path.join(repository.path, 'dprint.json'), {});

			const evaluated = yield* evaluateRepo(repository);
			const dprint = Arr.findFirst(
				evaluated.evaluations,
				(
					evaluation
				): evaluation is ConventionEvaluation.EvaluationFailed =>
					evaluation instanceof ConventionEvaluation.EvaluationFailed
					&& evaluation.title === 'Dprint'
			);
			const readme = Arr.findFirst(
				evaluated.evaluations,
				(evaluation) =>
					evaluation instanceof ConventionEvaluation.Checked
					&& evaluation.title === 'README.md'
			);

			assert.isTrue(Option.isSome(dprint));
			assert.isTrue(
				Str.includes('Missing key')(Option.match(dprint, {
					onNone: () => '',
					onSome: (evaluation) => evaluation.details
				}))
			);
			assert.isTrue(Option.isSome(readme));
			assert.isTrue(hasFailures(evaluated));
		}).pipe(Effect.provide(BunServices.layer)));
});
