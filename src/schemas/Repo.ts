import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as Path from 'effect/Path';
import * as Schema from 'effect/Schema';

import * as AbsolutePath from './AbsolutePath.ts';
import * as GithubUrl from './GithubUrl.ts';

class ForkMetadata extends Schema.Class<ForkMetadata>('ForkMetadata')({
	remote: GithubUrl.GithubUrl
}) {}

/** A locally checked-out repo and its optional fork metadata. */
export class Repo extends Schema.Class<Repo>('Repo')({
	name: Schema.String,
	path: AbsolutePath.AbsolutePath,
	forkMetadata: Schema.Option(ForkMetadata)
}) {
	/** Load a repo from its absolute filesystem path. */
	static readonly load = Effect.fn('Repo.load')(function*(
		absolutePath: AbsolutePath.AbsolutePath
	) {
		const path = yield* Path.Path;

		return new Repo({
			name: path.basename(absolutePath),
			path: absolutePath,
			forkMetadata: Option.none()
		});
	});

	/** Whether this repo is a fork. */
	isFork(): boolean {
		return Option.isSome(this.forkMetadata);
	}
}
