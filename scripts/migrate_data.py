import os
import json
import asyncio
from dotenv import load_dotenv
from supabase import create_client, Client

# Load env
load_dotenv('.env')

url = os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("VITE_SUPABASE_ANON_KEY")

if not url or not key:
    print("Error: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY")
    exit(1)

supabase: Client = create_client(url, key)

def migrate_competitors():
    print("Migrating competitors.json...")
    try:
        with open('competitors.json', 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        print("competitors.json not found.")
        return

    for comp in data:
        # 1. Insert Competitor
        comp_payload = {
            "id": comp.get("id"), # Try to keep ID if it's UUID, else Supabase might error if column is UUID type and we allow text.
            # Schema defined ID as UUID default uuid_generate_v4().
            # If local ID is "comp-178...", it's NOT a UUID. Postgres will raise error if we try to insert text into UUID column.
            # SO: We must let Supabase generate new ID, or generate UUIDs here.
            # Strategy: Let Supabase generate ID, but we must map old ID to new ID for products.
            "name": comp.get("name"),
            "domain": comp.get("domain"),
            "country": comp.get("country"),
            "founded_date": comp.get("foundedDate"),
            "description": comp.get("description"),
            "focus": comp.get("focus") if comp.get("focus") in ['Male', 'Female', 'Unisex'] else 'Unisex',
            "philosophy": comp.get("philosophy"),
            "sentiment": comp.get("sentiment"),
            "is_domestic": comp.get("isDomestic"),
            "brand_characteristic_analysis": comp.get("brandCharacteristicAnalysis"),
            "qa_analysis": comp.get("qaAnalysis")
        }
        
        # Remove ID if it's not a valid UUID (simple check: length 36 and contain dashes)
        if comp_payload["id"] and (len(comp_payload["id"]) != 36 or "comp-" in comp_payload["id"]):
             del comp_payload["id"]

        try:
            # Check if competitor exists by name
            res = supabase.table("competitors").select("id").eq("name", comp_payload["name"]).execute()
            
            new_comp_id = None
            if res.data and len(res.data) > 0:
                new_comp_id = res.data[0]['id']
                new_comp_id = res.data[0]['id']
                print(f"Competitor {comp['name']} already exists -> {new_comp_id}. Updating analysis fields...")
                supabase.table("competitors").update({
                    "brand_characteristic_analysis": comp_payload["brand_characteristic_analysis"],
                    "qa_analysis": comp_payload["qa_analysis"]
                }).eq("id", new_comp_id).execute()
            else:
                # Insert
                res_insert = supabase.table("competitors").insert(comp_payload).execute()
                if res_insert.data:
                    new_comp_id = res_insert.data[0]['id']
                    print(f"Inserted {comp['name']} -> {new_comp_id}")
                else:
                    print(f"Failed to insert {comp['name']}")
                    continue
            
            # 2. Insert Products
            products = comp.get("products", [])
            if products:
                prod_payloads = []
                for p in products:
                    prod_item = {
                        "competitor_id": new_comp_id,
                        "name": p.get("name"),
                        "price": p.get("price"),
                        "category": p.get("category"),
                        "tags": p.get("tags"),
                        "link": p.get("link"),
                        "image": p.get("image"),
                        "sales": p.get("sales"),
                        "launch_date": p.get("launchDate"),
                        "gender": p.get("gender"),
                        "specs": p.get("specs"),
                        "price_history": p.get("priceHistory"),
                        "analysis": p.get("analysis"),
                        "price_analysis": p.get("priceAnalysis"),
                        "reviews": p.get("reviews")
                    }
                    prod_payloads.append(prod_item)
                
                if prod_payloads:
                    # Upsert products to ensure fields are updated
                    # But product IDs in supabase were generated. We need to match by name+comp_id or clear and re-add?
                    # Clearing is dangerous for cascade deletes (favorites, deep reports).
                    # Best: Find product by name and update.
                    
                    for prod_payload in prod_payloads:
                        # Check exist
                        exist_prod = supabase.table("products").select("id").eq("competitor_id", new_comp_id).eq("name", prod_payload["name"]).execute()
                        if exist_prod.data:
                            # Update
                            pid = exist_prod.data[0]['id']
                            supabase.table("products").update(prod_payload).eq("id", pid).execute()
                            # print(f"Updated product {prod_payload['name']}")
                        else:
                            # Insert
                            supabase.table("products").insert(prod_payload).execute()
        
        except Exception as e:
            print(f"Error migrating {comp['name']}: {e}")

    migrate_favorites()
    migrate_history()

def migrate_favorites():
    print("\nMigrating favorites.json...")
    try:
        with open('favorites.json', 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        print("favorites.json not found.")
        return

    count = 0
    for item in data:
        # We need to find the new product_id in Supabase
        # Favorites structure: item['product']['name'], item['competitorName']
        
        prod_name = item.get('product', {}).get('name')
        comp_name = item.get('competitorName')
        
        if not prod_name or not comp_name:
            print(f"Skipping favorite: Missing name or competitor info")
            continue

        # 1. Find Competitor ID
        # Note: competitorName in favorites might slightly differ or match exact 'name' in competitors table?
        # Let's assume exact match usually found in item['competitorName'] or item['product']['competitorId'] (which is old ID)
        # Better to rely on name.
        
        # Check specific edge case: 'xiaoguaishou' -> '小怪兽', 'datang' -> '大人糖'
        # In favorites.json we saw: "competitorName": "大人糖" which is good.
        
        res_comp = supabase.table("competitors").select("id").eq("name", comp_name).execute()
        if not res_comp.data:
            print(f"Could not find competitor '{comp_name}' for favorite '{prod_name}'")
            continue
        
        comp_id = res_comp.data[0]['id']
        
        # 2. Find Product ID
        res_prod = supabase.table("products").select("id").eq("competitor_id", comp_id).eq("name", prod_name).execute()
        
        if not res_prod.data:
            print(f"Could not find product '{prod_name}' under competitor '{comp_name}'")
            continue
            
        new_prod_id = res_prod.data[0]['id']
        
        # 3. Insert Favorite
        # Check if exists first (to avoid duplicates if run multiple times)
        res_exists = supabase.table("favorites").select("id").eq("product_id", new_prod_id).execute()
        if res_exists.data:
             print(f"Favorite for '{prod_name}' already exists.")
             # Update savedAt if needed, or skip. To force update savedAt:
             # supabase.table("favorites").update({"created_at": item.get("savedAt")}).eq("id", res_exists.data[0]['id']).execute()
        else:
            supabase.table("favorites").insert({
                "product_id": new_prod_id,
                "created_at": item.get("savedAt")
            }).execute()
            print(f"Inserted favorite: {prod_name}")
            count += 1
            
    print(f"Favorites migration finished. Processed {count} items.")

def migrate_history():
    print("\nMigrating comparison_history.json...")
    try:
        with open('comparison_history.json', 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        print("comparison_history.json not found.")
        return

    count = 0
    # data is a list of history records. Sort by date if needed but order in file is usually newest first.
    # Supabase created_at will be 'now()', but we can try to override created_at if we want to preserve order?
    # Schema has created_at default now(). 
    # history.json has "timestamp". We should map timestamp to created_at.
    
    for record in data:
        # Schema: analysis (jsonb), products (jsonb), created_at, product_ids (text[]), product_names (text[])
        payload = {
            "analysis": record.get("analysis"),
            "products": record.get("products"),
            "created_at": record.get("timestamp"),
            "product_ids": record.get("productIds"),
            "product_names": record.get("productNames")
        }
        
        # ID is usually uuid. Local might be "history-176...". 
        # We let Supabase generate new ID to ensure UUID validity.
        
        try:
            # Check overlap by created_at.
            res_exists = supabase.table("comparison_history").select("id").eq("created_at", payload["created_at"]).execute()
            if res_exists.data:
                 # Update if exists to ensure new columns (product_ids, product_names) are filled
                 hid = res_exists.data[0]['id']
                 supabase.table("comparison_history").update({
                     "product_ids": payload["product_ids"],
                     "product_names": payload["product_names"]
                 }).eq("id", hid).execute()
                 print(f"Updated history record from {payload['created_at']}")
                 continue

            supabase.table("comparison_history").insert(payload).execute()
            print(f"Inserted history record from {payload['created_at']}")
            count += 1
        except Exception as e:
             print(f"Error inserting history: {e}")

    print(f"History migration finished. Processed {count} items.")

if __name__ == "__main__":
    migrate_competitors()
    migrate_favorites()
    migrate_history()
