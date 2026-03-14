package main

import (
	"bytes"
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

var (
	emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
)

type waitlistRequest struct {
	Email           string   `json:"email"`
	Role            string   `json:"role"`
	ReplacingTools  []string `json:"replacingTools"`
}

type waitlistResponse struct {
	Success bool `json:"success"`
}

type healthResponse struct {
	Status string `json:"status"`
}

type rateLimiter struct {
	mu       sync.Mutex
	requests map[string][]time.Time
	limit    int
	window   time.Duration
}

func newRateLimiter(limit int, window time.Duration) *rateLimiter {
	rl := &rateLimiter{
		requests: make(map[string][]time.Time),
		limit:   limit,
		window:  window,
	}
	go rl.cleanup()
	return rl
}

func (rl *rateLimiter) cleanup() {
	ticker := time.NewTicker(time.Minute)
	for range ticker.C {
		rl.mu.Lock()
		now := time.Now()
		for ip, times := range rl.requests {
			var valid []time.Time
			for _, t := range times {
				if now.Sub(t) < rl.window {
					valid = append(valid, t)
				}
			}
			if len(valid) == 0 {
				delete(rl.requests, ip)
			} else {
				rl.requests[ip] = valid
			}
		}
		rl.mu.Unlock()
	}
}

func (rl *rateLimiter) allow(ip string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	times := rl.requests[ip]

	// Prune old entries
	var valid []time.Time
	for _, t := range times {
		if now.Sub(t) < rl.window {
			valid = append(valid, t)
		}
	}

	if len(valid) >= rl.limit {
		return false
	}

	valid = append(valid, now)
	rl.requests[ip] = valid
	return true
}

func main() {
	_ = godotenv.Load()

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL is required")
	}

	pool, err := pgxpool.New(context.Background(), dbURL)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer pool.Close()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	rl := newRateLimiter(5, time.Hour)

	mux := http.NewServeMux()
	mux.HandleFunc("GET /v1/health", corsMiddleware(healthHandler()))
	mux.HandleFunc("POST /v1/waitlist", corsMiddleware(waitlistHandler(pool, rl)))

	addr := ":" + port
	log.Printf("API listening on %s", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}

func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	allowedOrigins := map[string]bool{
		"https://infraup.dev": true,
		"http://localhost:3000": true,
	}
	allowedMethods := "GET, POST, OPTIONS"
	allowedHeaders := "Content-Type, Authorization"

	return func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if allowedOrigins[origin] {
			w.Header().Set("Access-Control-Allow-Origin", origin)
		}
		w.Header().Set("Access-Control-Allow-Methods", allowedMethods)
		w.Header().Set("Access-Control-Allow-Headers", allowedHeaders)

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next(w, r)
	}
}

func healthHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(healthResponse{Status: "ok"})
	}
}

func waitlistHandler(pool *pgxpool.Pool, rl *rateLimiter) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ip := r.RemoteAddr
		if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
			if idx := strings.Index(xff, ","); idx >= 0 {
				ip = strings.TrimSpace(xff[:idx])
			} else {
				ip = strings.TrimSpace(xff)
			}
		}

		if !rl.allow(ip) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusTooManyRequests)
			json.NewEncoder(w).Encode(map[string]string{"error": "rate limit exceeded"})
			return
		}

		if r.Method != http.MethodPost {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusMethodNotAllowed)
			json.NewEncoder(w).Encode(map[string]string{"error": "method not allowed"})
			return
		}

		var req waitlistRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "invalid JSON"})
			return
		}

		if !emailRegex.MatchString(req.Email) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "invalid email"})
			return
		}

		replacingTools := req.ReplacingTools
		if replacingTools == nil {
			replacingTools = []string{}
		}

		ctx := r.Context()
		_, err := pool.Exec(ctx, `
			INSERT INTO "Waitlist" (id, email, role, "replacingTools", "createdAt")
			VALUES (gen_random_uuid(), $1, $2, $3, NOW())
			ON CONFLICT (email) DO UPDATE SET role = $2, "replacingTools" = $3
		`, req.Email, req.Role, replacingTools)
		if err != nil {
			log.Printf("waitlist upsert error: %v", err)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "internal error"})
			return
		}

		resendKey := os.Getenv("RESEND_API_KEY")
		if resendKey != "" {
			go sendConfirmationEmail(resendKey, req.Email)
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(waitlistResponse{Success: true})
	}
}

func sendConfirmationEmail(apiKey, email string) {
	body := map[string]interface{}{
		"from":    "InfraUp <noreply@infraup.dev>",
		"to":      []string{email},
		"subject": "You're on the InfraUp waitlist",
		"html":    "<p>Thanks for joining the InfraUp waitlist. We'll be in touch soon!</p>",
	}
	jsonBody, _ := json.Marshal(body)

	req, err := http.NewRequest("POST", "https://api.resend.com/emails", bytes.NewReader(jsonBody))
	if err != nil {
		log.Printf("resend request error: %v", err)
		return
	}
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Printf("resend send error: %v", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		log.Printf("resend API error: status %d for %s", resp.StatusCode, email)
	}
}
