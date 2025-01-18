import { ThemeProvider } from "@/components/theme-provider";
import ThemeToggle from "@/components/ThemeToggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid place-items-center bg-background">
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <div className="fixed top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-md space-y-8 p-8">
          {children}
        </div>
      </ThemeProvider>
    </div>
  );
} 