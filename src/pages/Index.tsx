import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { CalendarIcon, Wallet, Banknote, Smartphone, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ExpenseForm, { type Expense } from "@/components/ExpenseForm";
import ExpenseList from "@/components/ExpenseList";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, where } from "firebase/firestore";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { signOut } from "firebase/auth";

const Index = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    // Query scoped to the current user's UID
    const q = query(
      collection(db, "expenses"), 
      where("userId", "==", user.uid),
      orderBy("date", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const expenseData: Expense[] = [];
      snapshot.forEach((doc) => {
        expenseData.push({ id: doc.id, ...doc.data() } as Expense);
      });
      setExpenses(expenseData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching expenses: ", error);
      toast.error("Failed to load expenses");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();
  const selectedDateStr = selectedDate.toDateString();

  const dayExpenses = expenses.filter((e) => new Date(e.date).toDateString() === selectedDateStr);
  const monthExpenses = expenses.filter((e) => {
    const d = new Date(e.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const monthlyTotal = useMemo(() => monthExpenses.reduce((s, e) => s + e.amount, 0), [monthExpenses]);
  const cashTotal = useMemo(() => monthExpenses.filter((e) => e.paymentType === "cash").reduce((s, e) => s + e.amount, 0), [monthExpenses]);
  const digitalTotal = useMemo(() => monthExpenses.filter((e) => e.paymentType === "digital").reduce((s, e) => s + e.amount, 0), [monthExpenses]);

  const getTotalStatusClass = (total: number) => {
    if (total < 100) return "text-status-good";
    if (total < 1000) return "text-status-moderate";
    return "text-status-excess";
  };

  const handleAdd = async (expense: Omit<Expense, "id">) => {
    if (!user) return;
    try {
      const dated = { 
        ...expense, 
        date: selectedDate.toISOString(),
        userId: user.uid // Attach user ID to the document
      };
      await addDoc(collection(db, "expenses"), dated);
      toast.success("Expense added successfully");
    } catch (error) {
      console.error("Error adding expense: ", error);
      toast.error("Failed to add expense");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "expenses", id));
      toast.success("Expense deleted");
    } catch (error) {
      console.error("Error deleting expense: ", error);
      toast.error("Failed to delete expense");
    }
  };

  const handleSignOut = () => {
    signOut(auth).then(() => toast.success("Signed out"));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex-1" />
          <div className="text-center flex-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 mb-3">
              <Wallet className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Tracker</span>
            </div>
          </div>
          <div className="flex-1 flex justify-end">
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="rounded-full">
              <LogOut className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>
        </div>
        
        <div className="text-center mb-6">
          <h1 className="font-display text-3xl font-bold text-foreground">
            Monthly Spending
          </h1>
          <p className="text-xs text-muted-foreground mt-1 truncate max-w-[200px] mx-auto opacity-70">
            {user?.email}
          </p>
        </div>


        {/* Monthly Total Card */}
        <Card className="mb-4 border-0 shadow-lg bg-primary text-primary-foreground">
          <CardContent className="pt-6 pb-6 text-center">
            <p className="text-sm opacity-80 mb-1">This Month's Total</p>
            <p className="font-display text-4xl font-bold">₹{monthlyTotal.toFixed(2)}</p>
            <div className="flex justify-center gap-6 mt-4 text-sm opacity-80">
              <span className="flex items-center gap-1"><Banknote className="h-3.5 w-3.5" /> Cash: ₹{cashTotal.toFixed(2)}</span>
              <span className="flex items-center gap-1"><Smartphone className="h-3.5 w-3.5" /> Digital: ₹{digitalTotal.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Date Picker */}
        <div className="mb-4 flex justify-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 font-medium">
                <CalendarIcon className="h-4 w-4" />
                {format(selectedDate, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => d && setSelectedDate(d)}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Add Expense */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display">Add Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <ExpenseForm onAdd={handleAdd as any} />
          </CardContent>
        </Card>

        {/* Day's Expenses */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display flex items-center justify-between">
              {selectedDate.toDateString() === new Date().toDateString() ? "Today's" : format(selectedDate, "MMM d")} Expenses
              <span className={`font-display text-lg ${getTotalStatusClass(dayExpenses.reduce((s, e) => s + e.amount, 0))}`}>
                ₹{dayExpenses.reduce((s, e) => s + e.amount, 0).toFixed(2)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-muted-foreground animate-pulse">Loading...</div>
            ) : (
              <ExpenseList expenses={dayExpenses} onDelete={handleDelete} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;

