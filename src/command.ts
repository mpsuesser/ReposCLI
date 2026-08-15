import { Command } from 'effect/unstable/cli';

/** Root command for the project CLI. */
export const command = Command.make('project').pipe(
	Command.withDescription('Project automation from the command line')
);
