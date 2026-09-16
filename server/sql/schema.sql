CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) NOT NULL PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
  location_permission TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_users_email (email)
);

CREATE TABLE IF NOT EXISTS files (
  id CHAR(36) NOT NULL PRIMARY KEY,
  sender_id CHAR(36) NOT NULL,
  receiver_id CHAR(36) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(127) NOT NULL DEFAULT 'application/octet-stream',
  file_size BIGINT NOT NULL,
  storage_reference VARCHAR(255) NULL,
  encrypted_file_reference VARCHAR(255) NULL,
  wrapped_key VARBINARY(512) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  expires_at DATETIME(3) NOT NULL,
  status ENUM('active', 'expired', 'deleted') NOT NULL DEFAULT 'active',
  KEY idx_files_sender (sender_id),
  KEY idx_files_receiver (receiver_id),
  KEY idx_files_expires (expires_at, status),
  CONSTRAINT fk_files_sender FOREIGN KEY (sender_id) REFERENCES users (id),
  CONSTRAINT fk_files_receiver FOREIGN KEY (receiver_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS file_links (
  id CHAR(36) NOT NULL PRIMARY KEY,
  file_id CHAR(36) NOT NULL,
  secure_token_hash CHAR(64) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  expires_at DATETIME(3) NOT NULL,
  used_at DATETIME(3) NULL,
  status ENUM('active', 'expired', 'revoked') NOT NULL DEFAULT 'active',
  UNIQUE KEY uq_file_links_hash (secure_token_hash),
  KEY idx_file_links_file (file_id),
  KEY idx_file_links_expires (expires_at, status),
  CONSTRAINT fk_file_links_file FOREIGN KEY (file_id) REFERENCES files (id)
);

CREATE TABLE IF NOT EXISTS guest_file_access (
  id CHAR(36) NOT NULL PRIMARY KEY,
  file_id CHAR(36) NOT NULL,
  access_code_hash CHAR(64) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  expires_at DATETIME(3) NOT NULL,
  used_at DATETIME(3) NULL,
  UNIQUE KEY uq_guest_access_file (file_id),
  UNIQUE KEY uq_guest_access_code (access_code_hash),
  KEY idx_guest_access_expires (expires_at),
  CONSTRAINT fk_guest_access_file FOREIGN KEY (file_id) REFERENCES files (id)
);

CREATE TABLE IF NOT EXISTS download_history (
  id CHAR(36) NOT NULL PRIMARY KEY,
  file_id CHAR(36) NOT NULL,
  sender_id CHAR(36) NOT NULL,
  receiver_id CHAR(36) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  received_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  downloaded_at DATETIME(3) NULL,
  status ENUM('active', 'expired') NOT NULL DEFAULT 'active',
  KEY idx_history_receiver (receiver_id, received_at),
  KEY idx_history_file (file_id),
  CONSTRAINT fk_history_file FOREIGN KEY (file_id) REFERENCES files (id),
  CONSTRAINT fk_history_sender FOREIGN KEY (sender_id) REFERENCES users (id),
  CONSTRAINT fk_history_receiver FOREIGN KEY (receiver_id) REFERENCES users (id)
);
