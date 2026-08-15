import { describe, expect, it } from 'vitest';

import { command } from './command.ts';

describe('command', () => {
	it('defines the public command identity', () => {
		expect(command.name).toBe('project');
		expect(command.description).toBe(
			'Project automation from the command line'
		);
	});
});
