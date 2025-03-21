import React from "react";
import { useQuery } from "@tanstack/react-query";
import { type Salary, type Expense } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export default function Dashboard() {
  const [selectedMonth, setSelectedMonth] = React.useState<number>(new Date().getMonth() + 1);
  
  const { data: salaries } = useQuery<Salary[]>({ 
    queryKey: ["/api/salaries"]
  });
  
  const { data: expenses } = useQuery<Expense[]>({ 
    queryKey: ["/api/expenses"]
  });

  const totalSalary = salaries?.reduce((sum, salary) => sum + parseFloat(salary.amount), 0) || 0;
  const totalExpenses = expenses?.reduce((sum, expense) => sum + parseFloat(expense.amount), 0) || 0;
  const netSavings = totalSalary - totalExpenses;

  // Get current month (1-indexed)
  const currentMonth = selectedMonth;
  const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  
  // Monthly data for chart
  const monthlyData = Array.from({ length: 12 }, (_, month) => {
    const monthNumber = month + 1;
    const monthSalary = salaries?.filter(s => s.month === monthNumber).reduce((sum, s) => sum + parseFloat(s.amount), 0) || 0;
    const monthExpenses = expenses?.filter(e => e.month === monthNumber).reduce((sum, e) => sum + parseFloat(e.amount), 0) || 0;
    const savings = monthSalary - monthExpenses;
    const savings_rate = monthSalary > 0 ? (savings / monthSalary) * 100 : 0;
    
    return {
      month: new Date(2025, month).toLocaleString('default', { month: 'short' }),
      monthNumber,
      salary: monthSalary,
      expenses: monthExpenses,
      savings,
      savings_rate,
    };
  });
  
  // Current month data
  const currentMonthData = monthlyData.find(data => data.monthNumber === currentMonth);
  const previousMonthData = monthlyData.find(data => data.monthNumber === previousMonth);
  
  // Calculate month-over-month changes
  const incomeChange = ((currentMonthData?.salary || 0) - (previousMonthData?.salary || 0));
  const expenseChange = ((currentMonthData?.expenses || 0) - (previousMonthData?.expenses || 0));

  // Category data for pie chart
  const categoryData = expenses?.reduce((acc, curr) => {
    const existing = acc.find(item => item.category === curr.category);
    if (existing) {
      existing.value += parseFloat(curr.amount);
    } else {
      acc.push({ category: curr.category, value: parseFloat(curr.amount) });
    }
    return acc;
  }, [] as { category: string; value: number }[]) || [];

  return (
    <div className="space-y-6 pt-16 md:pt-0">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        <Card className="p-6">
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">Total Income</h3>
          <p className="text-2xl font-bold text-primary">{totalSalary.toLocaleString()} PLN</p>
        </Card>
        <Card className="p-6">
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">Total Expenses</h3>
          <p className="text-2xl font-bold text-destructive">{totalExpenses.toLocaleString()} PLN</p>
        </Card>
        <Card className="p-6">
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">Net Savings</h3>
          <p className={`text-2xl font-bold ${netSavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {netSavings.toLocaleString()} PLN
          </p>
        </Card>
      </div>

      {/* Monthly Analysis Section */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Monthly Analysis</h2>
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="px-3 py-1.5 border rounded-md bg-background"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
              <option key={month} value={month}>
                {new Date(2025, month - 1).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">Selected Month</h3>
              <p className="text-xl font-bold">{new Date(2025, currentMonth - 1).toLocaleString('default', { month: 'long' })}</p>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">Month Income</h3>
              <p className="text-xl font-bold text-primary">
                {(currentMonthData?.salary || 0).toLocaleString()} PLN
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">Month Expenses</h3>
              <p className="text-xl font-bold text-destructive">
                {(currentMonthData?.expenses || 0).toLocaleString()} PLN
              </p>
            </div>
          </div>
          
          <div className="mt-4">
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">Monthly Savings Rate</h3>
            <div className="flex items-center gap-4">
              <Progress 
                value={currentMonthData?.savings_rate || 0} 
                className="h-2 flex-1" 
              />
              <span className={`font-medium ${(currentMonthData?.savings_rate || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {currentMonthData?.savings_rate.toFixed(1)}%
              </span>
            </div>
          </div>
          
          <div className="mt-4">
            <h3 className="mb-2 text-sm font-medium">Month-over-Month Comparison</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Income Change</p>
                <p className={`font-medium ${incomeChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {incomeChange > 0 ? '+' : ''}{incomeChange.toLocaleString()} PLN
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expense Change</p>
                <p className={`font-medium ${expenseChange <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {expenseChange > 0 ? '+' : ''}{expenseChange.toLocaleString()} PLN
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-xl font-bold">Monthly Overview</h2>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={monthlyData}
              onClick={(data) => {
                if (data && data.activePayload && data.activePayload[0]) {
                  const clickedData = data.activePayload[0].payload;
                  setSelectedMonth(clickedData.monthNumber);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="salary" name="Income" fill="#0088FE" cursor="pointer" />
              <Bar dataKey="expenses" name="Expenses" fill="#FF8042" cursor="pointer" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-xl font-bold">Expense Distribution</h2>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="value"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={150}
                label={(entry) => `${entry.category}: ${entry.value.toLocaleString()} PLN`}
              >
                {categoryData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}