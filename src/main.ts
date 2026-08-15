#!/usr/bin/env bun

import * as BunRuntime from '@effect/platform-bun/BunRuntime';
import * as BunServices from '@effect/platform-bun/BunServices';
import * as Effect from 'effect/Effect';
import * as Command from 'effect/unstable/cli/Command';

import packageJson from '../package.json' with { type: 'json' };
import { command } from './command.ts';

Command.run(command, { version: packageJson.version }).pipe(
	Effect.provide(BunServices.layer),
	BunRuntime.runMain
);
