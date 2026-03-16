package main

import (
	"net/http/httptest"
	"testing"
	"time"
)

func TestExtractClientIPUsesRemoteAddrByDefault(t *testing.T) {
	t.Parallel()

	req := httptest.NewRequest("POST", "/v1/waitlist", nil)
	req.RemoteAddr = "192.168.1.25:54321"
	req.Header.Set("X-Forwarded-For", "203.0.113.4")

	ip := extractClientIP(req, false)
	if ip != "192.168.1.25" {
		t.Fatalf("expected remote address IP, got %s", ip)
	}
}

func TestExtractClientIPUsesForwardedHeaderWhenTrusted(t *testing.T) {
	t.Parallel()

	req := httptest.NewRequest("POST", "/v1/waitlist", nil)
	req.RemoteAddr = "192.168.1.25:54321"
	req.Header.Set("X-Forwarded-For", "203.0.113.4, 198.51.100.8")

	ip := extractClientIP(req, true)
	if ip != "203.0.113.4" {
		t.Fatalf("expected first forwarded IP, got %s", ip)
	}
}

func TestExtractClientIPRejectsMalformedAddresses(t *testing.T) {
	t.Parallel()

	req := httptest.NewRequest("POST", "/v1/waitlist", nil)
	req.RemoteAddr = "not-an-ip"

	ip := extractClientIP(req, false)
	if ip != "" {
		t.Fatalf("expected malformed address to normalize to empty string, got %s", ip)
	}
}

func TestRateLimiterUsesNormalizedIPAddress(t *testing.T) {
	t.Parallel()

	limiter := newRateLimiter(5, time.Hour)

	for i := 0; i < 5; i++ {
		if !limiter.allow("192.168.1.25") {
			t.Fatalf("expected request %d to be allowed", i+1)
		}
	}

	if limiter.allow("192.168.1.25") {
		t.Fatal("expected sixth request from the same IP to be rate limited")
	}
}
