import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { CalendarIcon, Wallet, Banknote, Smartphone, LogOut, ShieldCheck } from "lucide-react";
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
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, Variants } from "framer-motion";
import Logo from "@/components/Logo";

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: "spring", 
      stiffness: 260, 
      damping: 20 
    } 
  }
};


const Index = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    // Sort in JS instead of Firestore to avoid "Missing Index" error
    const q = query(
      collection(db, "expenses"), 
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const expenseData: Expense[] = [];
      snapshot.forEach((doc) => {
        expenseData.push({ id: doc.id, ...doc.data() } as Expense);
      });
      
      // Sort manually by date descending
      expenseData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setExpenses(expenseData);
      setLoading(false);
    }, (error) => {
      console.error("Firestore error:", error);
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
        userId: user.uid, // Attach user ID for security/scoping
        userEmail: user.email // Attach email for easy identification in DB
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
      // Optimistic update: hide from UI immediately
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      
      await deleteDoc(doc(db, "expenses", id));
      toast.success("Expense deleted");
    } catch (error) {
      console.error("Error deleting expense: ", error);
      toast.error("Failed to delete expense. Please try again.");
      // Re-fetch or manually restore state if needed (onSnapshot will normally handle this)
    }
  };


  const handleSignOut = () => {
    signOut(auth).then(() => toast.success("Signed out"));
  };

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={container}
      className="min-h-screen bg-background"
    >
      <div className="mx-auto max-w-md px-4 py-8">
        {/* Header */}
        <motion.div variants={item} className="mb-8 flex items-center justify-between gap-2">
          {isAdmin ? (
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")} title="Admin Panel" className="rounded-2xl shadow-sm hover:scale-110 active:scale-95 transition-all">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </Button>
          ) : (
            <div className="w-10" />
          )}
          
          <div className="text-center flex-1">
            <Logo />
          </div>
          
          <div className="flex-1 flex justify-end">
            <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign Out" className="rounded-2xl shadow-sm hover:scale-110 active:scale-95 transition-all">
              <LogOut className="h-6 w-6 text-muted-foreground/30" />
            </Button>
          </div>
        </motion.div>
        
        <motion.div variants={item} className="text-center mb-10">
          <h1 className="font-display text-4xl font-black text-foreground tracking-tighter italic">
            Monthly Spending
          </h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <p className="text-xs text-muted-foreground truncate font-medium opacity-50">
              {user?.email}
            </p>
            {isAdmin && <span className="text-[9px] uppercase font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-full border border-primary/20">Admin</span>}
          </div>
        </motion.div>



        {/* Monthly Total Card */}
        <motion.div variants={item} whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
          <Card className="mb-8 border-0 shadow-2xl bg-gradient-to-br from-primary via-indigo-600 to-pink-500 text-primary-foreground relative overflow-hidden group rounded-[2rem]">
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute -right-12 -top-12 p-8 opacity-10 rotate-12">
              <Wallet className="h-48 w-48" />
            </div>
            <CardContent className="pt-10 pb-10 text-center relative z-10">
              <p className="text-[10px] uppercase font-black tracking-[0.4em] opacity-80 mb-3">Total Monthly Budget</p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-2xl font-black opacity-50 italic">₹</span>
                <p className="font-display text-6xl font-black tracking-tighter drop-shadow-2xl">{monthlyTotal.toLocaleString()}</p>
              </div>
              <div className="flex justify-center gap-4 mt-8">
                <div className="flex flex-col items-center gap-1 bg-white/10 px-5 py-2.5 rounded-2xl backdrop-blur-md border border-white/10">
                  <Banknote className="h-4 w-4 opacity-70" />
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Cash</span>
                  <span className="text-sm font-black">₹{cashTotal.toLocaleString()}</span>
                </div>
                <div className="flex flex-col items-center gap-1 bg-white/10 px-5 py-2.5 rounded-2xl backdrop-blur-md border border-white/10">
                  <Smartphone className="h-4 w-4 opacity-70" />
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Digital</span>
                  <span className="text-sm font-black">₹{digitalTotal.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>


        {/* Date Picker */}
        <motion.div variants={item} className="mb-6 flex justify-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 font-bold shadow-sm h-12 px-6 rounded-xl border-dashed">
                <CalendarIcon className="h-4 w-4 text-primary" />
                {format(selectedDate, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-2xl shadow-2xl border-0 overflow-hidden" align="center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => d && setSelectedDate(d)}
                initialFocus
                className={cn("p-4 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </motion.div>

        {/* Add Expense */}
        <motion.div variants={item}>
          <Card className="mb-6 shadow-xl rounded-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-black font-display uppercase tracking-widest text-muted-foreground">Add Expense</CardTitle>
            </CardHeader>
            <CardContent>
              <ExpenseForm onAdd={handleAdd as any} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Day's Expenses */}
        <motion.div variants={item}>
          <Card className="shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="pb-4 bg-muted/30">
              <CardTitle className="text-sm font-black font-display flex items-center justify-between">
                <span>{selectedDate.toDateString() === new Date().toDateString() ? "TODAY" : format(selectedDate, "MMM d").toUpperCase()} ITEMS</span>
                <span className={`font-display text-xl ${getTotalStatusClass(dayExpenses.reduce((s, e) => s + e.amount, 0))}`}>
                  ₹{dayExpenses.reduce((s, e) => s + e.amount, 0).toLocaleString()}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {loading ? (
                <div className="py-20 text-center flex flex-col items-center gap-2">
                  <div className="h-6 w-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <p className="text-xs text-muted-foreground font-bold tracking-widest">Syncing...</p>
                </div>
              ) : (
                <ExpenseList expenses={dayExpenses} onDelete={handleDelete} />
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};


export default Index;

