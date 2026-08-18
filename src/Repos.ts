import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Path from 'effect/Path';

import { AbsolutePath } from './schemas/AbsolutePath.ts';
import { Repo } from './schemas/Repo.ts';

/** The repos discovered from configured filesystem paths. */
export class Repos extends Context.Service<
	Repos,
	{
		/** The discovered repos. */
		readonly repos: ReadonlyArray<Repo>;
	}
>()('@repo/Repos') {
	/** Construct the repos service from filesystem search paths. */
	static readonly layer = (
		paths: ReadonlyArray<AbsolutePath>
	): Layer.Layer<Repos, never, Path.Path> =>
		Layer.effect(
			Repos,
			Effect.forEach(paths, Repo.load, {
				concurrency: 'unbounded'
			}).pipe(Effect.map((repos) => Repos.of({ repos })))
		);
}
