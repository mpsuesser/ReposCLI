import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as Path from 'effect/Path';
import * as Schema from 'effect/Schema';

import * as PersistedRepoData from '../PersistedRepoData.ts';
import * as AbsolutePath from './AbsolutePath.ts';
import * as ForkMetadata from './ForkMetadata.ts';
import * as RepoKind from './RepoKind.ts';

/** A locally checked-out repo and its optional fork metadata. */
export class Repo extends Schema.Class<Repo>('Repo')({
	name: Schema.String,
	path: AbsolutePath.AbsolutePath,
	kind: RepoKind.RepoKind,
	forkMetadata: Schema.Option(ForkMetadata.ForkMetadata)
}) {
	/** Load a repo from its absolute filesystem path. */
	static readonly load = Effect.fn('Repo.load')(function*(
		absolutePath: AbsolutePath.AbsolutePath
	) {
		const path = yield* Path.Path;
		const persistedData = yield* PersistedRepoData.load(absolutePath);

		return new Repo({
			name: path.basename(absolutePath),
			path: absolutePath,
			kind: persistedData.kind,
			forkMetadata: Option.none()
		});
	});

	/** Whether this repo is a fork. */
	isFork(): boolean {
		return Schema.is(Schema.Literal('fork'))(this.kind);
	}
}
