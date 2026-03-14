package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"gopkg.in/yaml.v3"
)

// RepoEntry represents a parsed line from repos.txt
type RepoEntry struct {
	Owner    string
	Repo     string
	Category string
	Replaces []string
}

// GitHubLicense represents the license field from GitHub API
type GitHubLicense struct {
	SPDXID string `json:"spdx_id"`
}

// GitHubRepoResponse represents the GitHub API response
type GitHubRepoResponse struct {
	Name            string         `json:"name"`
	Description     string         `json:"description"`
	StargazersCount int            `json:"stargazers_count"`
	PushedAt        string         `json:"pushed_at"`
	HTMLURL         string         `json:"html_url"`
	License         *GitHubLicense  `json:"license"`
}

// AppYAML represents the YAML skeleton for an app
type AppYAML struct {
	Slug                 string   `yaml:"slug"`
	Name                 string   `yaml:"name"`
	Category             string   `yaml:"category"`
	Description          string   `yaml:"description"`
	Subdomain            string   `yaml:"subdomain"`
	Envs                 []any    `yaml:"envs"`
	Dependencies         []any    `yaml:"dependencies"`
	Volumes              []any    `yaml:"volumes"`
	Features             *Features `yaml:"features"`
	DeploymentComplexity string   `yaml:"deploymentComplexity"`
	Tier                 string   `yaml:"tier"`
	Featured             bool     `yaml:"featured"`
	BusinessRelevance    int      `yaml:"businessRelevance"`
	Affiliate            *Affiliate `yaml:"affiliate"`
	Port                 int      `yaml:"port"`
	MinRam               string   `yaml:"minRam"`
	Tags                 []string `yaml:"tags"`
	DockerPreferredTag   string   `yaml:"dockerPreferredTag"`
	DockerRegistry       string   `yaml:"dockerRegistry"`
	Image                string   `yaml:"image"`
	Replaces             []string `yaml:"replaces"`
	License              string   `yaml:"license"`
	GitHubStars          int      `yaml:"githubStars"`
	LastPushedAt         string   `yaml:"lastPushedAt"`
	GitHubUrl            string   `yaml:"githubUrl"`
}

type Features struct {
	HasAPI          bool `yaml:"hasApi"`
	HasMobileApp    bool `yaml:"hasMobileApp"`
	HasSSOSupport   bool `yaml:"hasSSOSupport"`
	HasBackupTool   bool `yaml:"hasBackupTool"`
	HasMultiLanguage bool `yaml:"hasMultiLanguage"`
	HasAuditLog     bool `yaml:"hasAuditLog"`
	HasGuestAccess  bool `yaml:"hasGuestAccess"`
	HasOfflineMode  bool `yaml:"hasOfflineMode"`
}

type Affiliate struct {
	HasAffiliate      bool   `yaml:"hasAffiliate"`
	AffiliateUrl      string `yaml:"affiliateUrl"`
	AffiliateSignupUrl string `yaml:"affiliateSignupUrl"`
}

