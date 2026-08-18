import * as Schema from 'effect/Schema';

/** A GitHub repository URL in `https://github.com/{owner}/{repository}` form. */
export const GithubUrl = Schema.String.check(
	Schema.isPattern(/^https:\/\/github\.com\/[^/\s?#]+\/[^/\s?#]+$/, {
		identifier: 'GithubUrlPattern',
		title: 'GitHub repository URL',
		description:
			'A GitHub repository URL containing exactly an owner and repository name'
	})
).pipe(Schema.brand('GithubUrl'));

/** The type of a GitHub repository URL. */
export type GithubUrl = typeof GithubUrl.Type;
