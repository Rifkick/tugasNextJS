// /app/layout.tsx

// WAJIB import global CSS dan font di sini
import '@/app/ui/global.css';
import { inter } from '@/app/ui/fonts';

// Harus diekspor sebagai default
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* Menggunakan font inter yang sudah diimpor */}
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}