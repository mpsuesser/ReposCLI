#!/usr/bin/env bun

import * as Command from 'effect/unstable/cli/Command';

import packageJson from '../package.json' with { type: 'json' };
import { command as deregister } from './commands/deregister.ts';
import { command as print } from './commands/print.ts';
import { command as register } from './commands/register.ts';
import { runMain } from './runtime.ts';

const command = Command.make('repo').pipe(
	Command.withSubcommands([register, deregister, print])
);

Command.run(command, { version: packageJson.version }).pipe(runMain);
