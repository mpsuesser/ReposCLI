import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Match from 'effect/Match';
import * as Option from 'effect/Option';
import * as Result from 'effect/Result';
import * as Atom from 'effect/unstable/reactivity/Atom';
import * as AtomRegistry from 'effect/unstable/reactivity/AtomRegistry';

import type * as Repo from '../schemas/Repo.ts';
import type * as Convention from './Convention.ts';
import * as ConventionEvaluation from './ConventionEvaluation.ts';
import * as ConventionOutcome from './ConventionOutcome.ts';
import * as CurrentRepo from './CurrentRepo.ts';
import { RepoReport } from './RepoReport.ts';
import * as Suites from './suites.ts';

const isFailureOutcome = Match.typeTags<
	ConventionOutcome.ConventionOutcome
>()({
	Satisfied: () => false,
	NotApplicable: () => false,
	Violated: () => true
});

const evaluateConvention = (
	registry: AtomRegistry.AtomRegistry,
	convention: Convention.Convention
) => AtomRegistry.getResult(registry, convention.atom, {
	suspendOnWaiting: true
}).pipe(Effect.result);

/** Evaluate every selected convention in an isolated repo-scoped registry. */
export const repo = Effect.fn('Conventions.evaluateRepo')(function*(
	repository: Repo.Repo
) {
	const conventions = Suites.forKind(repository.kind);
	const registry = AtomRegistry.make({
		initialValues: [
			Atom.initialValue(CurrentRepo.atom, Option.some(repository))
		]
	});

	return yield* Effect.acquireUseRelease(
		Effect.succeed(registry),
		(acquiredRegistry) =>
			Effect.forEach(
				conventions,
				(convention) =>
					evaluateConvention(acquiredRegistry, convention).pipe(
						Effect.map((result) =>
							Result.match(result, {
								onFailure: (error) =>
									new ConventionEvaluation.EvaluationFailed({
										id: convention.id,
										title: convention.title,
										message: error.message,
										path: error.path,
										details: error.details
									}),
								onSuccess: (outcome) =>
									new ConventionEvaluation.Checked({
										id: convention.id,
										title: convention.title,
										outcome
									})
							})
						)
					),
				{ concurrency: 8 }
			).pipe(
				Effect.map(
					(evaluations) =>
						new RepoReport({
							name: repository.name,
							path: repository.path,
							kind: repository.kind,
							evaluations
						})
				)
			),
		(acquiredRegistry) => Effect.sync(() => acquiredRegistry.dispose())
	);
});

/** Whether a report contains any violations or evaluation failures. */
export const hasFailures = (report: RepoReport): boolean =>
	Arr.some(
		report.evaluations,
		(evaluation) =>
			evaluation instanceof ConventionEvaluation.EvaluationFailed
			|| (evaluation instanceof ConventionEvaluation.Checked
				&& isFailureOutcome(evaluation.outcome))
	);
