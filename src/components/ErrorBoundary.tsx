import { Component, type ErrorInfo, type ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Top-level safety net. Any render/runtime error thrown by a descendant is
 * caught here so users see a recoverable fallback instead of a blank white
 * screen. Recovery reloads the app rather than attempting to re-render the
 * failed subtree, which guarantees a clean state.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Surface unexpected render failures to the platform console so they are
    // captured by device logs / crash reporting during beta testing.
    if (import.meta.env.DEV) {
      console.error("Unhandled application error:", error, info.componentStack);
    }
  }

  private handleReload = (): void => {
    window.location.assign("/");
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <section
          className="w-full max-w-md text-center"
          aria-labelledby="error-boundary-title"
          role="alert"
        >
          <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-border bg-white">
            <BrandLogo className="h-[115%] w-[115%] max-w-none" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
            Something went wrong
          </p>
          <h1
            id="error-boundary-title"
            className="mt-3 text-3xl font-semibold tracking-tight text-foreground"
          >
            We hit an unexpected error
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            The app ran into a problem and needs to reload. Your saved data is
            safe.
          </p>
          <Button onClick={this.handleReload} className="mt-8">
            <RefreshCw size={16} />
            Reload FitTrack
          </Button>
        </section>
      </main>
    );
  }
}

export default ErrorBoundary;
