-- Criar banco de dados
CREATE DATABASE IF NOT EXISTS easyyield;

-- Criar usuário
CREATE USER IF NOT EXISTS 'easyyield_user'@'localhost' IDENTIFIED BY 'easyyield_password';

-- Conceder privilégios
GRANT ALL PRIVILEGES ON easyyield.* TO 'easyyield_user'@'localhost';
FLUSH PRIVILEGES;