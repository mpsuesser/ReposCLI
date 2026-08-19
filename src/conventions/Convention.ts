import * as Arr from 'effect/Array';
import * as Schema from 'effect/Schema';
import type * as Atom from 'effect/unstable/reactivity/Atom';

import type * as ConventionEvaluationError from './ConventionEvaluationError.ts';
import * as ConventionId from './ConventionId.ts';
import type * as ConventionOutcome from './ConventionOutcome.ts';

/** A declared convention and its effect-backed atom. */
export interface Convention {
	readonly id: ConventionId.ConventionId;
	readonly title: string;
	readonly atom: Atom.Atom<
		import('effect/unstable/reactivity/AsyncResult').AsyncResult<
			ConventionOutcome.ConventionOutcome,
			ConventionEvaluationError.ConventionEvaluationError
		>
	>;
}

/** Declare a repository convention. */
export const make = (convention: Convention): Convention => convention;

const conventionIdsEquivalence = Schema.toEquivalence(
	Schema.Array(ConventionId.ConventionId)
);

const UniqueConventionIds = Schema.Array(ConventionId.ConventionId).check(
	Schema.makeFilter(
		(ids) => conventionIdsEquivalence(ids, Arr.dedupe(ids)),
		{
			identifier: 'UniqueConventionIdsCheck',
			title: 'Unique convention identifiers',
			description: 'A convention suite with no duplicate identifiers.',
			message: 'Convention identifiers must be unique within a suite'
		}
	)
);

/** Declare a convention suite and reject duplicate convention identifiers. */
export function suite(
	conventions: ReadonlyArray<Convention>
): ReadonlyArray<Convention> {
	Schema.decodeSync(UniqueConventionIds)(
		Arr.map(conventions, (convention) => convention.id)
	);
	return conventions;
}