func main() {
	projectRoot := findProjectRoot()
	if projectRoot == "" {
		fmt.Fprintln(os.Stderr, "error: could not find project root (registry/repos.txt)")
		os.Exit(1)
	}

	reposPath := filepath.Join(projectRoot, "registry", "repos.txt")
	entries, err := parseReposFile(reposPath)
	if err != nil {
		fmt.Fprintf(os.Stderr, "error reading repos.txt: %v\n", err)
		os.Exit(1)
	}

	appsDir := filepath.Join(projectRoot, "registry", "apps")
	if err := os.MkdirAll(appsDir, 0755); err != nil {
		fmt.Fprintf(os.Stderr, "error creating apps dir: %v\n", err)
		os.Exit(1)
	}

	client := &http.Client{}
	githubToken := os.Getenv("GITHUB_TOKEN")

	generated := 0
	skipped := 0
	var warnings []string

	for _, entry := range entries {
		slug := toSlug(entry.Repo)
		outPath := filepath.Join(appsDir, slug+".yaml")

		if _, err := os.Stat(outPath); err == nil {
			skipped++
			continue
		}

		// Fetch GitHub API
		ghURL := fmt.Sprintf("https://api.github.com/repos/%s/%s", entry.Owner, entry.Repo)
		req, _ := http.NewRequest("GET", ghURL, nil)
		req.Header.Set("Accept", "application/vnd.github.v3+json")
		if githubToken != "" {
			req.Header.Set("Authorization", "Bearer "+githubToken)
		}

		resp, err := client.Do(req)
		if err != nil {
			warnings = append(warnings, fmt.Sprintf("%s: GitHub request failed: %v", entry.Repo, err))
			continue
		}

		var ghRepo GitHubRepoResponse
		if err := json.NewDecoder(resp.Body).Decode(&ghRepo); err != nil {
			resp.Body.Close()
			warnings = append(warnings, fmt.Sprintf("%s: failed to decode GitHub response: %v", entry.Repo, err))
			continue
		}
		resp.Body.Close()

		if resp.StatusCode != 200 {
			warnings = append(warnings, fmt.Sprintf("%s: GitHub returned %d", entry.Repo, resp.StatusCode))
			continue
		}

		// Check Docker Hub
		dockerRegistry := "ghcr"
		image := fmt.Sprintf("ghcr.io/%s/%s", strings.ToLower(entry.Owner), strings.ToLower(entry.Repo))
		dockerHubURL := fmt.Sprintf("https://hub.docker.com/v2/repositories/%s/%s/", strings.ToLower(entry.Owner), strings.ToLower(entry.Repo))
		dhResp, err := client.Get(dockerHubURL)
		if err == nil {
			dhResp.Body.Close()
			if dhResp.StatusCode == 200 {
				dockerRegistry = "dockerhub"
				image = fmt.Sprintf("%s/%s", strings.ToLower(entry.Owner), strings.ToLower(entry.Repo))
			}
		}

		license := mapLicense(ghRepo.License)

		app := AppYAML{
			Slug:                 slug,
			Name:                 ghRepo.Name,
			Category:             entry.Category,
			Description:          ghRepo.Description,
			Subdomain:            "",
			Envs:                 []any{},
			Dependencies:         []any{},
			Volumes:              []any{},
			Features:             &Features{},
			DeploymentComplexity: "MODERATE",
			Tier:                 "FREE",
			Featured:             false,
			BusinessRelevance:    5,
			Affiliate:            &Affiliate{HasAffiliate: false, AffiliateUrl: "", AffiliateSignupUrl: ""},
			Port:                 0,
			MinRam:               "512MB",
			Tags:                 []string{},
			DockerPreferredTag:  "latest",
			DockerRegistry:       dockerRegistry,
			Image:                image,
			Replaces:             entry.Replaces,
			License:              license,
			GitHubStars:          ghRepo.StargazersCount,
			LastPushedAt:         ghRepo.PushedAt,
			GitHubUrl:            ghRepo.HTMLURL,
		}

		data, err := yaml.Marshal(app)
		if err != nil {
			warnings = append(warnings, fmt.Sprintf("%s: YAML marshal failed: %v", entry.Repo, err))
			continue
		}

		// Add comments at top
		header := "# Generated by scaffold CLI. Fill in subdomain, envs, dependencies, volumes, port, etc.\n"
		data = append([]byte(header), data...)

		if err := os.WriteFile(outPath, data, 0644); err != nil {
			warnings = append(warnings, fmt.Sprintf("%s: write failed: %v", entry.Repo, err))
			continue
		}
		generated++
	}

	fmt.Printf("Generated: %d, Skipped (exists): %d\n", generated, skipped)
	for _, w := range warnings {
		fmt.Printf("Warning: %s\n", w)
	}
}

func findProjectRoot() string {
	dir, err := os.Getwd()
	if err != nil {
		return ""
	}
	for {
		p := filepath.Join(dir, "registry", "repos.txt")
		if _, err := os.Stat(p); err == nil {
			return dir
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			return ""
		}
		dir = parent
	}
}

func parseReposFile(path string) ([]RepoEntry, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	var entries []RepoEntry
	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		parts := strings.SplitN(line, "|", 3)
		if len(parts) < 3 {
			continue
		}
		ownerRepo := strings.TrimSpace(parts[0])
		category := strings.TrimSpace(parts[1])
		replacesStr := strings.TrimSpace(parts[2])

		ownerRepoParts := strings.SplitN(ownerRepo, "/", 2)
		if len(ownerRepoParts) != 2 {
			continue
		}
		owner := strings.TrimSpace(ownerRepoParts[0])
		repo := strings.TrimSpace(ownerRepoParts[1])
		if owner == "" || repo == "" || category == "" {
			continue
		}

		var replaces []string
		for _, r := range strings.Split(replacesStr, ",") {
			s := strings.TrimSpace(r)
			if s != "" {
				replaces = append(replaces, s)
			}
		}

		entries = append(entries, RepoEntry{Owner: owner, Repo: repo, Category: category, Replaces: replaces})
	}
	return entries, scanner.Err()
}

func toSlug(repo string) string {
	slug := strings.ToLower(repo)
	slug = regexp.MustCompile(`[^a-z0-9]+`).ReplaceAllString(slug, "-")
	slug = strings.Trim(slug, "-")
	return slug
}

func mapLicense(lic *GitHubLicense) string {
	if lic == nil || lic.SPDXID == "" {
		return "OTHER"
	}
	switch lic.SPDXID {
	case "MIT":
		return "MIT"
	case "Apache-2.0":
		return "APACHE_2"
	case "GPL-3.0", "GPL-3.0-or-later", "GPL-3.0-only":
		return "GPL_3"
	case "AGPL-3.0", "AGPL-3.0-or-later", "AGPL-3.0-only":
		return "AGPL_3"
	case "BSD-3-Clause":
		return "BSD_3"
	case "BSL-1.1":
		return "BSL"
	default:
		return "OTHER"
	}
}
