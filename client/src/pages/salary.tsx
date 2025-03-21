import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { insertSalarySchema, type InsertSalary, type Salary } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { type UpdateSalary } from "@shared/schema";


const months = Array.from({ length: 12 }, (_, i) => i + 1);
const years = [2025];

export default function Salary() {
  const { toast } = useToast();
  const [editingSalary, setEditingSalary] = useState<Salary | null>(null);

  const form = useForm<InsertSalary>({
    resolver: zodResolver(insertSalarySchema),
    defaultValues: {
      amount: 0,
      month: new Date().getMonth() + 1,
      year: 2025,
    },
  });

  const editForm = useForm<UpdateSalary>({
    resolver: zodResolver(insertSalarySchema),
    defaultValues: editingSalary || {
      amount: 0,
      month: new Date().getMonth() + 1,
      year: 2025,
    },
  });

  const { data: salaries } = useQuery<Salary[]>({ 
    queryKey: ["/api/salaries"]
  });

  const mutation = useMutation({
    mutationFn: async (values: InsertSalary) => {
      await apiRequest("POST", "/api/salaries", values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/salaries"] });
      toast({ title: "Success", description: "Salary saved successfully" });
      form.reset();
      setEditingSalary(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: UpdateSalary) => {
      await apiRequest("PUT", `/api/salaries/${values.id}`, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/salaries"] });
      toast({ title: "Success", description: "Salary updated successfully" });
      setEditingSalary(null);
    },
  });

  const handleSubmit = (data: InsertSalary) => {
    const existingSalary = salaries?.find(
      (s) => s.month === data.month && s.year === data.year
    );

    if (existingSalary) {
      toast({
        title: "Salary Already Exists",
        description: (
          <div className="mt-2 flex flex-col space-y-2">
            <p>A salary entry for {new Date(2025, data.month - 1).toLocaleString('default', { month: 'long' })} {data.year} already exists.</p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setEditingSalary(existingSalary);
                  editForm.reset(existingSalary);
                }}
              >
                Modify Existing
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  mutation.mutate(data);
                }}
              >
                Add New Entry
              </Button>
            </div>
          </div>
        ),
        duration: 10000,
      });
      return;
    }

    mutation.mutate(data);
  };

  const handleUpdate = (data: UpdateSalary) => {
    if (editingSalary) {
      updateMutation.mutate({
        ...data,
        id: editingSalary.id,
      });
    }
  };

  const totalSalary = salaries?.reduce((sum, salary) => salary.amount > 0 ? sum + parseFloat(salary.amount) : sum, 0) || 0;

  return (
    <>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 pt-16 md:pt-0">
        <Card className="p-6">
          <h2 className="mb-4 text-2xl font-bold">Add Salary</h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="month"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Month</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {months.map((month) => (
                          <SelectItem key={month} value={month.toString()}>
                            {new Date(2025, month - 1).toLocaleString('default', { month: 'long' })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
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
                      <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={mutation.isPending}>
                Save Salary
              </Button>
            </form>
          </Form>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-2xl font-bold">Total Salary 2025</h2>
          <div className="text-4xl font-bold text-primary mb-4">
            {totalSalary.toLocaleString()} PLN
          </div>
          
          {salaries && salaries.filter(salary => salary.amount > 0).length > 0 ? (
            <div className="space-y-3 mt-6">
              <h3 className="text-lg font-medium">Monthly Breakdown</h3>
              <div className="h-px bg-border w-full my-2"></div>
              {salaries.filter(salary => salary.amount > 0).map((salary) => (
                <div 
                  key={salary.id} 
                  className="flex justify-between items-center border-b pb-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                  onClick={() => {
                    setEditingSalary(salary);
                    editForm.reset(salary);
                  }}
                >
                  <span>
                    {new Date(2025, salary.month - 1).toLocaleString('default', { month: 'long' })} {salary.year}
                  </span>
                  <span className="font-medium">{salary.amount.toLocaleString()} PLN</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground mt-4">No salaries added yet</div>
          )}
        </Card>
      </div>

      <Dialog open={!!editingSalary} onOpenChange={(open) => !open && setEditingSalary(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modify Salary</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Update salary for {editingSalary && new Date(2025, editingSalary.month - 1).toLocaleString('default', { month: 'long' })} {editingSalary?.year}
            </p>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleUpdate)} className="space-y-4">
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
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
                  Update Salary
                </Button>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}