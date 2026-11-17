import { describe, expect, it } from 'vitest';
import { buildStoryPrompt, fallbackStory, readStoryInput } from '../../src/lib/usStory';

describe('US story suggestion', () => {
  it('falls back to a warm English story by relationship', () => {
    const s = fallbackStory({ recipientName: 'Fabiana', relationship: 'Wife', occasion: 'Love declaration' });
    expect(s).toContain('Fabiana');
    expect(s.length).toBeGreaterThanOrEqual(50);
  });
  it('uses Mexican Spanish when the language is es', () => {
    expect(fallbackStory({ relationship: 'Mamá', language: 'es' })).toMatch(/Mamá/);
  });
  it('clips untrusted input and keeps it as data in the prompt', () => {
    const s = readStoryInput({ recipientName: 'x'.repeat(500), relationship: 'Friend' });
    expect(s.recipientName.length).toBe(80);
    expect(buildStoryPrompt(s).user).toContain('"relationship":"Friend"');
  });
});
