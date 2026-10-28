import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  META_PIXEL_IDS,
  pushAdvancedMatching,
  trackFbViewContent,
  trackFbInitiateCheckout,
  trackFbPurchase,
} from '@/lib/metaPixel';

describe('US Meta Pixel Integration', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      fbq: vi.fn(),
    });
  });

  it('possui o Pixel ID correto configurado para os EUA', () => {
    expect(META_PIXEL_IDS).toEqual(['1450829683640531']);
  });

  it('normaliza telefones dos EUA e avança correspondência', () => {
    // 10 dígitos (padrão US sem código de país)
    pushAdvancedMatching('(212) 555-0199', 'Customer@Example.com');
    expect(window.fbq).toHaveBeenCalledWith('init', '1450829683640531', {
      ph: '12125550199',
      em: 'customer@example.com',
    });
  });

  it('dispara ViewContent para criação de música', () => {
    trackFbViewContent();
    expect(window.fbq).toHaveBeenCalledWith('track', 'ViewContent', {
      content_name: 'Create Custom Song',
      content_type: 'product',
      currency: 'USD',
    });
  });

  it('dispara InitiateCheckout com valor em USD e deduplicação', () => {
    trackFbInitiateCheckout({
      orderId: 'us-order-123',
      value: 7.99,
      contentName: 'Song + Video',
      email: 'test@us.com',
      phone: '2125550199',
    });

    expect(window.fbq).toHaveBeenCalledWith(
      'track',
      'InitiateCheckout',
      {
        value: 7.99,
        currency: 'USD',
        content_name: 'Song + Video',
        content_type: 'product',
        num_items: 1,
      },
      { eventID: 'initiate_us-order-123' }
    );
  });

  it('dispara Purchase com valor em USD e eventID para deduplicação com CAPI', () => {
    trackFbPurchase({
      orderId: 'us-order-999',
      value: 9.99,
      contentName: 'Complete Collection',
      email: 'john@example.com',
      phone: '+1 212 555 0199',
    });

    expect(window.fbq).toHaveBeenCalledWith(
      'track',
      'Purchase',
      {
        value: 9.99,
        currency: 'USD',
        content_name: 'Complete Collection',
        content_type: 'product',
      },
      { eventID: 'purchase_us-order-999_us' }
    );
  });
});

