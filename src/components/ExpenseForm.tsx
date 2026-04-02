import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";

export type Expense = {
  id: string;
  paymentType: "cash" | "digital";
  amount: number;
  item: string;
  date: string;
};

interface ExpenseFormProps {
  onAdd: (expense: Expense) => void;
}

const ExpenseForm = ({ onAdd }: ExpenseFormProps) => {
  const [paymentType, setPaymentType] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [item, setItem] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentType || !amount || !item) return;

    onAdd({
      id: crypto.randomUUID(),
      paymentType: paymentType as "cash" | "digital",
      amount: parseFloat(amount),
      item,
      date: new Date().toISOString(),
    });

    setPaymentType("");
    setAmount("");
    setItem("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Select value={paymentType} onValueChange={setPaymentType}>
        <SelectTrigger>
          <SelectValue placeholder="Payment Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="cash">💵 Cash</SelectItem>
          <SelectItem value="digital">📱 Digital Payment</SelectItem>
        </SelectContent>
      </Select>

      <Input
        type="number"
        placeholder="Amount spent"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        min="0"
        step="0.01"
      />

      <Input
        placeholder="Item description"
        value={item}
        onChange={(e) => setItem(e.target.value)}
      />

      <Button type="submit" className="w-full gap-2" disabled={!paymentType || !amount || !item}>
        <Plus className="h-4 w-4" /> Add Expense
      </Button>
    </form>
  );
};

export default ExpenseForm;
