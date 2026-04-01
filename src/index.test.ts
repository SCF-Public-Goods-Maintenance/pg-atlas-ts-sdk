import { describe, it, expect } from 'vitest';
import { version, PGAtlasClient } from './index';

describe('PG Atlas SDK', () => {
  it('should have the correct version', () => {
    expect(version).toBe('1.0.0');
  });

  it('should initialize the client with an API key', () => {
    const client = new PGAtlasClient('test-api-key');
    expect(client).toBeDefined();
  });
});
