IMAGE := borisplaton/hack-python-server
IMAGE_TAG := 0.1


run-dev:
	@python src/main.py

build:
	@docker build -f Dockerfile -t $(IMAGE):$(IMAGE_TAG) .

run: build
	@docker run --rm -p 8080:8080 --env-file .env.local $(IMAGE):$(IMAGE_TAG)
