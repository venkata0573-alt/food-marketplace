import { withClient } from '../db/with-client';

export interface ImageProcessPayload {
  dishId: string;
  uploadKey: string;
  cdnBaseUrl: string;
}

const VARIANT_WIDTHS = [640, 1080, 1920] as const;

export async function processDishImageUpload(payload: ImageProcessPayload): Promise<void> {
  await withClient(async (client) => {
    const variants = VARIANT_WIDTHS.map((width) => ({
      width,
      format: width <= 1080 ? 'webp' : 'avif',
      url: `${payload.cdnBaseUrl}/${payload.dishId}/w${width}.${width <= 1080 ? 'webp' : 'avif'}`,
    }));

    await client.query(
      `INSERT INTO dish_media (dish_id, blurhash, cdn_base_url, variants, processing_status)
       VALUES ($1, $2, $3, $4::jsonb, 'ready')
       ON CONFLICT (dish_id) DO UPDATE SET
         blurhash = EXCLUDED.blurhash,
         cdn_base_url = EXCLUDED.cdn_base_url,
         variants = EXCLUDED.variants,
         processing_status = 'ready',
         updated_at = NOW()`,
      [
        payload.dishId,
        'L6PZfSi_.AyE_3t7t7R**0o#DgR4',
        payload.cdnBaseUrl,
        JSON.stringify(variants),
      ],
    );
  });
}
