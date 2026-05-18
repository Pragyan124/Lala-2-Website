export const decodeString = (encoded: string): string => {
  if (!encoded) return encoded;
  try {
    return Buffer.from(encoded, 'base64').toString('utf-8');
  } catch {
    return encoded;
  }
};

export const encodeUsername = (username: string): string => {
  if (!username) return username;
  return Buffer.from(username.trim()).toString('base64');
};

export const decodeUsername = (encodedUsername: string): string => {
  return decodeString(encodedUsername);
};

export const encodePassword = (password: string): string => {
  if (!password) return password;
  return Buffer.from(password.trim()).toString('base64');
};



