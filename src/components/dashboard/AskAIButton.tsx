import { Sparkles, Plus } from "lucide-react";

interface AskAIButtonProps {
  onClick?: () => void;
}

export function AskAIButton({ onClick }: AskAIButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 left-6 lg:left-72 ask-ai-button flex items-center gap-2 px-4 py-3 rounded-full text-white font-medium text-sm z-40"
    >
      <Plus className="w-4 h-4" />
      <span>Ask AI</span>
      <Sparkles className="w-4 h-4" />
    </button>
  );
}
