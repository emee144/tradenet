CREATE TABLE IF NOT EXISTS otp_codes (
  phone TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- Make NIN unique so two people can't register with the same NIN
ALTER TABLE profiles ADD CONSTRAINT profiles_nin_unique UNIQUE (nin);
