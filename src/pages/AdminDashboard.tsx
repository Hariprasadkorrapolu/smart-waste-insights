import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  LogOut, Search, Trash2, Download, ArrowUpDown, Loader2,
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Submission = Tables<"submissions">;
type SortField = "name" | "created_at" | "age";
type SortDir = "asc" | "desc";

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/admin/login"); return; }
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!isAdmin) { navigate("/admin/login"); return; }
      fetchSubmissions();
    };
    checkAuth();
  }, [navigate]);

  const fetchSubmissions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("submissions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setSubmissions(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const sub = submissions.find((s) => s.id === id);

    // Delete photo from storage if exists
    if (sub?.photo_url) {
      const path = sub.photo_url.split("/submission-photos/")[1];
      if (path) {
        await supabase.storage.from("submission-photos").remove([path]);
      }
    }

    const { error } = await supabase.from("submissions").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
      toast({ title: "Deleted", description: "Submission removed." });
    }
    setDeletingId(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const filtered = useMemo(() => {
    let result = submissions;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.phone.includes(q)
      );
    }
    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") cmp = a.name.localeCompare(b.name);
      else if (sortField === "age") cmp = a.age - b.age;
      else cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [submissions, search, sortField, sortDir]);

  const exportCSV = () => {
    const headers = ["Name", "Address", "Gender", "Age", "Phone", "Email", "Photo URL", "Date"];
    const rows = filtered.map((s) => [
      s.name, s.address, s.gender, s.age, s.phone, s.email,
      s.photo_url || "", new Date(s.created_at).toLocaleString(),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `waste-submissions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const SortButton: React.FC<{ field: SortField; label: string }> = ({ field, label }) => (
    <button onClick={() => toggleSort(field)} className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
      {label}
      <ArrowUpDown className={`w-3 h-3 ${sortField === field ? "text-primary" : "text-muted-foreground"}`} />
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-earth">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-display font-bold text-foreground">Admin Dashboard</h1>
          <Button variant="outline" size="sm" onClick={handleLogout} className="rounded-full">
            <LogOut className="w-4 h-4 mr-1" /> Logout
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={exportCSV} variant="outline" className="rounded-full">
            <Download className="w-4 h-4 mr-1" /> Export CSV
          </Button>
        </div>

        <div className="text-sm text-muted-foreground mb-3">
          {filtered.length} submission{filtered.length !== 1 ? "s" : ""}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="bg-card rounded-2xl shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead><SortButton field="name" label="Name" /></TableHead>
                    <TableHead className="hidden md:table-cell">Address</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead><SortButton field="age" label="Age" /></TableHead>
                    <TableHead className="hidden md:table-cell">Phone</TableHead>
                    <TableHead className="hidden lg:table-cell">Email</TableHead>
                    <TableHead>Photo</TableHead>
                    <TableHead><SortButton field="created_at" label="Date" /></TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                        No submissions found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((s, i) => (
                      <TableRow key={s.id}>
                        <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell className="hidden md:table-cell max-w-[200px] truncate">{s.address}</TableCell>
                        <TableCell>{s.gender}</TableCell>
                        <TableCell>{s.age}</TableCell>
                        <TableCell className="hidden md:table-cell">{s.phone}</TableCell>
                        <TableCell className="hidden lg:table-cell">{s.email}</TableCell>
                        <TableCell>
                          {s.photo_url ? (
                            <a href={s.photo_url} target="_blank" rel="noopener noreferrer">
                              <img src={s.photo_url} alt="Submission" className="w-10 h-10 rounded-lg object-cover hover:scale-110 transition-transform" />
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(s.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                {deletingId === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Submission</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete the submission from {s.name}. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(s.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
