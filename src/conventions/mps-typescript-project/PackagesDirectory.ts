import * as Effect from 'effect/Effect';

import * as Convention from '../Convention.ts';
import * as ConventionId from '../ConventionId.ts';
import * as RootEntries from '../facts/RootEntries.ts';
import * as Finding from '../Finding.ts';
import { runtime } from '../runtime.ts';
import * as Support from '../support.ts';

/** Atom checking for the canonical packages directory. */
export const atom = runtime.atom((get) =>
	Effect.gen(function*() {
		const entries = yield* get.result(RootEntries.atom, {
			suspendOnWaiting: true
		});
		return Support.outcome(
			RootEntries.has(entries, 'packages', 'Directory'),
			Finding.make(
				'missing-packages-directory',
				'Repository must contain a packages/ directory.',
				'packages'
			)
		);
	})
);

/** Canonical packages-directory convention. */
export const convention = Convention.make({
	id: ConventionId.make('mps-typescript-project/packages-directory'),
	title: 'packages/ directory',
	atom
});
