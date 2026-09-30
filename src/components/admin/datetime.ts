// <input type="datetime-local"> works in the phone's local time, without a zone.

const pad = (n: number) => String(n).padStart(2, "0");

export function toLocalInput(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

/** Local input value → ISO (UTC) for the API. */
export const fromLocalInput = (value: string) => new Date(value).toISOString();
