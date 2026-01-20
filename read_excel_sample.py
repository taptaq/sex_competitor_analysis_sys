
import pandas as pd
import sys

file_path = "/Users/taptaq/Documents/初心路/项目/情趣用品竞品分析系统/竞品分析数据/产品评论/Satisfyer/【G-Spot Wave 4】用户评论.xlsx"

try:
    # Attempt to read the excel file
    df = pd.read_excel(file_path)
    
    # Print columns to help identify review column
    print("Columns:", df.columns.tolist())
    
    # Try to find a review column
    review_col = None
    possible_names = ['comment', 'content', 'review', '内容', '评论', '评价', 'text']
    for col in df.columns:
        if any(name in str(col).lower() for name in possible_names):
            review_col = col
            break
            
    if review_col:
        print(f"\nFound review column: {review_col}")
        print("--- Sample Reviews (First 20) ---")
        # Print first 20 non-empty reviews
        comments = df[review_col].dropna().head(20).tolist()
        for i, c in enumerate(comments):
            print(f"{i+1}: {c}")
    else:
        print("No obvious review column found. Printing first 5 rows:")
        print(df.head(5))

except Exception as e:
    print(f"Error reading file: {e}")
