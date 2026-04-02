import { useState, useEffect } from "react";
import { collection, query, onSnapshot, doc, deleteDoc, getDocs, where, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, ShieldCheck, ArrowLeft, Users, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const AdminPanel = () => {
  const { user, isAdmin } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
      return;
    }

    const q = query(collection(db, "users"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userData: any[] = [];
      snapshot.forEach((doc) => {
        userData.push({ id: doc.id, ...doc.data() });
      });
      setUsers(userData);
      setLoading(false);
    }, (error) => {
      console.error("Fetch users error:", error);
      toast.error("Failed to load user list");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  const [selectedUserExpenses, setSelectedUserExpenses] = useState<any[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);

  useEffect(() => {
    if (!selectedUserId) {
      setSelectedUserExpenses([]);
      return;
    }
    setLoadingExpenses(true);
    const q = query(collection(db, "expenses"), where("userId", "==", selectedUserId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const expenseData: any[] = [];
      snapshot.forEach((doc) => {
        expenseData.push({ id: doc.id, ...doc.data() });
      });
      setSelectedUserExpenses(expenseData);
      setLoadingExpenses(false);
    }, (error) => {
      console.error("Fetch user expenses error:", error);
      setLoadingExpenses(false);
    });

    return () => unsubscribe();
  }, [selectedUserId]);

  const selectedUser = users.find(u => u.id === selectedUserId);

  const handleRemoveUser = async () => {
    if (!selectedUser) return;
    
    if (selectedUser.email === "dhphariprasad@gmail.com") {
      toast.error("You cannot remove the super admin.");
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to remove ${selectedUser.email} and all their ${selectedUserExpenses.length} records? This action is permanent!`);
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      // 1. Delete user's expenses
      const batch = writeBatch(db);
      const expensesSnap = await getDocs(query(collection(db, "expenses"), where("userId", "==", selectedUser.id)));
      expensesSnap.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();

      // 2. Delete the user document itself
      await deleteDoc(doc(db, "users", selectedUser.id));
      
      toast.success(`${selectedUser.email} removed successfully.`);
      setSelectedUserId(""); // Clear selection
    } catch (e) {
      console.error("Delete user error:", e);
      toast.error("Failed to remove user completely.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to App
          </Button>
          <div className="flex items-center gap-2 text-primary font-bold">
            <ShieldCheck className="h-5 w-5" /> Admin Portal
          </div>
        </div>

        <Card className="shadow-xl border-t-4 border-t-primary">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Select a user to review or remove.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground ml-1">Registered Users</label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId} disabled={loading}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder={loading ? "Loading users..." : "Choose a user..."} />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id} disabled={u.email === "dhphariprasad@gmail.com"}>
                      <div className="flex flex-col">
                        <span className="font-medium">{u.displayName}</span>
                        <span className="text-[10px] opacity-70">{u.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedUser && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-muted-foreground ml-1">User's Expenses ({selectedUserExpenses.length})</label>
                  <div className="max-h-48 overflow-y-auto border rounded-md divide-y divide-border bg-muted/10">
                    {loadingExpenses ? (
                        <div className="p-4 text-center text-xs animate-pulse">Loading items...</div>
                    ) : selectedUserExpenses.length > 0 ? (
                      selectedUserExpenses.map((exp) => (
                        <div key={exp.id} className="p-2 px-3 text-[11px] flex justify-between items-center">
                          <span className="truncate max-w-[140px]">{exp.item}</span>
                          <span className="font-bold text-primary">₹{exp.amount}</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-xs text-muted-foreground italic">No expenses found for this user.</div>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20 space-y-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-destructive">Danger Zone</p>
                      <p className="text-xs text-muted-foreground">Removing <b>{selectedUser.email}</b> will delete their account info and all {selectedUserExpenses.length} records forever.</p>
                    </div>
                  </div>
                  <Button 
                    variant="destructive" 
                    className="w-full gap-2 font-bold"
                    onClick={handleRemoveUser}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" /> {isDeleting ? "Removing..." : "Delete User & Records"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="bg-muted/30 py-3 border-t justify-center">
            <p className="text-[10px] text-muted-foreground text-center">
              Total registered accounts: {users.length}
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};


export default AdminPanel;

