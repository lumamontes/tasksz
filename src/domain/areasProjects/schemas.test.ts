import { describe, expect, it } from 'vitest';
import { areaInputSchema, projectInputSchema } from './schemas';

describe('areas and projects schemas', () => {
  it('normalizes names and descriptions', () => {
    expect(areaInputSchema.parse({ name: '  Trabalho  ', description: '  Foco  ', color: '#8b7cf6' })).toEqual({
      name: 'Trabalho',
      description: 'Foco',
      color: '#8b7cf6',
    });
  });

  it('enforces the shorter Area description limit', () => {
    const description = 'a'.repeat(161);
    expect(() => areaInputSchema.parse({ name: 'Casa', description, color: '#8b7cf6' })).toThrow();
    expect(projectInputSchema.parse({ name: 'Projeto', description, areaId: 'area-1' }).description).toHaveLength(161);
  });

  it('rejects blank names and invalid colors', () => {
    expect(() => projectInputSchema.parse({ name: ' ', description: '', areaId: 'area-1' })).toThrow();
    expect(() => areaInputSchema.parse({ name: 'Casa', description: '', color: 'purple' })).toThrow();
  });

  it('requires a parent Area when creating a Project', () => {
    expect(() => projectInputSchema.parse({ name: 'Projeto', description: '' })).toThrow();
    expect(projectInputSchema.parse({ name: 'Projeto', description: '', areaId: 'area-1' }).areaId).toBe('area-1');
  });

  it('does not persist a color on Projects', () => {
    expect(projectInputSchema.parse({ name: 'Projeto', description: '', areaId: 'area-1', color: '#8b7cf6' })).not.toHaveProperty('color');
  });
});
