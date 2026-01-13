-- Add missing DELETE policy for standardization_tests
create policy "Allow public delete access"
  on standardization_tests for delete
  using (true);
