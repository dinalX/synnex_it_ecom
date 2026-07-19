import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Synnex IT Solution',
    short_name: 'Synnex',
    description: 'Sri Lankan POS hardware, barcode, biometric security, and IT equipment supplier',
    start_url: '/',
    display: 'standalone',
    background_color: '#fafafa',
    theme_color: '#111111',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
