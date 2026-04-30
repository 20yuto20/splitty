.DEFAULT_GOAL := help

# ----- Configuration -------------------------------------------------------
COMPOSE      ?= docker compose
COMPOSE_DEV  := $(COMPOSE) -f docker-compose.dev.yml
COMPOSE_PROD := $(COMPOSE) -f docker-compose.yml

# Local-dev DATABASE_URL points at the Postgres container started by `make db`.
DEV_DATABASE_URL := postgresql://splitty:splitty@localhost:5432/splitty?schema=public

# ----- Help ----------------------------------------------------------------
help: ## Show this help
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage: make \033[36m<target>\033[0m\n\nTargets:\n"} /^[a-zA-Z0-9_-]+:.*?##/ { printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

# ----- Local development (Next.js on host, Postgres in Docker) -------------
install: ## Install npm dependencies
	npm install

db: ## Start the local Postgres container (detached)
	$(COMPOSE_DEV) up -d db

db-stop: ## Stop the local Postgres container
	$(COMPOSE_DEV) stop db

db-logs: ## Tail logs from the local Postgres container
	$(COMPOSE_DEV) logs -f db

db-shell: ## Open a psql shell inside the local Postgres container
	$(COMPOSE_DEV) exec db psql -U splitty -d splitty

db-push: ## Sync Prisma schema to the local database
	DATABASE_URL="$(DEV_DATABASE_URL)" npx prisma db push

db-studio: ## Open Prisma Studio against the local database
	DATABASE_URL="$(DEV_DATABASE_URL)" npx prisma studio

db-reset: ## Drop the local DB volume and recreate it (DESTRUCTIVE)
	$(COMPOSE_DEV) down -v
	$(COMPOSE_DEV) up -d db
	@echo "waiting for postgres..."; sleep 3
	$(MAKE) db-push

dev: ## Run the Next.js dev server (expects `make db` running)
	DATABASE_URL="$(DEV_DATABASE_URL)" \
	NEXT_PUBLIC_SITE_URL="http://localhost:3000" \
	npm run dev

build: ## Build the Next.js app locally
	npm run build

lint: ## Run Next.js / ESLint checks
	npm run lint

# ----- Full Docker stack (app + db in containers) --------------------------
up: ## Build & start the full stack (app + db) in containers
	$(COMPOSE_PROD) up -d --build

start: ## Start the full stack without rebuilding
	$(COMPOSE_PROD) up -d

stop: ## Stop the full stack (containers preserved)
	$(COMPOSE_PROD) stop

down: ## Stop & remove the full stack (volumes preserved)
	$(COMPOSE_PROD) down

logs: ## Tail logs from the app container
	$(COMPOSE_PROD) logs -f app

ps: ## Show container status
	$(COMPOSE_PROD) ps

restart: ## Recreate the app container with a fresh build
	$(COMPOSE_PROD) up -d --build app

shell: ## Open a shell inside the running app container
	$(COMPOSE_PROD) exec app sh

nuke: ## Stop & remove the stack INCLUDING volumes (DESTRUCTIVE)
	$(COMPOSE_PROD) down -v

# ----- Image-only operations -----------------------------------------------
docker-build: ## Build only the app image (no compose)
	docker build -t splitty:latest .

docker-run: ## Run the built image standalone (requires DATABASE_URL env)
	docker run --rm -p 3000:3000 \
		-e DATABASE_URL="$$DATABASE_URL" \
		-e NEXT_PUBLIC_SITE_URL="$${NEXT_PUBLIC_SITE_URL:-http://localhost:3000}" \
		splitty:latest

# ----- Cleanup -------------------------------------------------------------
clean: ## Remove local build artifacts
	rm -rf .next node_modules/.cache tsconfig.tsbuildinfo

clean-all: clean ## Remove node_modules too
	rm -rf node_modules

.PHONY: help install db db-stop db-logs db-shell db-push db-studio db-reset \
        dev build lint up start stop down logs ps restart shell nuke \
        docker-build docker-run clean clean-all
