import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { insertExpenseSchema, type InsertExpense, type Expense, categories } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, subDays, startOfWeek, startOfMonth, isAfter, parseISO } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Expenses() {
  const { toast } = useToast();
  const [filterType, setFilterType] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const form = useForm<InsertExpense>({
    resolver: zodResolver(insertExpenseSchema),
    defaultValues: {
      amount: 0,
      category: "Rent",
      date: format(new Date(), "yyyy-MM-dd"),
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
    },
  });

  const editForm = useForm<InsertExpense>({
    resolver: zodResolver(insertExpenseSchema),
    defaultValues: {
      amount: 0,
      category: "Rent",
      date: format(new Date(), "yyyy-MM-dd"),
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
    },
  });

  const { data: expenses } = useQuery<Expense[]>({ 
    queryKey: ["/api/expenses"]
  });

  const mutation = useMutation({
    mutationFn: async (values: InsertExpense) => {
      // Extract month and year from the date
      const date = new Date(values.date);
      const updatedValues = {
        ...values,
        month: date.getMonth() + 1,
        year: date.getFullYear()
      };
      await apiRequest("POST", "/api/expenses", updatedValues);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({ title: "Success", description: "Expense saved successfully" });
      form.reset({
        amount: 0,
        category: "Rent",
        date: format(new Date(), "yyyy-MM-dd"),
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: InsertExpense & { id: number }) => {
      const { id, ...expenseData } = values;
      // Extract month and year from the date
      const date = new Date(expenseData.date);
      const updatedValues = {
        ...expenseData,
        month: date.getMonth() + 1,
        year: date.getFullYear()
      };
      await apiRequest("PUT", `/api/expenses/${id}`, updatedValues);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({ title: "Success", description: "Expense updated successfully" });
      setEditingExpense(null);
    },
  });

  // Function to handle opening the edit dialog
  const handleEdit = (expense: Expense) => {
    // Format the date for the date input
    const date = new Date(expense.createdAt);
    setEditingExpense(expense);
    editForm.reset({
      amount: expense.amount,
      category: expense.category,
      date: format(date, "yyyy-MM-dd"),
      month: expense.month,
      year: expense.year,
    });
  };

  // Function to handle submission of the edit form
  const handleUpdate = (data: InsertExpense) => {
    if (editingExpense) {
      updateMutation.mutate({
        ...data,
        id: editingExpense.id
      });
    }
  };

  // Filter expenses based on the selected filter
  const filteredExpenses = expenses?.filter(expense => {
    if (!expense.createdAt) return true;

    const expenseDate = new Date(expense.createdAt);
    const today = new Date();

    switch (filterType) {
      case "today":
        return format(expenseDate, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
      case "yesterday":
        const yesterday = subDays(today, 1);
        return format(expenseDate, "yyyy-MM-dd") === format(yesterday, "yyyy-MM-dd");
      case "thisWeek":
        const weekStart = startOfWeek(today);
        return isAfter(expenseDate, weekStart);
      case "thisMonth":
        const monthStart = startOfMonth(today);
        return isAfter(expenseDate, monthStart);
      case "custom":
        if (!dateRange.start || !dateRange.end) return true;
        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);
        end.setHours(23, 59, 59, 999); // Include the end date fully
        return expenseDate >= start && expenseDate <= end;
      default:
        return true;
    }
  }) || [];

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0) || 0;
  const expensesByCategory = categories
    .map(category => ({
      category,
      amount: Number(filteredExpenses.filter(e => e.category === category).reduce((sum, e) => sum + (Number(e.amount) || 0), 0)) || 0
    }))
    .filter(item => item.amount > 0); // Filter out zero-amount categories

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 pt-16 md:pt-0">
      <Card className="p-6">
        <h2 className="mb-4 text-2xl font-bold">Add Expense</h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (PLN)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">Add Expense</Button>
          </form>
        </Form>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-2xl font-bold">Expense Summary</h2>

        <Tabs defaultValue="all" onValueChange={setFilterType}>
          <TabsList className="grid grid-cols-6 mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="yesterday">Yesterday</TabsTrigger>
            <TabsTrigger value="thisWeek">This Week</TabsTrigger>
            <TabsTrigger value="thisMonth">This Month</TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>
          </TabsList>

          {filterType === "custom" && (
            <div className="flex gap-4 my-4">
              <div className="flex-1">
                <label className="block text-sm mb-1">Start Date</label>
                <Input 
                  type="date" 
                  value={dateRange.start}
                  onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm mb-1">End Date</label>
                <Input 
                  type="date" 
                  value={dateRange.end}
                  onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
                />
              </div>
            </div>
          )}

          {/* Shared content for all tabs */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <h3 className="text-xl font-bold">Total: {totalExpenses.toFixed(2)} PLN</h3>
            </div>

            <div className="space-y-2 mt-8">
              <h3 className="text-lg font-medium">Expense List</h3>
              {filteredExpenses.filter(expense => expense.amount > 0).length === 0 ? (
                <p className="text-gray-500">No expenses found</p>
              ) : (
                <div className="space-y-2">
                  {filteredExpenses
                    .filter(expense => expense.amount > 0)
                    .map(expense => (
                    <div 
                      key={expense.id} 
                      className="flex justify-between items-center p-2 border rounded hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleEdit(expense)}
                    >
                      <div>
                        <p className="font-medium">{expense.category}</p>
                        <p className="text-sm text-gray-500">
                          {expense.createdAt ? format(new Date(expense.createdAt), "MMM d, yyyy") : "Unknown date"}
                        </p>
                      </div>
                      <p>{Number(expense.amount).toFixed(2)} PLN</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Tabs>
      </Card>

      {/* Edit Expense Dialog */}
      <Dialog open={!!editingExpense} onOpenChange={(open) => !open && setEditingExpense(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {editingExpense && (
              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(handleUpdate)} className="space-y-4">
                  <FormField
                    control={editForm.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (PLN)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={e => field.onChange(parseFloat(e.target.value))} 
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setEditingExpense(null)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Save Changes</Button>
                  </div>
                </form>
              </Form>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}