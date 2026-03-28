IMAGE := borisplaton/hack-python-server
IMAGE_TAG := 0.1


run-dev:
	@docker run --rm -p 8080:8080 --volume ./src/:/app/src --env-file .env.local $(IMAGE):$(IMAGE_TAG)

build:
	@docker build -f Dockerfile -t $(IMAGE):$(IMAGE_TAG) .

run: build
	@docker run --rm -p 8080:8080 --env-file .env.local $(IMAGE):$(IMAGE_TAG)
