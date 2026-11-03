import { ArrowLeft } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import BrandLogo from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/brand";

const NotFound = () => {
  const location = useLocation();

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <section className="w-full max-w-md text-center" aria-labelledby="not-found-title">
        <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-border bg-white">
          <BrandLogo className="h-[115%] w-[115%] max-w-none" />
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">404 · Page not found</p>
        <h1 id="not-found-title" className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
          This page isn&apos;t available
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          The address <span className="font-medium text-foreground">{location.pathname}</span> may have moved or no longer exists.
        </p>
        <Button asChild className="mt-8">
          <Link to="/"><ArrowLeft size={16} />Return to {BRAND.name}</Link>
        </Button>
      </section>
    </main>
  );
};

export default NotFound;
