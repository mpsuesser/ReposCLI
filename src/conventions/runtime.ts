import * as BunServices from '@effect/platform-bun/BunServices';
import * as Atom from 'effect/unstable/reactivity/Atom';

/** Repo-scoped runtime used by fact and convention atoms. */
export const runtime = Atom.runtime(BunServices.layer);
