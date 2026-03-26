CREATE TABLE verification_tokens (
                                     id UUID PRIMARY KEY,
                                     token VARCHAR(255) NOT NULL UNIQUE,
                                     token_type VARCHAR(50) NOT NULL,
                                     user_id UUID NOT NULL,
                                     expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
                                     created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                     updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                     deleted_at TIMESTAMP WITH TIME ZONE,
                                     version BIGINT NOT NULL DEFAULT 0,
                                     CONSTRAINT fk_verification_token_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for faster token lookups
CREATE INDEX idx_verification_tokens_token ON verification_tokens(token);