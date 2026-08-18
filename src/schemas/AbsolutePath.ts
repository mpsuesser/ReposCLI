import * as Schema from 'effect/Schema';

/** A branded absolute filesystem path. */
export const AbsolutePath = Schema.String.check(
	Schema.isStartsWith('/', {
		identifier: 'AbsolutePathPrefix',
		title: 'Absolute path',
		description: 'An absolute filesystem path beginning with `/`'
	})
).pipe(Schema.brand('AbsolutePath'));

/** The type of an absolute filesystem path. */
export type AbsolutePath = typeof AbsolutePath.Type;
