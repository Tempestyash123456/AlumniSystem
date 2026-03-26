ALTER TABLE verification_tokens
ADD COLUMN created_by VARCHAR(255),
ADD COLUMN updated_by VARCHAR(255);