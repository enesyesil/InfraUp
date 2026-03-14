FROM golang:1.24-alpine AS builder
WORKDIR /app
COPY apps/generator/go.mod apps/generator/go.sum ./
RUN go mod download
COPY apps/generator/ .
RUN go build -o /sync ./cmd/sync/main.go

FROM alpine:latest
RUN apk --no-cache add ca-certificates
COPY --from=builder /sync /sync
COPY registry/ /registry/
ENTRYPOINT ["/sync"]
