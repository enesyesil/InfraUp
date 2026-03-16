package main

import (
	"net"
	"net/http"
	"strings"
)

func extractClientIP(r *http.Request, trustProxyHeaders bool) string {
	if trustProxyHeaders {
		if forwardedFor := strings.TrimSpace(r.Header.Get("X-Forwarded-For")); forwardedFor != "" {
			firstHop := forwardedFor
			if idx := strings.Index(firstHop, ","); idx >= 0 {
				firstHop = firstHop[:idx]
			}
			if normalized := normalizeIPAddress(firstHop); normalized != "" {
				return normalized
			}
		}
	}

	if host, _, err := net.SplitHostPort(strings.TrimSpace(r.RemoteAddr)); err == nil {
		if normalized := normalizeIPAddress(host); normalized != "" {
			return normalized
		}
	}

	return normalizeIPAddress(r.RemoteAddr)
}

func normalizeIPAddress(value string) string {
	candidate := strings.TrimSpace(value)
	if candidate == "" {
		return ""
	}
	ip := net.ParseIP(candidate)
	if ip == nil {
		return ""
	}
	return ip.String()
}
