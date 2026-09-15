import type { ID } from '@/types/common';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

function randomChunk(length: number): string {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

export function newId(prefix?: string): ID {
  const ts = Date.now().toString(36);
  const rand = randomChunk(10);
  return prefix ? `${prefix}_${ts}_${rand}` : `${ts}_${rand}`;
}

export function newJobId(): ID {
  return newId('job');
}

export function isId(value: unknown): value is ID {
  return typeof value === 'string' && value.length > 0;
}