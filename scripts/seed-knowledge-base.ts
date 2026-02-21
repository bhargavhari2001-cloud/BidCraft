/**
 * Seed script for BidCraft Knowledge Base
 *
 * Run: npx tsx scripts/seed-knowledge-base.ts
 *
 * Prerequisites:
 *   - VOYAGE_API_KEY set in .env.local
 *   - NEXT_PUBLIC_SUPABASE_URL set in .env.local
 *   - SUPABASE_SERVICE_ROLE_KEY set in .env.local
 *   - SQL migration already run in Supabase
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { seedEntries } from "../src/data/seedKnowledgeBase";

// Load .env.local manually (no dotenv dependency needed)
function loadEnvLocal() {
  try {
    const envPath = resolve(process.cwd(), ".env.local");
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    console.warn("Could not read .env.local — using existing env vars");
  }
}

loadEnvLocal();

const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings";
const BATCH_SIZE = 20;

async function generateEmbeddings(
  texts: string[]
): Promise<number[][]> {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) throw new Error("VOYAGE_API_KEY not set in .env.local");

  const response = await fetch(VOYAGE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "voyage-3-lite",
      input: texts,
      input_type: "document",
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Voyage AI error (${response.status}): ${err}`);
  }

  const data = await response.json();
  return data.data.map((item: { embedding: number[] }) => item.embedding);
}

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

async function seed() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local"
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log(`\n🚀 Seeding ${seedEntries.length} knowledge base entries...\n`);

  // Check existing entries
  const { count } = await supabase
    .from("knowledge_base")
    .select("*", { count: "exact", head: true });

  if (count && count > 0) {
    console.log(`⚠️  Knowledge base already has ${count} entries.`);
    console.log("   To re-seed, first clear the table:");
    console.log("   DELETE FROM knowledge_base;\n");

    const args = process.argv.slice(2);
    if (!args.includes("--force")) {
      console.log('   Pass --force to seed anyway.\n');
      return;
    }
    console.log("   --force flag detected, proceeding...\n");
  }

  const batches = chunk(seedEntries, BATCH_SIZE);
  let totalInserted = 0;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const batchNum = i + 1;
    console.log(
      `📦 Batch ${batchNum}/${batches.length}: Generating embeddings for ${batch.length} entries...`
    );

    // Generate embeddings for the batch
    const texts = batch.map((e) => `${e.title}\n${e.content}`);
    const embeddings = await generateEmbeddings(texts);

    // Prepare rows for Supabase
    const rows = batch.map((entry, j) => ({
      title: entry.title,
      category: entry.category,
      content: entry.content,
      tags: entry.tags,
      embedding: JSON.stringify(embeddings[j]),
    }));

    // Insert into Supabase
    const { error } = await supabase.from("knowledge_base").insert(rows);

    if (error) {
      console.error(`   ❌ Insert error for batch ${batchNum}:`, error.message);
    } else {
      totalInserted += batch.length;
      console.log(
        `   ✅ Inserted ${batch.length} entries (${totalInserted}/${seedEntries.length} total)`
      );
    }

    // Small delay between batches to respect rate limits
    if (i < batches.length - 1) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  console.log(`\n🎉 Seeding complete! ${totalInserted} entries inserted.`);

  // Show category breakdown
  const catCounts: Record<string, number> = {};
  seedEntries.forEach((e) => {
    catCounts[e.category] = (catCounts[e.category] || 0) + 1;
  });
  console.log("\n📊 Category breakdown:");
  Object.entries(catCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count}`);
    });
  console.log("");
}

seed().catch((err) => {
  console.error("\n❌ Seed script failed:", err.message);
  process.exit(1);
});
