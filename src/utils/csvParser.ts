import type { Transaction } from "../types/finance";

function normalizeHeader(header: string) {
  return header
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_./\\-]+/g, "");
}

function splitCsvLine(line: string) {
  const values: string[] = [];
  let currentValue = "";
  let insideQuotes = false;

  for (
    let index = 0;
    index < line.length;
    index += 1
  ) {
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

    if (
      character === "," &&
      !insideQuotes
    ) {
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
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const isNegative =
    trimmedValue.includes("(") ||
    trimmedValue.startsWith("-");

  const cleanedValue = trimmedValue
    .replace(/[₹$£€,\s]/g, "")
    .replace(/[()]/g, "");

  const amount = Number(cleanedValue);

  if (!Number.isFinite(amount)) {
    return null;
  }

  return isNegative
    ? -Math.abs(amount)
    : amount;
}

function parseDate(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  // Supports YYYY-MM-DD and YYYY-MM-DD HH:mm:ss
  const isoDateMatch = trimmedValue.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/
  );

  if (isoDateMatch) {
    const [, year, month, day] =
      isoDateMatch;

    return `${year}-${month.padStart(
      2,
      "0"
    )}-${day.padStart(2, "0")}`;
  }

  // Supports DD-MM-YYYY, DD/MM/YYYY,
  // and dates containing time.
  const dayMonthYearMatch =
    trimmedValue.match(
      /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\s+.*)?$/
    );

  if (dayMonthYearMatch) {
    const [, day, month, year] =
      dayMonthYearMatch;

    const dayNumber = Number(day);
    const monthNumber = Number(month);

    if (
      dayNumber < 1 ||
      dayNumber > 31 ||
      monthNumber < 1 ||
      monthNumber > 12
    ) {
      return null;
    }

    return `${year}-${month.padStart(
      2,
      "0"
    )}-${day.padStart(2, "0")}`;
  }

  // Supports dates such as 01 Jul 2026.
  const parsedDate = new Date(trimmedValue);

  if (
    Number.isNaN(parsedDate.getTime())
  ) {
    return null;
  }

  return parsedDate
    .toISOString()
    .slice(0, 10);
}

function findColumn(
  headers: string[],
  aliases: string[]
) {
  const normalizedAliases =
    aliases.map(normalizeHeader);

  return headers.findIndex((header) =>
    normalizedAliases.includes(
      normalizeHeader(header)
    )
  );
}

function findHeaderRowIndex(
  lines: string[]
) {
  const dateAliases = [
    "date",
    "transaction date",
    "transactiondate",
    "txn date",
    "txndate",
    "value date",
    "valuedate",
    "posting date",
    "postingdate",
    "posted date",
    "posteddate",
  ];

  const amountAliases = [
    "amount",
    "transaction amount",
    "transactionamount",
    "debit",
    "credit",
    "withdrawal",
    "deposit",
    "debit amount",
    "debitamount",
    "credit amount",
    "creditamount",
  ];

  for (
    let index = 0;
    index < lines.length;
    index += 1
  ) {
    const possibleHeaders =
      splitCsvLine(lines[index]);

    const hasDateColumn =
      findColumn(
        possibleHeaders,
        dateAliases
      ) !== -1;

    const hasAmountColumn =
      findColumn(
        possibleHeaders,
        amountAliases
      ) !== -1;

    if (
      hasDateColumn &&
      hasAmountColumn
    ) {
      return index;
    }
  }

  return -1;
}

function getPaymentMethod(
  value: string,
  description: string
): Transaction["paymentMethod"] {
  const normalizedValue =
    normalizeHeader(
      `${value} ${description}`
    );

  if (
    normalizedValue.includes("cash") ||
    normalizedValue.includes("atm")
  ) {
    return "Cash" as Transaction["paymentMethod"];
  }

  if (
    normalizedValue.includes("card") ||
    normalizedValue.includes(
      "creditcard"
    ) ||
    normalizedValue.includes(
      "debitcard"
    ) ||
    normalizedValue.includes("pos")
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
    normalizedValue.includes(
      "transfer"
    ) ||
    normalizedValue.includes(
      "netbanking"
    ) ||
    normalizedValue.includes("neft") ||
    normalizedValue.includes("imps") ||
    normalizedValue.includes("rtgs") ||
    normalizedValue.includes("nach")
  ) {
    return "Bank Transfer" as Transaction["paymentMethod"];
  }

  return "Other" as Transaction["paymentMethod"];
}

