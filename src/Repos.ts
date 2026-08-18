import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import * as PersistedAppData from './PersistedAppData.ts';
import { Repo } from './schemas/Repo.ts';

/** The repos discovered from configured filesystem paths. */
export class Repos extends Context.Service<
	Repos,
	{
		/** The discovered repos. */
		readonly repos: ReadonlyArray<Repo>;
	}
>()('@repo/Repos') {
	/** Load the repos registered in persisted application data. */
	static readonly layer = Layer.effect(
		Repos,
		Effect.gen(function*() {
			const persistedAppData = yield* PersistedAppData.Service;
			const paths = yield* persistedAppData.repoPaths;
			const repos = yield* Effect.forEach(paths, Repo.load, {
				concurrency: 'unbounded'
			});

			return Repos.of({ repos });
		})
	);
}
