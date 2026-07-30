const parseCsv = (content) => {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  const normalizedContent = String(content || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let index = 0; index < normalizedContent.length; index += 1) {
    const character = normalizedContent[index];
    if (character === '"') {
      if (quoted && normalizedContent[index + 1] === '"') {
        value += '"';
        index += 1;
      } else quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(value.trim());
      value = "";
    } else if ((character === "\n") && !quoted) {
      row.push(value.trim());
      if (row.some((cell) => String(cell).trim() !== "")) rows.push(row);
      row = [];
      value = "";
    } else value += character;
  }

  if (quoted) throw new Error("The CSV contains an unclosed quoted value.");
  row.push(value.trim());
  if (row.some((cell) => String(cell).trim() !== "")) rows.push(row);
  if (rows.length < 2) throw new Error("The CSV must contain a header row and at least one data row.");

  const headers = rows[0].map((header, index) => (header || `column_${index + 1}`).replace(/^\uFEFF/, ""));
  if (new Set(headers.map((header) => header.toLowerCase())).size !== headers.length) {
    throw new Error("CSV column names must be unique.");
  }

  const data = rows.slice(1)
    .map((cells) => Object.fromEntries(headers.map((header, index) => [header, cells[index] || ""])))
    .filter((record) => Object.values(record).some((value) => String(value).trim() !== ""));

  const deduped = data.filter((record, index, all) => all.findIndex((entry) => JSON.stringify(entry) === JSON.stringify(record)) === index);
  if (!deduped.length) throw new Error("The CSV contains no valid data rows.");

  return { headers, rows: deduped };
};

module.exports = parseCsv;
