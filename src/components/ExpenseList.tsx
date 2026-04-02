import type { Expense } from "./ExpenseForm";
import { Banknote, Smartphone, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface ExpenseListProps {
  expenses: Expense[];
  onDelete: (id: string) => void;
}

const getAmountClass = (amount: number) => {
  if (amount < 100) return "text-status-good";
  if (amount < 1000) return "text-status-moderate";
  return "text-status-excess";
};

const getAmountLabel = (amount: number) => {
  if (amount < 100) return "Good";
  if (amount < 1000) return "Moderate";
  return "Excess";
};

const getStatusBg = (amount: number) => {
  if (amount < 100) return "bg-status-good/10 text-status-good";
  if (amount < 1000) return "bg-status-moderate/10 text-status-moderate";
  return "bg-status-excess/10 text-status-excess";
};

const ExpenseList = ({ expenses, onDelete }: ExpenseListProps) => {
  if (expenses.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center text-muted-foreground py-8"
      >
        No expenses today. Start adding! 🎉
      </motion.div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {expenses.map((exp) => (
          <motion.div
            layout
            initial={{ opacity: 0, x: -10, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9, transition: { duration: 0.2 } }}
            key={exp.id}
            className="flex items-center justify-between rounded-xl border bg-card p-3 shadow-sm transition-all hover:shadow-md hover:border-primary/20"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-accent/50 p-2.5 shadow-inner">
                {exp.paymentType === "cash" ? (
                  <Banknote className="h-4.5 w-4.5 text-accent-foreground" />
                ) : (
                  <Smartphone className="h-4.5 w-4.5 text-accent-foreground" />
                )}
              </div>
              <div>
                <p className="font-semibold text-card-foreground text-sm tracking-tight">{exp.item}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{exp.paymentType}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className={`font-display font-black text-base ${getAmountClass(exp.amount)}`}>
                  ₹{exp.amount.toFixed(0)}
                </p>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${getStatusBg(exp.amount)} uppercase`}>
                  {getAmountLabel(exp.amount)}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 rounded-full" 
                onClick={() => onDelete(exp.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};


export default ExpenseList;
