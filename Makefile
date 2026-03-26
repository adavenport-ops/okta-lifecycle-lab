.PHONY: install dev run run-live test lint mock-scim dashboard docker-up docker-down clean

install:
	pip install -e ".[all]"
	cd dashboard && npm install

dev: install

run:
	lifecycle-lab run --mode sim

run-live:
	lifecycle-lab run --mode live

test:
	pytest -v

lint:
	ruff check engine/ mock_scim/ tests/
	mypy engine/ --ignore-missing-imports

mock-scim:
	python -m mock_scim.server

dashboard:
	cd dashboard && npm install && npm run dev

docker-up:
	docker compose up --build

docker-down:
	docker compose down -v

clean:
	rm -rf data/event_log.jsonl __pycache__ .pytest_cache .mypy_cache .ruff_cache dist build *.egg-info
	rm -rf dashboard/dist dashboard/node_modules/.vite
