-- Add major_user_group_profile column to competitors table
ALTER TABLE competitors 
ADD COLUMN IF NOT EXISTS major_user_group_profile TEXT;

-- Update the comment for the column
COMMENT ON COLUMN competitors.major_user_group_profile IS '主要用户群体画像信息';
