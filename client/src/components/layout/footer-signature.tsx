import { Code2 } from "lucide-react";

export function FooterSignature() {
  return (
    <div className="hidden lg:flex fixed bottom-4 right-4 items-center gap-2 text-xs text-muted-foreground/60 bg-background/80 backdrop-blur-sm border border-border/50 rounded-lg px-3 py-2 shadow-sm hover:text-muted-foreground transition-colors duration-200">
      <Code2 className="h-3 w-3" />
      <span className="font-medium">crafted by</span>
      <span className="text-primary font-semibold">easydigitalgroup</span>
    </div>
  );
}