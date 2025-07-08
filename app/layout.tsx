import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter, Darker_Grotesque } from 'next/font/google'; // Added Darker_Grotesque
import { NowPlaying } from './now-playing';
import { PlaybackProvider } from './playback-context';
import { PlaylistProvider } from './hooks/use-playlist';
import { PlaybackControls } from './playback-controls';
import { ConvexClientProvider } from './convex-provider'; // Added Convex provider
import { SidebarProvider, SidebarInset, RightSidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { NowSidebar, RightSidebarTrigger } from '@/components/now-playing-sidebar';
import { SearchOverlay } from '@/components/search-overlay';
import { SidebarTriggerWithTooltip } from '@/components/sidebar-trigger-with-tooltip';
import { SidebarToggleControls } from '@/components/sidebar-toggle-controls';

export const metadata: Metadata = {
  title: 'vsnplyr', // Updated project title
  description: 'A music player built with Next.js and Convex.', // Updated description
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#0A0A0A',
};

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter', // Define CSS variable for Inter
});

const darkerGrotesque = Darker_Grotesque({
  subsets: ['latin'],
  variable: '--font-darker-grotesque', // Define CSS variable for Darker Grotesque
  weight: ['400', '500', '600', '700', '800', '900'], // Specify weights you intend to use
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // const playlistsPromise = getAllPlaylists(); // This will be replaced by Convex queries

  return (
    // Apply both font variables to the html tag
    <html lang="en" className={`${inter.variable} ${darkerGrotesque.variable}`}>
      <body className="dark h-[100dvh] text-gray-200 bg-[#0A0A0A] font-sans overflow-hidden">
        <ConvexClientProvider>
          <PlaybackProvider>
            <PlaylistProvider>
              {/* Background gradient animation for the entire layout */}
              <div className="fixed inset-0 z-0">
                <div
                  className="absolute inset-0"
                  style={{
                    background: `
                      radial-gradient(circle at 20% 50%, rgba(95, 60, 135, 0.3) 0%, transparent 50%),
                      radial-gradient(circle at 80% 20%, rgba(135, 85, 165, 0.3) 0%, transparent 50%),
                      radial-gradient(circle at 40% 80%, rgba(75, 45, 95, 0.3) 0%, transparent 50%),
                      radial-gradient(circle at 60% 60%, rgba(155, 110, 85, 0.2) 0%, transparent 50%),
                      linear-gradient(135deg, rgb(25, 15, 45) 0%, rgb(10, 5, 25) 100%)
                    `
                  }}
                />
                {/* Background text element */}
                <div className="vsnplyr-background-text">
                  vsnplyr
                </div>
              </div>

              <SidebarProvider defaultOpen={true}>
                <RightSidebarProvider defaultOpen={true}>
                  <div className="relative z-10 flex h-[100dvh] w-full">
                    <AppSidebar className="sidebar-floating" data-side="left" />
                    <SidebarInset className="flex-1 flex flex-col bg-transparent sidebar-inset-override pb-[69px]">
                      {children}
                    </SidebarInset>
                    <NowSidebar className="sidebar-floating" data-side="right" />
                  </div>
                  {/* Sidebar Toggles - positioned on interior sides with responsive positioning */}
                  <SidebarToggleControls />
                  
                  <SearchOverlay />
                  <NowPlaying />
                  <PlaybackControls />
                </RightSidebarProvider>
              </SidebarProvider>
            </PlaylistProvider>
          </PlaybackProvider>
        </ConvexClientProvider>
        <svg xmlns="http://www.w3.org/2000/svg" style={{ display: 'none' }}>
          <defs>
            <filter id="glass-distortion" x="0%" y="0%" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.006 0.006" numOctaves="2" seed="92" result="noise" />
              <feGaussianBlur in="noise" stdDeviation="2" result="blurred" />
              <feDisplacementMap in="SourceGraphic" in2="blurred" scale="77" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>
        </svg>
      </body>
    </html>
  );
}
