import type { Expense } from "./ExpenseForm";
import { Banknote, Smartphone, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      <p className="text-center text-muted-foreground py-8">
        No expenses today. Start adding! 🎉
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {expenses.map((exp) => (
        <div
          key={exp.id}
          className="flex items-center justify-between rounded-lg border bg-card p-3 transition-all hover:shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-accent p-2">
              {exp.paymentType === "cash" ? (
                <Banknote className="h-4 w-4 text-accent-foreground" />
              ) : (
                <Smartphone className="h-4 w-4 text-accent-foreground" />
              )}
            </div>
            <div>
              <p className="font-medium text-card-foreground text-sm">{exp.item}</p>
              <p className="text-xs text-muted-foreground capitalize">{exp.paymentType === "digital" ? "Digital Payment" : "Cash"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className={`font-display font-bold ${getAmountClass(exp.amount)}`}>
                ₹{exp.amount.toFixed(2)}
              </p>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${getStatusBg(exp.amount)}`}>
                {getAmountLabel(exp.amount)}
              </span>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onDelete(exp.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ExpenseList;
