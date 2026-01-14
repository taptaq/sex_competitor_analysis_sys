alter table product_reviews 
add column if not exists likes integer default 0;
