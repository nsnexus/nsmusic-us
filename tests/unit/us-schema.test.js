import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';

let db;
const id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
beforeAll(async () => {
  db = new PGlite();
  await db.exec('create role anon; create role authenticated; create role service_role bypassrls;');
  await db.exec(await readFile(new URL('../../supabase/schema.sql', import.meta.url), 'utf8'));
  await db.exec(await readFile(new URL('../../supabase/us.sql', import.meta.url), 'utf8'));
  await db.query(`insert into orders(id,order_number,production_status,extras) values($1,'US-TEST','LETRA_CRIADA',$2)`, [id, JSON.stringify({us:{market:'US',sku:'audio_only'}})]);
}, 30000);
afterAll(async () => { await db?.close(); });
const order = async () => (await db.query('select * from orders where id=$1',[id])).rows[0];
async function checkout(session, sku, cents, intent) {
  await db.query('insert into us_checkout_sessions(id,order_id,sku,amount_cents) values($1,$2,$3,$4)',[session,id,sku,cents]);
  return db.query('select us_fulfill_checkout($1,$2) as ok',[session,intent]);
}

describe('US schema and atomic payment integration', () => {
  it('executes both schema files and denies anonymous table/report access', async () => {
    const result=await db.query(`select has_table_privilege('anon','us_checkout_sessions','select') as sessions, has_table_privilege('anon','cota_por_cliente','select') as report, has_function_privilege('anon','us_fulfill_checkout(text,text)','execute') as fulfill`);
    expect(result.rows[0]).toEqual({sessions:false,report:false,fulfill:false});
    expect((await db.query("select relrowsecurity from pg_class where relname='orders'")).rows[0].relrowsecurity).toBe(true);
  });
  it('reserves music before payment for created lyrics', async () => {
    expect((await db.query('select us_reserve_generation($1) as reserved',[id])).rows[0].reserved).toBe(true);
    expect((await db.query('select us_reserve_generation($1) as reserved',[id])).rows[0].reserved).toBe(false);
  });
  it('rejects a forged catalog price in the database', async () => {
    await expect(db.query("insert into us_checkout_sessions(id,order_id,sku,amount_cents) values('cs_bad',$1,'combo',1)",[id])).rejects.toThrow();
  });
  it('fulfills once and cumulatively grants all requested packages', async () => {
    for (const [session,sku,cents,rank] of [['cs_one','audio_only',499,1],['cs_two','combo_carta',599,2],['cs_three','combo',799,3],['cs_four','combo_retrospectiva',999,4]]) {
      expect((await checkout(session,sku,cents,'pi_'+rank)).rows[0].ok).toBe(true);
      await db.query('select us_fulfill_checkout($1,$2)',[session,'pi_'+rank]);
      const current=await order();
      expect(current.payment_status).toBe('PAGAMENTO_APROVADO');
      expect([current.has_carta_access,current.has_video_access,current.has_retrospectiva_access]).toEqual([rank>=2,rank>=3,rank>=4]);
    }
    expect((await db.query('select count(*)::int as count from payments')).rows[0].count).toBe(4);
    expect((await order()).extras.usPaidCents).toBe(2896);
  });
  it('reserves only one generation and atomically merges extras', async () => {
    expect((await db.query('select us_reserve_generation($1) as ok',[id])).rows[0].ok).toBe(false);
    await db.query('select us_patch_order($1,$2)',[id,JSON.stringify({audio_files:['https://cdn1.suno.ai/test.mp3'],extras:{usLetter:'A letter'}})]);
    const current=await order();
    expect(current.suno_generation_count).toBe(1);
    expect(current.audio_files).toEqual(['https://cdn1.suno.ai/test.mp3']);
    expect(current.extras.us.market).toBe('US');
    expect(current.extras.usLetter).toBe('A letter');
  });
  it('revokes the refunded tier, preserves lower purchases and blocks replay', async () => {
    await db.query("select us_revoke_payment('pi_4')");
    let current=await order();
    expect([current.has_carta_access,current.has_video_access,current.has_retrospectiva_access]).toEqual([true,true,false]);
    expect((await db.query("select us_fulfill_checkout('cs_four','pi_4') as ok")).rows[0].ok).toBe(false);
    for (const intent of ['pi_1','pi_2','pi_3']) await db.query('select us_revoke_payment($1)',[intent]);
    current=await order();
    expect(current.payment_status).toBe('REEMBOLSADO');
    expect([current.has_carta_access,current.has_video_access,current.has_retrospectiva_access]).toEqual([false,false,false]);
  });
});
