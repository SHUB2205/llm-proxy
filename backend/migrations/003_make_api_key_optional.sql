-- Make encrypted_api_key optional for users
-- Users can add their OpenAI key later via profile update

ALTER TABLE users 
ALTER COLUMN encrypted_api_key DROP NOT NULL;

-- Add a comment explaining this is optional
COMMENT ON COLUMN users.encrypted_api_key IS 'Optional: User OpenAI API key (encrypted). Can be added later via profile settings.';
