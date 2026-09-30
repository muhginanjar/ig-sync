import { InputError } from "./local-posts";

/** Turns validation errors into 400s; anything else is a real 500. */
export async function handle(fn: () => Promise<Response>) {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof InputError) return Response.json({ error: err.message }, { status: 400 });
    console.error(err);
    return Response.json({ error: "Terjadi kesalahan di server" }, { status: 500 });
  }
}
