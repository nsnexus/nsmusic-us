import { describe,it,expect } from 'vitest';
import { publicUsOrder } from '@/lib/usOrders';
import { ownedAssetKey, allowedUsAudio } from '@/lib/usAssets';
describe('US private media boundaries',()=>{
 it('never returns owner proofs, Stripe intents or raw source URLs',()=>{const data=publicUsOrder({id:'order',paymentStatus:'PAGAMENTO_APROVADO',audioUrl:'https://private-provider/song.mp3',audioFiles:['https://private-provider/song.mp3'],paymentId:'secret-session',extras:{us:{ownerHash:'secret-proof',spec:{story:'My story'},sku:'audio_only'}}});const json=JSON.stringify(data);expect(json).not.toContain('private-provider');expect(json).not.toContain('secret-session');expect(json).not.toContain('secret-proof');expect(data.audioFiles).toEqual(['/api/us/audio?orderId=order&track=0']);});
 it('does not expose audio before verified payment even if sources exist',()=>{expect(publicUsOrder({id:'order',audioFiles:['https://provider/song.mp3'],extras:{us:{}}}).audioFiles).toEqual([]);});
 it('rejects other-order and traversal asset keys',()=>{expect(ownedAssetKey('us/orders/a/images/test.jpg','a')).toBe(true);expect(ownedAssetKey('us/orders/b/images/test.jpg','a')).toBe(false);expect(ownedAssetKey('us/orders/a/../b/test.jpg','a')).toBe(false);});
 it('rejects network-local sources and arbitrary HTTPS origins',()=>{expect(allowedUsAudio('http://127.0.0.1/private')).toBe(false);expect(allowedUsAudio('https://unknown.example.com/song.mp3')).toBe(false);expect(allowedUsAudio('https://cdn1.suno.ai/song.mp3')).toBe(true);});
});
