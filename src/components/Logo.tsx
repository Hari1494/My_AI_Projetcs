import { Wallet, Sparkles } from "lucide-react";

const Logo = () => {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className="bg-gradient-to-tr from-primary to-pink-500 p-2 rounded-xl shadow-lg transform rotate-3">
          <Wallet className="h-6 w-6 text-white" />
        </div>
        <div className="absolute -top-1 -right-1">
          <Sparkles className="h-3 w-3 text-yellow-400 animate-pulse" />
        </div>
      </div>
      <div className="flex flex-col -space-y-1">
        <span className="font-display font-black text-xl tracking-tighter bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent italic">
          DAILY
        </span>
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-50">
          SPENDER
        </span>
      </div>
    </div>
  );
};

export default Logo;
