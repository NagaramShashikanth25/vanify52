import "./globals.css";
import { CartProvider } from "@/components/CartProvider";

export const metadata = {
  title: { default: "Vanify — home services in Hyderabad", template: "%s · Vanify" },
  description:
    "Explore home-service listings and labour prices in Hyderabad. See approved professional counts by service and the total before sending a booking request.",
};

export const viewport = { width: "device-width", initialScale: 1, themeColor: "#0F2118" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800&family=Public+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
