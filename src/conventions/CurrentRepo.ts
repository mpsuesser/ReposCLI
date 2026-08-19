import * as Option from 'effect/Option';
import * as Atom from 'effect/unstable/reactivity/Atom';

import type * as Repo from '../schemas/Repo.ts';

/** Repository being evaluated in the current atom registry. */
export const atom = Atom.make<Option.Option<Repo.Repo>>(Option.none());
