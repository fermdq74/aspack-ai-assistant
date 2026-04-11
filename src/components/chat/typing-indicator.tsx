import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  className?: string;
}

export function TypingIndicator({ className }: TypingIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-1 px-1 py-2", className)}>
      <span
        className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-[typing-dot_1.2s_ease-in-out_infinite]"
        style={{ animationDelay: "0ms" }}
      />
      <span
        className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-[typing-dot_1.2s_ease-in-out_infinite]"
        style={{ animationDelay: "200ms" }}
      />
      <span
        className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-[typing-dot_1.2s_ease-in-out_infinite]"
        style={{ animationDelay: "400ms" }}
      />
    </div>
  );
}
