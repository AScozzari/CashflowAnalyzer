import { Code2 } from "lucide-react";

export function FooterSignature() {
  return (
    <div className="hidden lg:flex fixed bottom-3 right-3 items-center gap-1.5 text-[10px] text-muted-foreground/50 bg-background/70 backdrop-blur-sm border border-border/30 rounded-md px-2 py-1.5 shadow-sm hover:text-muted-foreground/70 transition-colors duration-200">
      <Code2 className="h-2.5 w-2.5" />
      <span className="font-normal">crafted by</span>
      <span className="text-primary font-medium">easydigitalgroup</span>
    </div>
  );
}