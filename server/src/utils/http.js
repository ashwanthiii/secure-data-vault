function publicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    timezone: row.timezone,
    locationPermission: Boolean(row.location_permission),
    createdAt: row.created_at,
  };
}

function httpError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

module.exports = { publicUser, httpError };
