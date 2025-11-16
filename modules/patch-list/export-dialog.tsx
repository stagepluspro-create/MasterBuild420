"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Patchlist, PatchlistChannel, PatchlistCategory } from "@/lib/patchlist-service";
import { FileText, FileSpreadsheet, FileJson } from "lucide-react";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patchlist: Patchlist;
  channels: PatchlistChannel[];
  categories: PatchlistCategory[];
}

export function ExportDialog({
  open,
  onOpenChange,
  patchlist,
  channels,
  categories,
}: ExportDialogProps) {
  const exportCSV = () => {
    const headers = [
      "Channel",
      "Source",
      "Category",
      "Type",
      "Input",
      "Location",
      "Snake",
      "Console",
      "Destination",
      "Notes",
    ];

    const rows = channels.map((ch) => [
      ch.channel_number,
      ch.source_name,
      ch.category,
      ch.signal_type,
      ch.input_type || "",
      ch.physical_location || "",
      ch.snake_input || "",
      ch.console_channel || "",
      ch.destination || "",
      ch.notes || "",
    ]);

    const csvContent = [
      `"${patchlist.name}"`,
      `"Show: ${patchlist.show_name || 'N/A'}"`,
      `"Venue: ${patchlist.venue || 'N/A'}"`,
      `"Engineer: ${patchlist.engineer_name || 'N/A'}"`,
      `"Version: ${patchlist.version}"`,
      "",
      headers.map((h) => `"${h}"`).join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${patchlist.name.replace(/\s+/g, "_")}_patchlist.csv`;
    link.click();
    URL.revokeObjectURL(url);

    onOpenChange(false);
  };

  const exportJSON = () => {
    const data = {
      patchlist,
      channels,
      categories,
      exported_at: new Date().toISOString(),
    };

    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${patchlist.name.replace(/\s+/g, "_")}_patchlist.json`;
    link.click();
    URL.revokeObjectURL(url);

    onOpenChange(false);
  };

  const exportPDF = () => {
    window.print();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Patchlist</DialogTitle>
          <DialogDescription>
            Choose your preferred export format
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
          <Button className="w-full justify-start" variant="outline" onClick={exportCSV}>
            <FileSpreadsheet className="mr-3 h-5 w-5" />
            <div className="text-left">
              <div className="font-semibold">Export as CSV</div>
              <div className="text-xs text-gray-400">
                Open in Excel, Google Sheets, or any spreadsheet app
              </div>
            </div>
          </Button>

          <Button className="w-full justify-start" variant="outline" onClick={exportJSON}>
            <FileJson className="mr-3 h-5 w-5" />
            <div className="text-left">
              <div className="font-semibold">Export as JSON</div>
              <div className="text-xs text-gray-400">
                Complete data backup with all metadata
              </div>
            </div>
          </Button>

          <Button className="w-full justify-start" variant="outline" onClick={exportPDF}>
            <FileText className="mr-3 h-5 w-5" />
            <div className="text-left">
              <div className="font-semibold">Print / Save as PDF</div>
              <div className="text-xs text-gray-400">
                Formatted document for production binders
              </div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
