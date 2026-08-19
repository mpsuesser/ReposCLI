import * as Effect from 'effect/Effect';

import * as Convention from '../Convention.ts';
import * as ConventionId from '../ConventionId.ts';
import * as RootEntries from '../facts/RootEntries.ts';
import * as Finding from '../Finding.ts';
import { runtime } from '../runtime.ts';
import * as Support from '../support.ts';

/** Atom checking for repository-specific agent instructions. */
export const atom = runtime.atom((get) =>
	Effect.gen(function*() {
		const entries = yield* get.result(RootEntries.atom, {
			suspendOnWaiting: true
		});
		return Support.outcome(
			RootEntries.has(entries, 'AGENTS.md', 'File'),
			Finding.make(
				'missing-agents-instructions',
				'Repository must contain AGENTS.md.',
				'AGENTS.md'
			)
		);
	})
);

/** Root agent-instructions convention. */
export const convention = Convention.make({
	id: ConventionId.make('mps-typescript-project/agents-instructions'),
	title: 'AGENTS.md',
	atom
});
