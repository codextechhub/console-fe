/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Splits an array into subarrays, each containing up to two elements.
 *
 * @typeParam T - The type of elements in the input array.
 * @param arr - The array to be split into pairs.
 * @returns An array of subarrays, each containing up to two elements from the original array.
 */
// used to split the array into pairs of 2
export const chunkIntoPairs = <T>(arr: T[]): T[][] => {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += 2) {
    result.push(arr.slice(i, i + 2));
  }
  return result;
};

export function capitalizeFirstLetter(sentence: string) {
  if (!sentence) return "";
  return sentence?.charAt(0)?.toUpperCase() + sentence?.slice(1);
}

export function returnInitial(name: string) {
  if (name) {
    const i = name?.split(" ");
    if (i.length > 1) {
      return i[0]?.slice(0, 1).toUpperCase() + i[1]?.slice(0, 1).toUpperCase();
    } else {
      return i[0]?.slice(0, 1).toUpperCase() + i[0]?.slice(1, 2).toUpperCase();
    }
  } else {
    return "";
  }
}

export const isImageFile = (filename: string) => {
  const imageExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".bmp",
    ".tiff",
    ".webp",
    ".svg",
  ];
  return imageExtensions.some((ext) => filename?.toLowerCase()?.endsWith(ext));
};

export const formatRelativeDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";

  const day = date.getDate();
  const suffix =
    day % 10 === 1 && day !== 11
      ? "st"
      : day % 10 === 2 && day !== 12
        ? "nd"
        : day % 10 === 3 && day !== 13
          ? "rd"
          : "th";
  const month = date.toLocaleString("en-US", { month: "long" });
  const year = date.getFullYear();
  return `${day}${suffix} ${month} ${year}`;
};

export const formatDate = (timestamp: Date): string => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Format time as MM:SS
export const formatTimeMMSS = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

export function formatStartedTime(isoString:string) {
  const date = new Date(isoString);

  // Get parts
  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "short" });
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "pm" : "am";

  hours = hours % 12 || 12; // convert 0 to 12-hour format

  return `${day} ${month} ${year}, ${hours}:${minutes}${ampm}`;
}

/**
 * Truncates a string to a specified maximum length and appends an ellipsis ('...').
 * If the string's length is already less than or equal to the maximum length,
 * it returns the original string without any changes.
 *
 * @param str The string to truncate.
 * @param maxLength The maximum allowed length of the string before truncation.
 * @returns The truncated string with an ellipsis, or the original string.
 */
export const truncateString = (str: string, maxLength: number): string => {
  // Check if the string's length is greater than the maximum allowed length.
  if (str.length > maxLength) {
    // If it is, truncate the string using substring and add "..."
    return str.substring(0, maxLength) + "...";
  }

  // If the string is within the allowed length, return it as is.
  return str;
};

/**
 * Generates a URL query string from a given object of parameters.
 *
 * Filters out parameters with `undefined` or `null` or empty string values. If a parameter value is an array,
 * it generates multiple key-value pairs for each element in the array.
 *
 * @param params - An object containing key-value pairs to be converted into a query string. Values can be strings, numbers, or arrays of these types.
 * @returns The generated query string, starting with '?' if there are parameters, or an empty string if no valid parameters are provided.
 *
 * @example
 * generateQueryString({ foo: "bar", baz: [1, 2], empty: undefined });
 * // Returns: "?foo=bar&baz=1&baz=2"
 */
