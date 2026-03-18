# Deploy Checklist

> Generic pre-deploy verification pattern. Adapt to your stack and infrastructure.

## Pre-Deploy Verification Steps

### 1. Code Quality

```bash
# Lint
npm run lint          # or: ruff check ., cargo clippy, go vet ./...

# Type check
npx tsc --noEmit      # or: mypy ., cargo check, go build ./...

# Tests
npm test              # or: pytest, cargo test, go test ./...
```

**Gate:** All checks must pass. Do not deploy with lint errors, type errors, or failing tests.

### 2. Build Verification

```bash
# Build the project
npm run build         # or: cargo build --release, go build ./cmd/...

# Verify build output exists
ls -la dist/          # or: target/release/, bin/
```

**Gate:** Build must succeed and produce expected artifacts.

### 3. Environment Check

```bash
# Verify required environment variables are SET (never read values)
for var in DATABASE_URL API_KEY SECRET_KEY; do
  if [ -z "${!var}" ]; then
    echo "MISSING: $var"
    exit 1
  fi
done
echo "All required env vars present"
```

**Gate:** All required environment variables must be present. Never log or display values.

### 4. Container Test (if Docker)

```bash
# Build image
docker build -t app:test .

# Run smoke test
docker run --rm app:test npm run healthcheck
# or: docker run --rm app:test python -c "import app; print('ok')"
```

**Gate:** Container builds and starts without error.

### 5. Post-Deploy Verification

```bash
# Health endpoint check
curl -sf https://your-app.example.com/health || echo "HEALTH CHECK FAILED"

# Smoke test — verify core functionality
curl -sf https://your-app.example.com/api/v1/status | jq .version

# Check logs for startup errors
kubectl logs deployment/app --tail=50 | grep -i error
# or: docker logs app --tail=50 | grep -i error
```

**Gate:** Health endpoint returns 200, no startup errors in logs.

## Checklist Summary

| Step | Check | Gate |
|------|-------|------|
| 1. Code Quality | Lint + Typecheck + Tests | All pass |
| 2. Build | Build succeeds | Artifacts exist |
| 3. Environment | Required vars present | All set |
| 4. Container | Image builds, starts | No errors |
| 5. Post-Deploy | Health endpoint, logs | 200 OK, no errors |

## Rollback Plan

Before every deploy, ensure you can roll back:

- **Git:** Know the last good commit hash
- **Container:** Keep the previous image tag
- **Database:** Ensure migrations are reversible or backward-compatible
- **Feature flags:** Disable new features without redeploying