function detectTransactionType(
  rawTypeValue: string,
  parsedAmount: number
): Transaction["type"] {
  const normalizedType =
    normalizeHeader(rawTypeValue);

  if (
    normalizedType === "cr" ||
    normalizedType.includes("credit") ||
    normalizedType.includes("income") ||
    normalizedType.includes("deposit")
  ) {
    return "income";
  }

  if (
    normalizedType === "dr" ||
    normalizedType.includes("debit") ||
    normalizedType.includes("expense") ||
    normalizedType.includes(
      "withdrawal"
    )
  ) {
    return "expense";
  }

  return parsedAmount < 0
    ? "expense"
    : "income";
}

export function parseTransactionsCsv(
  csvText: string
): Transaction[] {
  const lines = csvText
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error(
      "The CSV file must contain a header row and at least one transaction."
    );
  }

  // Bank statements can contain customer and
  // account information before the transaction table.
  const headerRowIndex =
    findHeaderRowIndex(lines);

  if (headerRowIndex === -1) {
    throw new Error(
      'Could not find a transaction table containing a "Date" or "Transaction Date" column.'
    );
  }

  const headers = splitCsvLine(
    lines[headerRowIndex]
  );

  const dateIndex = findColumn(
    headers,
    [
      "date",
      "transaction date",
      "transactiondate",
      "txn date",
      "txndate",
      "value date",
      "valuedate",
      "posting date",
      "postingdate",
      "posted date",
      "posteddate",
    ]
  );

  const descriptionIndex =
    findColumn(headers, [
      "description",
      "transaction description",
      "transactiondescription",
      "details",
      "transaction details",
      "transactiondetails",
      "narration",
      "remarks",
      "merchant",
      "title",
      "name",
      "particulars",
    ]);

  const amountIndex = findColumn(
    headers,
    [
      "amount",
      "transaction amount",
      "transactionamount",
      "value",
    ]
  );

  const debitIndex = findColumn(
    headers,
    [
      "debit",
      "withdrawal",
      "expense",
      "debit amount",
      "debitamount",
      "withdrawal amount",
      "withdrawalamount",
    ]
  );

  const creditIndex = findColumn(
    headers,
    [
      "credit",
      "deposit",
      "income",
      "credit amount",
      "creditamount",
      "deposit amount",
      "depositamount",
    ]
  );

  const categoryIndex = findColumn(
    headers,
    [
      "category",
      "type category",
      "typecategory",
    ]
  );

  const typeIndex = findColumn(
    headers,
    [
      "type",
      "transaction type",
      "transactiontype",
      "dr cr",
      "dr/cr",
      "drcr",
      "debit credit",
      "debitcredit",
      "credit debit",
      "creditdebit",
    ]
  );

  const paymentMethodIndex =
    findColumn(headers, [
      "payment method",
      "paymentmethod",
      "payment mode",
      "paymentmode",
      "mode",
      "method",
    ]);

  if (dateIndex === -1) {
    throw new Error(
      'Could not find a "Date" or "Transaction Date" column in the CSV file.'
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
    let index = headerRowIndex + 1;
    index < lines.length;
    index += 1
  ) {
    const values = splitCsvLine(
      lines[index]
    );

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

      const rawTypeValue =
        typeIndex !== -1
          ? values[typeIndex] ?? ""
          : "";

      type = detectTransactionType(
        rawTypeValue,
        parsedAmount
      );
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

    const now =
      new Date().toISOString();

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
        description ||
        "Imported from CSV",

      category:
        category ||
        (type === "income"
          ? "Income"
          : "Other"),

      amount,

      paymentMethod:
        getPaymentMethod(
          paymentMethodValue,
          description
        ),

      notes: "Imported from CSV",
      createdAt: now,
      updatedAt: now,
    });
  }

  if (transactions.length === 0) {
    throw new Error(
      "No valid transactions were found. Check the date and amount values in the CSV file."
    );
  }

  return transactions;
}