export function generateQueryString(params: Record<string, string | number>): string {
  const query = Object.entries(params)
    .filter(
      ([, value]) => value !== undefined && value !== null && value !== ""
    ) // filter out undefined/null
    .map(([key, value]) =>
      Array.isArray(value)
        ? value
            .map(
              (val) => `${encodeURIComponent(key)}=${encodeURIComponent(val)}`
            )
            .join("&")
        : `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    )
    .join("&");

  return query ? `?${query}` : "";
}

// Helper function to check if value is a URL
export const isURL = (value: any): value is string => {
  return (
    typeof value === "string" &&
    (value.startsWith("http") ||
      value.startsWith("https") ||
      value.startsWith("docs") ||
      value.startsWith("image") ||
      value.startsWith("videos"))
  );
};
 
const getCurrencySymbol = (param: string) => {
  const nairaSymbol = "\u{020A6}";
  const upperParam = String(param).toUpperCase();
  return upperParam === "NGN" || upperParam === "NAIRA"
    ? nairaSymbol
    : upperParam === "USD" || upperParam === "DOLLAR"
    ? "$"
    : upperParam === "EUR" || upperParam === "EURO"
    ? "€"
    : upperParam === "ZAR"
    ? "R"
    : upperParam === "KES"
    ? "KSh"
    : upperParam === "CAD"
    ? "$"
    : upperParam === "GHS"
    ? "₵"
    : upperParam === "GBP" || upperParam === "POUNDS" || upperParam === "POUND"
    ? "£"
    : param;
};

interface FormatOptions {
  hideDecimal?: boolean;
  hideSymbol?: boolean;
  convertToNumber?: boolean;
  symbol?: string;
  removeLeadingZero?: boolean;
  numberAbbreviate?: boolean;
}

export const NumberFormat = (
  number: number | string | null | undefined,
  options?: FormatOptions
): string => {
  const symbol = getCurrencySymbol(options?.symbol || "NGN");
  const hideDecimal = options?.hideDecimal || false;
  const hideSymbol = options?.hideSymbol || false;
  const convertToNumber = options?.convertToNumber || false;
  const removeLeadingZero = options?.removeLeadingZero || false;
  const numberAbbreviate = options?.numberAbbreviate || false;
  if (number !== null && number !== undefined) {
    // Remove symbols and non-numeric characters
    const numericValue: string = number.toString().replace(/[^0-9.]/g, "");
    // Separate the integer and decimal parts
    let [integerPart, decimalPart] = numericValue.split(".");
    if (removeLeadingZero) {
      // Remove leading zeros if more than one leading zero
      if (/^0{2,}/.test(integerPart)) {
        integerPart = integerPart.replace(/^0+/, "");
      }
    }
    if (convertToNumber) {
      // Return number without thousand formatting and without symbol
      const val = decimalPart ? `${integerPart}.${decimalPart}` : integerPart;
      return val;
    }
    const formattedValue = Number(
      integerPart + (decimalPart ? "." + decimalPart : "")
    );
    if (numberAbbreviate) {
      const formatted = formatNumberWithSymbols(formattedValue);
      return hideSymbol ? formatted : `${symbol}${formatted}`;
    }
    // Format the integer part with thousand separator
    integerPart = Number(integerPart).toLocaleString();
    // Handle the decimal part
    if (!hideDecimal) {
      if (decimalPart) {
        // Convert the decimal part back to a number and round to two significant figures
        decimalPart = Number("0." + decimalPart)
          .toPrecision(2)
          .split(".")[1];
        // Remove trailing zeros from the decimal part
        decimalPart = decimalPart?.replace(/0+$/, "") || "";
      }
      const val = decimalPart
        ? `${integerPart}${decimalPart ? "." : ""}${decimalPart}`
        : `${integerPart}.00`;
      return hideSymbol ? val : `${symbol}${val}`;
    } else {
      return hideSymbol ? integerPart : `${symbol}${integerPart}`;
    }
  } else {
    return hideSymbol ? `0.00` : `${symbol}0.00`;
  }
};

const formatNumberWithSymbols = (number: number) => {
  const formats = [
    { value: 1, symbol: "" },
    { value: 1e3, symbol: "k" },
    { value: 1e6, symbol: "M" },
    { value: 1e9, symbol: "B" },
    { value: 1e12, symbol: "T" },
    { value: 1e15, symbol: "Q" },
    { value: 1e18, symbol: "QT" },
    { value: 1e21, symbol: "QQ" },
  ];
  const format = formats
    .slice()
    .reverse()
    .find((fmt) => number >= fmt.value);
  if (format) {
    return (
      (number / format.value).toFixed(2).replace(/\.00$/, "") + format.symbol
    );
  }
  return number.toString();
};

export function getVimeoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const paths = parsed.pathname.split("/").filter(Boolean);

    // Video ID is usually the last numeric part in the path
    const id = paths.reverse().find((part) => /^\d+$/.test(part));

    return id || "";
  } catch {
    return ""; // invalid URL
  }
}

export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0s";

  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];

  if (hrs > 0) parts.push(`${hrs}h`);
  if (mins > 0) parts.push(`${mins}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(" ");
}

export type DateType = "daily" | "weekly" | "monthly"

export function getDateDetails(dateString: string, type: DateType): string {
  const date = new Date(dateString)

  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ]

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ]

  const day = days[date.getDay()]
  const month = months[date.getMonth()]

  // Calculate week of the month
  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
  const dayOfMonth = date.getDate()
  const adjustedDate = dayOfMonth + firstDayOfMonth.getDay()
  const weekNumber = Math.ceil(adjustedDate / 7)
  const week = `Week ${weekNumber}`

  if (type === "daily") return day
  if (type === "weekly") return week
  if (type === "monthly") return month

  return ""
}


export function assignColors<T>(items: T[]): (T & { fill: string })[] {
  const colors = ["#F8C4B4", "#E5EBB2", "#FF8787"]

  return items.map((item, index) => ({
    ...item,
    fill: colors[index % colors.length],
  }))
}

export function daysRemaining(targetDateString:string) {
  const targetDate = new Date(targetDateString);
  const today = new Date();

  // Convert both to midnight to avoid time–of–day issues
  targetDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffMs = targetDate.getTime() - today.getTime(); 
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
   return `${diffDays < 0 ? 0 : diffDays} day${diffDays > 1 ? "s" : ""} remaining`;
}
