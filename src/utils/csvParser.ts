import type { Transaction } from "../types/finance";

function normalizeHeader(header: string) {
  return header
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function splitCsvLine(line: string) {
  const values: string[] = [];
  let currentValue = "";
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (
      character === '"' &&
      insideQuotes &&
      nextCharacter === '"'
    ) {
      currentValue += '"';
      index += 1;
      continue;
    }

    if (character === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (character === "," && !insideQuotes) {
      values.push(currentValue.trim());
      currentValue = "";
      continue;
    }

    currentValue += character;
  }

  values.push(currentValue.trim());

  return values;
}

function parseAmount(value: string) {
  const cleanedValue = value
    .replace(/[₹$£€,\s]/g, "")
    .replace(/[()]/g, "");

  const amount = Number(cleanedValue);

  if (!Number.isFinite(amount)) {
    return null;
  }

  return value.includes("(")
    ? -Math.abs(amount)
    : amount;
}

function parseDate(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const isoDatePattern =
    /^\d{4}-\d{2}-\d{2}$/;

  if (isoDatePattern.test(trimmedValue)) {
    return trimmedValue;
  }

  const dayMonthYearPattern =
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/;

  const match = trimmedValue.match(
    dayMonthYearPattern
  );

  if (match) {
    const [, day, month, year] = match;

    return `${year}-${month.padStart(
      2,
      "0"
    )}-${day.padStart(2, "0")}`;
  }

  const parsedDate = new Date(trimmedValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate.toISOString().slice(0, 10);
}

function findColumn(
  headers: string[],
  aliases: string[]
) {
  return headers.findIndex((header) =>
    aliases.includes(normalizeHeader(header))
  );
}

function getPaymentMethod(
  value: string
): Transaction["paymentMethod"] {
  const normalizedValue = normalizeHeader(value);

  if (
    normalizedValue.includes("cash")
  ) {
    return "Cash" as Transaction["paymentMethod"];
  }

  if (
    normalizedValue.includes("card") ||
    normalizedValue.includes("creditcard") ||
    normalizedValue.includes("debitcard")
  ) {
    return "Card" as Transaction["paymentMethod"];
  }

  if (
    normalizedValue.includes("upi")
  ) {
    return "UPI" as Transaction["paymentMethod"];
  }

  if (
    normalizedValue.includes("bank") ||
    normalizedValue.includes("transfer") ||
    normalizedValue.includes("netbanking")
  ) {
    return "Bank Transfer" as Transaction["paymentMethod"];
  }

  return "Other" as Transaction["paymentMethod"];
}

export function parseTransactionsCsv(
  csvText: string
): Transaction[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error(
      "The CSV file must contain a header row and at least one transaction."
    );
  }

  const headers = splitCsvLine(lines[0]);

  const dateIndex = findColumn(headers, [
    "date",
    "transactiondate",
    "valuedate",
  ]);

  const descriptionIndex = findColumn(
    headers,
    [
      "description",
      "details",
      "narration",
      "merchant",
      "title",
      "name",
    ]
  );

  const amountIndex = findColumn(headers, [
    "amount",
    "transactionamount",
    "value",
  ]);

  const debitIndex = findColumn(headers, [
    "debit",
    "withdrawal",
    "expense",
    "debitamount",
  ]);

  const creditIndex = findColumn(headers, [
    "credit",
    "deposit",
    "income",
    "creditamount",
  ]);

  const categoryIndex = findColumn(headers, [
    "category",
    "typecategory",
  ]);

  const typeIndex = findColumn(headers, [
    "type",
    "transactiontype",
  ]);

  const paymentMethodIndex = findColumn(
    headers,
    [
      "paymentmethod",
      "paymentmode",
      "mode",
      "method",
    ]
  );

  if (dateIndex === -1) {
    throw new Error(
      'Could not find a "Date" column in the CSV file.'
    );
  }

  if (
    amountIndex === -1 &&
    debitIndex === -1 &&
    creditIndex === -1
  ) {
    throw new Error(
      'Could not find an "Amount", "Debit", or "Credit" column.'
    );
  }

  const transactions: Transaction[] = [];

  for (
    let index = 1;
    index < lines.length;
    index += 1
  ) {
    const values = splitCsvLine(lines[index]);

    const date = parseDate(
      values[dateIndex] ?? ""
    );

    if (!date) {
      continue;
    }

    let amount = 0;

    let type: Transaction["type"] =
      "expense";

    if (amountIndex !== -1) {
      const parsedAmount = parseAmount(
        values[amountIndex] ?? ""
      );

      if (
        parsedAmount === null ||
        parsedAmount === 0
      ) {
        continue;
      }

      amount = Math.abs(parsedAmount);

      const rawType =
        typeIndex !== -1
          ? normalizeHeader(
              values[typeIndex] ?? ""
            )
          : "";

      if (
        rawType.includes("income") ||
        rawType.includes("credit") ||
        rawType.includes("deposit")
      ) {
        type = "income";
      } else if (
        rawType.includes("expense") ||
        rawType.includes("debit") ||
        rawType.includes("withdrawal")
      ) {
        type = "expense";
      } else {
        type =
          parsedAmount < 0
            ? "expense"
            : "income";
      }
    } else {
      const debitAmount =
        debitIndex !== -1
          ? parseAmount(
              values[debitIndex] ?? ""
            )
          : null;

      const creditAmount =
        creditIndex !== -1
          ? parseAmount(
              values[creditIndex] ?? ""
            )
          : null;

      if (
        debitAmount !== null &&
        debitAmount !== 0
      ) {
        amount = Math.abs(debitAmount);
        type = "expense";
      } else if (
        creditAmount !== null &&
        creditAmount !== 0
      ) {
        amount = Math.abs(creditAmount);
        type = "income";
      } else {
        continue;
      }
    }

    const description =
      descriptionIndex !== -1
        ? values[
            descriptionIndex
          ]?.trim() ?? ""
        : "";

    const category =
      categoryIndex !== -1
        ? values[
            categoryIndex
          ]?.trim() ?? ""
        : "";

    const paymentMethodValue =
      paymentMethodIndex !== -1
        ? values[
            paymentMethodIndex
          ]?.trim() ?? ""
        : "";

const now = new Date().toISOString();

transactions.push({
  id: crypto.randomUUID(),
  type,
  date,

  merchant:
    description ||
    (type === "income"
      ? "Imported income"
      : "Imported expense"),

  description:
    description || "Imported from CSV",

  category:
    category ||
    (type === "income"
      ? "Income"
      : "Other"),

  amount,

  paymentMethod: getPaymentMethod(
    paymentMethodValue
  ),

  notes: "Imported from CSV",
  createdAt: now,
  updatedAt: now,
});;
  }

  if (transactions.length === 0) {
    throw new Error(
      "No valid transactions were found in the CSV file."
    );
  }

  return transactions;
}