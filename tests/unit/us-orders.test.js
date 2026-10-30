import { describe, it, expect, vi } from 'vitest';
import { publicUsOrder, reserveUsGeneration, updateUsOrder } from '@/lib/usOrders';
import { ownedAssetKey, allowedUsAudio } from '@/lib/usAssets';

describe('US private media boundaries', () => {
  it('never returns owner proofs, Stripe intents or raw source URLs', () => {
    const data = publicUsOrder({
      id: 'order',
      paymentStatus: 'PAGAMENTO_APROVADO',
      audioUrl: 'https://private-provider/song.mp3',
      audioFiles: ['https://private-provider/song.mp3'],
      paymentId: 'secret-session',
      extras: { us: { ownerHash: 'secret-proof', spec: { story: 'My story' }, sku: 'audio_only' } }
    });
    const json = JSON.stringify(data);
    expect(json).not.toContain('private-provider');
    expect(json).not.toContain('secret-session');
    expect(json).not.toContain('secret-proof');
    expect(data.audioFiles).toEqual(['/api/us/audio?orderId=order&track=0']);
  });

  it('exposes protected preview audio for preview while keeping paid false', () => {
    const res = publicUsOrder({ id: 'order', audioFiles: ['https://provider/song.mp3'], extras: { us: {} } });
    expect(res.audioFiles).toEqual(['/api/us/audio?orderId=order&track=0']);
    expect(res.paid).toBe(false);
    expect(res.hasCartaAccess).toBe(false);
  });

  it('rejects other-order and traversal asset keys', () => {
    expect(ownedAssetKey('us/orders/a/images/test.jpg', 'a')).toBe(true);
    expect(ownedAssetKey('us/orders/b/images/test.jpg', 'a')).toBe(false);
    expect(ownedAssetKey('us/orders/a/../b/test.jpg', 'a')).toBe(false);
  });

  it('rejects network-local sources and arbitrary HTTPS origins', () => {
    expect(allowedUsAudio('http://127.0.0.1/private')).toBe(false);
    expect(allowedUsAudio('https://unknown.example.com/song.mp3')).toBe(false);
    expect(allowedUsAudio('https://cdn1.suno.ai/song.mp3')).toBe(true);
  });
});

describe('reserveUsGeneration and updateUsOrder PostgREST query chaining', () => {
  it('chains filter methods before terminal update in reserveUsGeneration', async () => {
    const callLog = [];
    const fakeQuery = {
      eq: vi.fn((col, val) => { callLog.push(`eq:${col}:${val}`); return fakeQuery; }),
      in: vi.fn((col, vals) => { callLog.push(`in:${col}:${vals.join(',')}`); return fakeQuery; }),
      is: vi.fn((col, val) => { callLog.push(`is:${col}:${val}`); return fakeQuery; }),
      update: vi.fn((patch) => { callLog.push(`update:${JSON.stringify(patch)}`); return Promise.resolve({ data: [{ id: 'order-123' }], error: null }); }),
    };
    const fakeDb = {
      rpc: vi.fn(() => Promise.resolve({ data: null, error: { message: 'no rpc' } })),
      from: vi.fn(() => fakeQuery),
    };
    const fakeEnv = {
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-key',
    };

    // Spy on getSupabaseEdge from supabase-edge
    const edgeMod = await import('@/lib/supabase-edge');
    const spy = vi.spyOn(edgeMod, 'getSupabaseEdge').mockReturnValue(fakeDb);

    try {
      const reserved = await reserveUsGeneration('order-123', fakeEnv);
      expect(reserved).toBe(true);
      expect(callLog).toContain('eq:id:order-123');
      expect(callLog).toContain('in:production_status:LETRA_CRIADA,ERRO_GERACAO,US_GENERATION_REVIEW');
      expect(callLog).toContain('is:suno_task_id:null');
      // Terminal update called AFTER all filters
      expect(callLog[callLog.length - 1]).toContain('update:');
    } finally {
      spy.mockRestore();
    }
  });

  it('chains eq before terminal update in updateUsOrder fallback', async () => {
    const callLog = [];
    const fakeQuery = {
      eq: vi.fn((col, val) => { callLog.push(`eq:${col}:${val}`); return fakeQuery; }),
      update: vi.fn((patch) => { callLog.push(`update:${JSON.stringify(patch)}`); return Promise.resolve({ data: [{ id: 'order-123' }], error: null }); }),
    };
    const fakeDb = {
      rpc: vi.fn(() => Promise.resolve({ data: null, error: { message: 'no rpc' } })),
      from: vi.fn(() => fakeQuery),
    };
    const fakeEnv = {
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-key',
    };

    const edgeMod = await import('@/lib/supabase-edge');
    const spy = vi.spyOn(edgeMod, 'getSupabaseEdge').mockReturnValue(fakeDb);

    try {
      const updated = await updateUsOrder('order-123', { productionStatus: 'GERANDO_AUDIO' }, fakeEnv);
      expect(updated).toBe(true);
      expect(callLog[0]).toBe('eq:id:order-123');
      expect(callLog[1]).toContain('update:');
    } finally {
      spy.mockRestore();
    }
  });
});
