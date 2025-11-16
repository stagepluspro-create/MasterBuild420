import { DMXPatch, DMXFixture } from "@/lib/dmx-service";

export interface ExportOptions {
  format: "csv" | "ma3" | "etc" | "chamsys" | "pdf";
  patch: DMXPatch;
  fixtures: DMXFixture[];
}

export const exportFormats = {
  exportToCSV(patch: DMXPatch, fixtures: DMXFixture[]): string {
    const headers = [
      "Fixture Name",
      "Type",
      "Universe",
      "Start Address",
      "End Address",
      "Channels",
      "Mode",
      "Group",
      "Notes",
    ];

    const rows = fixtures.map((f) => [
      f.fixture_name,
      f.fixture_type || "",
      f.universe.toString(),
      f.start_address.toString(),
      f.end_address.toString(),
      f.channel_count.toString(),
      f.mode_name || "",
      f.group_name || "",
      f.notes || "",
    ]);

    const csv = [
      [`"${patch.name}"`],
      patch.show_name ? [`Show: "${patch.show_name}"`] : [],
      patch.venue ? [`Venue: "${patch.venue}"`] : [],
      [],
      headers.map((h) => `"${h}"`).join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ]
      .filter((row) => row.length > 0)
      .join("\n");

    return csv;
  },

  exportToMA3(patch: DMXPatch, fixtures: DMXFixture[]): string {
    const lines: string[] = [];

    lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
    lines.push(`<MA xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" major_vers="1" minor_vers="0">`);
    lines.push(`  <Info datetime="${new Date().toISOString()}" showfile="${patch.name}"/>`);
    lines.push(`  <Patch>`);

    fixtures.forEach((fixture, index) => {
      const fixtureId = index + 1;
      lines.push(`    <Fixture id="${fixtureId}" name="${fixture.fixture_name}" fid="${fixtureId}">`);
      lines.push(`      <Patch universe="${fixture.universe}" address="${fixture.start_address}" mode="${fixture.mode_name || 'Default'}"/>`);
      if (fixture.group_name) {
        lines.push(`      <Group name="${fixture.group_name}"/>`);
      }
      lines.push(`    </Fixture>`);
    });

    lines.push(`  </Patch>`);
    lines.push(`</MA>`);

    return lines.join("\n");
  },

  exportToETC(patch: DMXPatch, fixtures: DMXFixture[]): string {
    const lines: string[] = [];

    lines.push(`$$ETCPatch,v1.0`);
    lines.push(`# ${patch.name}`);
    if (patch.show_name) lines.push(`# Show: ${patch.show_name}`);
    if (patch.venue) lines.push(`# Venue: ${patch.venue}`);
    lines.push(`# Exported: ${new Date().toLocaleString()}`);
    lines.push(``);
    lines.push(`Channel,Fixture Type,Universe,Address,Mode,Name,Group`);

    fixtures.forEach((fixture, index) => {
      const channel = index + 1;
      lines.push(
        [
          channel,
          fixture.fixture_type || "Generic",
          fixture.universe,
          fixture.start_address,
          fixture.mode_name || "Default",
          fixture.fixture_name,
          fixture.group_name || "",
        ].join(",")
      );
    });

    return lines.join("\n");
  },

  exportToChamsys(patch: DMXPatch, fixtures: DMXFixture[]): string {
    const lines: string[] = [];

    lines.push(`Chamsys MagicQ Patch Export`);
    lines.push(`Show: ${patch.name}`);
    if (patch.show_name) lines.push(`Production: ${patch.show_name}`);
    if (patch.venue) lines.push(`Venue: ${patch.venue}`);
    lines.push(`Date: ${new Date().toLocaleString()}`);
    lines.push(``);
    lines.push(`Head#,Name,Type,Universe,Address,Channels,Mode,Group`);

    fixtures.forEach((fixture, index) => {
      const headNum = index + 1;
      lines.push(
        [
          headNum,
          fixture.fixture_name,
          fixture.fixture_type || "Generic",
          fixture.universe,
          fixture.start_address,
          fixture.channel_count,
          fixture.mode_name || "Default",
          fixture.group_name || "",
        ].join(",")
      );
    });

    return lines.join("\n");
  },

  exportToPDF(patch: DMXPatch, fixtures: DMXFixture[]): string {
    const universes = Array.from(new Set(fixtures.map((f) => f.universe))).sort(
      (a, b) => a - b
    );

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${patch.name} - DMX Patch Sheet</title>
  <style>
    @page { margin: 1cm; }
    body {
      font-family: Arial, sans-serif;
      font-size: 10pt;
      color: #000;
      background: #fff;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
    }
    .header h1 {
      margin: 0 0 5px 0;
      font-size: 18pt;
    }
    .header .info {
      font-size: 9pt;
      color: #666;
    }
    .universe-section {
      margin-bottom: 30px;
      page-break-inside: avoid;
    }
    .universe-title {
      font-size: 12pt;
      font-weight: bold;
      margin-bottom: 10px;
      padding: 5px;
      background: #f0f0f0;
      border-left: 4px solid #000;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      border: 1px solid #ccc;
      padding: 6px 8px;
      text-align: left;
    }
    th {
      background: #e0e0e0;
      font-weight: bold;
      font-size: 9pt;
    }
    td {
      font-size: 9pt;
    }
    .mono {
      font-family: 'Courier New', monospace;
    }
    .footer {
      margin-top: 30px;
      padding-top: 10px;
      border-top: 1px solid #ccc;
      font-size: 8pt;
      color: #666;
      text-align: center;
    }
    .group-badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 8pt;
      border: 1px solid;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${patch.name}</h1>
    <div class="info">
      ${patch.show_name ? `<div>Show: ${patch.show_name}</div>` : ""}
      ${patch.venue ? `<div>Venue: ${patch.venue}</div>` : ""}
      <div>Generated: ${new Date().toLocaleString()}</div>
      <div>Total Fixtures: ${fixtures.length} | Universes: ${universes.length}</div>
    </div>
  </div>

  ${universes
    .map((universeNum) => {
      const universeFixtures = fixtures
        .filter((f) => f.universe === universeNum)
        .sort((a, b) => a.start_address - b.start_address);
      const totalChannels = universeFixtures.reduce((sum, f) => sum + f.channel_count, 0);

      return `
    <div class="universe-section">
      <div class="universe-title">
        Universe ${universeNum} - ${universeFixtures.length} Fixtures, ${totalChannels} / 512 Channels (${((totalChannels / 512) * 100).toFixed(1)}%)
      </div>
      <table>
        <thead>
          <tr>
            <th style="width: 25%">Fixture Name</th>
            <th style="width: 15%">Type</th>
            <th style="width: 10%">Start</th>
            <th style="width: 10%">End</th>
            <th style="width: 8%">Channels</th>
            <th style="width: 15%">Mode</th>
            <th style="width: 17%">Group</th>
          </tr>
        </thead>
        <tbody>
          ${universeFixtures
            .map(
              (f) => `
            <tr>
              <td><strong>${f.fixture_name}</strong></td>
              <td>${f.fixture_type || "-"}</td>
              <td class="mono">${f.start_address}</td>
              <td class="mono">${f.end_address}</td>
              <td class="mono">${f.channel_count}</td>
              <td>${f.mode_name || "-"}</td>
              <td>
                ${
                  f.group_name
                    ? `<span class="group-badge" style="border-color: ${f.group_color}; color: ${f.group_color}">${f.group_name}</span>`
                    : "-"
                }
              </td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
      `;
    })
    .join("")}

  <div class="footer">
    <p>Generated by Stage Tech Pro | DMX Calculator Tool</p>
    <p>This document is for reference only. Always verify patch information before use.</p>
  </div>
</body>
</html>
    `;

    return html;
  },

  downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  export(options: ExportOptions) {
    const { format, patch, fixtures } = options;
    const timestamp = new Date().toISOString().split("T")[0];
    const baseName = `${patch.name.replace(/[^a-z0-9]/gi, "_")}_${timestamp}`;

    switch (format) {
      case "csv":
        const csv = this.exportToCSV(patch, fixtures);
        this.downloadFile(csv, `${baseName}.csv`, "text/csv");
        break;

      case "ma3":
        const ma3 = this.exportToMA3(patch, fixtures);
        this.downloadFile(ma3, `${baseName}_MA3.xml`, "application/xml");
        break;

      case "etc":
        const etc = this.exportToETC(patch, fixtures);
        this.downloadFile(etc, `${baseName}_ETC.csv`, "text/csv");
        break;

      case "chamsys":
        const chamsys = this.exportToChamsys(patch, fixtures);
        this.downloadFile(chamsys, `${baseName}_Chamsys.csv`, "text/csv");
        break;

      case "pdf":
        const html = this.exportToPDF(patch, fixtures);
        const pdfWindow = window.open("", "_blank");
        if (pdfWindow) {
          pdfWindow.document.write(html);
          pdfWindow.document.close();
          setTimeout(() => {
            pdfWindow.print();
          }, 250);
        }
        break;
    }
  },
};
