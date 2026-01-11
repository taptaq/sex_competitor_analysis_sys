
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { parse } from "https://deno.land/std@0.224.0/json/mod.ts";
import * as path from "https://deno.land/std@0.188.0/path/mod.ts";

// Helper to load .env manually since we are in Deno script without --allow-env for dotenv sometimes
function loadEnv(filePath: string) {
  try {
    const text = Deno.readTextFileSync(filePath);
    for (const line of text.split('\n')) {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^['"]|['"]$/g, '');
        Deno.env.set(key, value);
      }
    }
  } catch (e) {
    console.log("Could not load .env file", e);
  }
}

// Load .env
const envPath = path.resolve(Deno.cwd(), '.env');
loadEnv(envPath);

const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL');
const supabaseKey = Deno.env.get('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  Deno.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const BASE_DIR = Deno.cwd();

async function migrateCompetitorsAndProducts() {
  console.log('Migrating Competitors and Products...');
  const dataPath = path.join(BASE_DIR, 'competitors.json');
  
  let competitorsData;
  try {
     const text = await Deno.readTextFile(dataPath);
     competitorsData = JSON.parse(text);
  } catch (e) {
      console.log('No competitors.json found or invalid.');
      return;
  }


  for (const comp of competitorsData) {
    // 1. Insert Competitor
    const { data: compData, error: compError } = await supabase
      .from('competitors')
      .upsert({
        id: comp.id, // Keep existing ID if uuid, else might fail if not uuid. 
        // NOTE: Existing IDs are likely strings "comp-123". Postgres UUID requires UUID format.
        // We will generate NEW UUIDs and map them.
        name: comp.name,
        domain: comp.domain,
        country: comp.country,
        founded_date: comp.foundedDate,
        description: comp.description,
        focus: comp.focus,
        philosophy: comp.philosophy,
        sentiment: comp.sentiment,
        is_domestic: comp.isDomestic
      }, { onConflict: 'name' }) // Use name as conflict target if possible, or just insert
      .select('id')
      .single();

    if (compError) {
      console.error(`Error inserting competitor ${comp.name}:`, compError);
      continue; // Skip products if competitor fails
    }

    const newCompId = compData.id;

    // 2. Insert Products
    if (comp.products && comp.products.length > 0) {
      const productsPayload = comp.products.map((p: any) => ({
        // id: p.id, // Generate new UUID
        competitor_id: newCompId,
        name: p.name,
        price: p.price,
        category: p.category,
        tags: p.tags,
        link: p.link,
        image: p.image,
        sales: p.sales,
        launch_date: p.launchDate,
        gender: p.gender,
        specs: p.specs,
        price_history: p.priceHistory,
        analysis: p.analysis,
        reviews: p.reviews
      }));

      const { error: prodError } = await supabase.from('products').insert(productsPayload);
      if (prodError) console.error(`Error inserting products for ${comp.name}:`, prodError);
    }
  }
  console.log('Competitors migration finished.');
}

async function run() {
    await migrateCompetitorsAndProducts();
    // Add logic for history/reports/favorites if needed
}

run();
