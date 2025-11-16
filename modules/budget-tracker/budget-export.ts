interface BudgetItem {
  id: string;
  category: string;
  item: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  planned_cost: number;
  actual_cost: number;
  vendor: string | null;
  status: string;
  notes: string | null;
  due_date: string | null;
  payment_date: string | null;
  invoice_number: string | null;
  currency: string;
  tax_rate: number;
}

interface Project {
  id: string;
  name: string;
  budget_total: number | null;
  venue: string | null;
  start_date: string | null;
  end_date: string | null;
}

export function exportToCSV(budgetItems: BudgetItem[], project: Project) {
  const headers = [
    "Category",
    "Item",
    "Quantity",
    "Unit Cost",
    "Total Cost",
    "Planned Cost",
    "Actual Cost",
    "Vendor",
    "Status",
    "Invoice #",
    "Due Date",
    "Payment Date",
    "Currency",
    "Tax Rate",
    "Notes",
  ];

  const rows = budgetItems.map(item => [
    item.category,
    item.item,
    item.quantity,
    item.unit_cost,
    item.total_cost,
    item.planned_cost || item.total_cost,
    item.actual_cost || 0,
    item.vendor || "",
    item.status,
    item.invoice_number || "",
    item.due_date || "",
    item.payment_date || "",
    item.currency || "USD",
    item.tax_rate || 0,
    item.notes || "",
  ]);

  const csvContent = [
    [`Budget Report: ${project.name}`],
    [`Generated: ${new Date().toLocaleString()}`],
    [],
    headers,
    ...rows,
    [],
    ["Summary"],
    ["Total Planned", budgetItems.reduce((sum, i) => sum + (i.planned_cost || i.total_cost), 0)],
    ["Total Actual", budgetItems.reduce((sum, i) => sum + (i.actual_cost || 0), 0)],
    ["Total Items", budgetItems.length],
  ]
    .map(row => row.map(cell => `"${cell}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `budget-${project.name.replace(/\s+/g, "-")}-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportToJSON(budgetItems: BudgetItem[], project: Project) {
  const exportData = {
    project: {
      name: project.name,
      budget_total: project.budget_total,
      venue: project.venue,
      start_date: project.start_date,
      end_date: project.end_date,
    },
    generated_at: new Date().toISOString(),
    summary: {
      total_planned: budgetItems.reduce((sum, i) => sum + (i.planned_cost || i.total_cost), 0),
      total_actual: budgetItems.reduce((sum, i) => sum + (i.actual_cost || 0), 0),
      total_items: budgetItems.length,
      by_category: getCategorySummary(budgetItems),
      by_status: getStatusSummary(budgetItems),
    },
    items: budgetItems,
  };

  const dataStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `budget-${project.name.replace(/\s+/g, "-")}-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportToPDF(budgetItems: BudgetItem[], project: Project) {
  const categoryData = getCategorySummary(budgetItems);
  const totalPlanned = budgetItems.reduce((sum, i) => sum + (i.planned_cost || i.total_cost), 0);
  const totalActual = budgetItems.reduce((sum, i) => sum + (i.actual_cost || 0), 0);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Budget Report - ${project.name}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 40px;
          color: #333;
        }
        h1 {
          color: #00E8FF;
          border-bottom: 3px solid #00E8FF;
          padding-bottom: 10px;
        }
        h2 {
          color: #9B5CFF;
          margin-top: 30px;
        }
        .meta {
          color: #666;
          margin-bottom: 20px;
        }
        .summary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin: 20px 0;
        }
        .summary-card {
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          padding: 20px;
          border-radius: 8px;
          text-align: center;
        }
        .summary-card h3 {
          margin: 0 0 10px 0;
          font-size: 14px;
          color: #666;
        }
        .summary-card .value {
          font-size: 28px;
          font-weight: bold;
          color: #333;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th {
          background: #00E8FF;
          color: white;
          padding: 12px;
          text-align: left;
          font-weight: 600;
        }
        td {
          padding: 10px 12px;
          border-bottom: 1px solid #e0e0e0;
        }
        tr:hover {
          background: #f9f9f9;
        }
        .category-section {
          margin: 30px 0;
        }
        .category-header {
          background: #9B5CFF;
          color: white;
          padding: 10px 15px;
          font-size: 18px;
          font-weight: bold;
          border-radius: 5px;
        }
        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }
        .status-estimated { background: #6c757d; color: white; }
        .status-quoted { background: #ffc107; color: black; }
        .status-purchase_order { background: #00E8FF; color: black; }
        .status-invoiced { background: #9B5CFF; color: white; }
        .status-paid { background: #28a745; color: white; }
        .status-overdue { background: #dc3545; color: white; }
        @media print {
          body { margin: 20px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <h1>Budget Report: ${project.name}</h1>
      <div class="meta">
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        ${project.venue ? `<p><strong>Venue:</strong> ${project.venue}</p>` : ''}
        ${project.start_date ? `<p><strong>Date:</strong> ${new Date(project.start_date).toLocaleDateString()} ${project.end_date ? `- ${new Date(project.end_date).toLocaleDateString()}` : ''}</p>` : ''}
      </div>

      <h2>Budget Summary</h2>
      <div class="summary">
        <div class="summary-card">
          <h3>Total Planned</h3>
          <div class="value">$${totalPlanned.toLocaleString()}</div>
        </div>
        <div class="summary-card">
          <h3>Total Actual</h3>
          <div class="value">$${totalActual.toLocaleString()}</div>
        </div>
        <div class="summary-card">
          <h3>Variance</h3>
          <div class="value" style="color: ${totalActual > totalPlanned ? '#dc3545' : '#28a745'}">
            $${Math.abs(totalActual - totalPlanned).toLocaleString()}
            ${totalActual > totalPlanned ? ' over' : ' under'}
          </div>
        </div>
      </div>

      <h2>By Category</h2>
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>Planned</th>
            <th>Actual</th>
            <th>Variance</th>
            <th>Utilization</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(categoryData).map(([category, data]: [string, any]) => `
            <tr>
              <td style="text-transform: capitalize;">${category}</td>
              <td>$${data.planned.toLocaleString()}</td>
              <td>$${data.actual.toLocaleString()}</td>
              <td style="color: ${data.variance > 0 ? '#dc3545' : '#28a745'}">
                $${Math.abs(data.variance).toLocaleString()}
              </td>
              <td>${data.utilization.toFixed(1)}%</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h2>Detailed Line Items</h2>
      ${Object.entries(getCategorizedItems(budgetItems)).map(([category, items]: [string, any]) => `
        <div class="category-section">
          <div class="category-header" style="text-transform: capitalize;">${category}</div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Unit Cost</th>
                <th>Total</th>
                <th>Vendor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((item: BudgetItem) => `
                <tr>
                  <td>${item.item}</td>
                  <td>${item.quantity}</td>
                  <td>$${item.unit_cost.toLocaleString()}</td>
                  <td>$${item.total_cost.toLocaleString()}</td>
                  <td>${item.vendor || '-'}</td>
                  <td><span class="status-badge status-${item.status}">${item.status.replace('_', ' ')}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `).join('')}

      <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #00E8FF; color: #666; font-size: 12px;">
        <p>Generated by StageTechPro Budget Tracker</p>
        <p>This report is for reference only. Always verify with calibrated equipment.</p>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }
}

function getCategorySummary(items: BudgetItem[]) {
  const categories: Record<string, any> = {};

  items.forEach(item => {
    if (!categories[item.category]) {
      categories[item.category] = {
        planned: 0,
        actual: 0,
        variance: 0,
        utilization: 0,
      };
    }

    categories[item.category].planned += item.planned_cost || item.total_cost;
    categories[item.category].actual += item.actual_cost || 0;
  });

  Object.keys(categories).forEach(cat => {
    categories[cat].variance = categories[cat].actual - categories[cat].planned;
    categories[cat].utilization = categories[cat].planned > 0
      ? (categories[cat].actual / categories[cat].planned) * 100
      : 0;
  });

  return categories;
}

function getStatusSummary(items: BudgetItem[]) {
  const statuses: Record<string, number> = {};

  items.forEach(item => {
    statuses[item.status] = (statuses[item.status] || 0) + 1;
  });

  return statuses;
}

function getCategorizedItems(items: BudgetItem[]) {
  const categorized: Record<string, BudgetItem[]> = {};

  items.forEach(item => {
    if (!categorized[item.category]) {
      categorized[item.category] = [];
    }
    categorized[item.category].push(item);
  });

  return categorized;
}
