export const metadata = {
  title: 'Admin Blog NEO',
  robots: { index: false, follow: false },
};

export default function StudioRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
