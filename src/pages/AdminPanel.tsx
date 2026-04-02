import { useState, useEffect } from "react";
import { collection, query, onSnapshot, doc, deleteDoc, getDocs, where, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, ShieldCheck, ArrowLeft, Users } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const AdminPanel = () => {
  const { user, isAdmin } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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

  const handleRemoveUser = async (userToRemove: any) => {
    if (userToRemove.email === "dhphariprasad@gmail.com") {
      toast.error("You cannot remove the super admin.");
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to remove ${userToRemove.email} and all their data? This action is permanent!`);
    if (!confirmed) return;

    try {
      // 1. Delete user's expenses
      const expensesQ = query(collection(db, "expenses"), where("userId", "==", userToRemove.id));
      const expenseSnap = await getDocs(expensesQ);
      const batch = writeBatch(db);
      expenseSnap.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();

      // 2. Delete the user document itself
      await deleteDoc(doc(db, "users", userToRemove.id));
      
      toast.success(`${userToRemove.email} removed successfully.`);
    } catch (e) {
      console.error("Delete user error:", e);
      toast.error("Failed to remove user completely.");
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to App
          </Button>
          <div className="flex items-center gap-2 text-primary font-bold">
            <ShieldCheck className="h-5 w-5" /> Admin Panel
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-muted-foreground" />
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage your registered users and their data.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-20 text-center animate-pulse">Scanning users...</div>
            ) : (
              <div className="divide-y">
                {users.map((u) => (
                  <div key={u.id} className="py-4 flex items-center justify-between group">
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="text-sm font-medium truncate">{u.displayName}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                    <div>
                      {u.email === "dhphariprasad@gmail.com" ? (
                        <span className="text-[10px] uppercase font-bold text-primary px-2 py-1 bg-primary/10 rounded">Super Admin</span>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleRemoveUser(u)}
                          className="hover:bg-destructive/10 hover:text-destructive text-muted-foreground group-hover:visible sm:invisible"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPanel;
