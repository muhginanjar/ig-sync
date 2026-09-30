import "dotenv/config";
import { migrateDb } from "@/db";

migrateDb();
console.log("Database siap.");
