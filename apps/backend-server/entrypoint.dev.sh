#/usr/bin/which sh
set -eu

# In most Supabase self-host setups, Kong is the gateway on :8000
HOST="${SUPABASE_HOST:-kong}"
PORT="${SUPABASE_PORT:-8000}"

echo $HOST
echo $PORT

echo "[backend-server] waiting for ${HOST}:${PORT} ..."
until nc -z "$HOST" "$PORT"; do
  sleep 1
done

echo "[backend-server] supabase reachable, starting app..."
exec npm run dev
