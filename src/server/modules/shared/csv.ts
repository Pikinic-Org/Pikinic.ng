import { NextResponse } from "next/server";

type CsvValue = string | number | boolean | Date | null | undefined;

// CSV cells starting with = + - @ are executed as formulas by Excel/Sheets, so
// someone who typed one into a free-text field could attack whoever opens the
// export. Prefixing a quote neutralises it.
function csvCell(value: CsvValue) {
  let text = value instanceof Date ? value.toISOString() : String(value ?? "");
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

// The leading BOM makes Excel read the file as UTF-8 (names, ₦).
export function csvResponse(filename: string, header: string[], rows: CsvValue[][]) {
  const lines = [header, ...rows].map((row) => row.map(csvCell).join(","));
  return new NextResponse("﻿" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
