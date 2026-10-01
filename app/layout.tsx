import type { Metadata } from "next";
// Azərbaycan hərfləri (ə, ş, ğ, İ...) "latin-ext" alt çoxluğundadır — hər ikisi yüklənməlidir
import "@fontsource/ibm-plex-sans/latin-400.css";
import "@fontsource/ibm-plex-sans/latin-ext-400.css";
import "@fontsource/ibm-plex-sans/latin-500.css";
import "@fontsource/ibm-plex-sans/latin-ext-500.css";
import "@fontsource/ibm-plex-sans/latin-600.css";
import "@fontsource/ibm-plex-sans/latin-ext-600.css";
import "@fontsource/ibm-plex-sans/latin-700.css";
import "@fontsource/ibm-plex-sans/latin-ext-700.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-ext-400.css";
import "@fontsource/ibm-plex-mono/latin-500.css";
import "@fontsource/ibm-plex-mono/latin-ext-500.css";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { DialogProvider } from "@/lib/dialog-context";

export const metadata: Metadata = {
    title: "Servio — servis idarəetmə sistemi",
    description: "Servis mərkəzləri üçün idarəetmə sistemi",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="az" className="h-full">
        <body className="min-h-full">
        <AuthProvider>
            <DialogProvider>{children}</DialogProvider>
        </AuthProvider>
        </body>
        </html>
    );
}