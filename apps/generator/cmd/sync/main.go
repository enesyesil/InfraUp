package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"gopkg.in/yaml.v3"
)

// AppYAML represents the app YAML spec
type AppYAML struct {
	Slug                 string           `yaml:"slug"`
	Name                 string           `yaml:"name"`
	Category             string           `yaml:"category"`
	Description          string           `yaml:"description"`
	Subdomain            string           `yaml:"subdomain"`
	DockerImage          string           `yaml:"dockerImage"`
	Image                string           `yaml:"image"` // scaffold uses "image"
	Port                 int              `yaml:"port"`
	MinRam               string           `yaml:"minRam"`
	Tier                 string           `yaml:"tier"`
	License              string           `yaml:"license"`
	DeploymentComplexity string           `yaml:"deploymentComplexity"`
	DockerRegistry       string           `yaml:"dockerRegistry"`
	DockerHubUrl         string           `yaml:"dockerHubUrl"`
	DockerSupported      *bool            `yaml:"dockerSupported"`
	OfficialDockerImage  *bool            `yaml:"officialDockerImage"`
	WebsiteUrl           string           `yaml:"websiteUrl"`
	GitHubUrl            string           `yaml:"githubUrl"`
	DocsUrl              string           `yaml:"docsUrl"`
	LogoUrl              string           `yaml:"logoUrl"`
	Replaces             []string         `yaml:"replaces"`
	Tags                 []string         `yaml:"tags"`
	Featured             bool             `yaml:"featured"`
	BusinessRelevance    int              `yaml:"businessRelevance"`
	Meta                 *Meta            `yaml:"meta"`
	Features             *Features        `yaml:"features"`
	Affiliate            *Affiliate       `yaml:"affiliate"`
	Dependencies         []DepEntry       `yaml:"dependencies"`
}

type Meta struct {
	GitHub  string `yaml:"github"`
	Website string `yaml:"website"`
	Docs    string `yaml:"docs"`
	Logo    string `yaml:"logo"`
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
	HasAffiliate       bool   `yaml:"hasAffiliate"`
	AffiliateUrl       string `yaml:"affiliateUrl"`
	AffiliateSignupUrl string `yaml:"affiliateSignupUrl"`
}

type DepEntry struct {
	ID             string `yaml:"id"`
	Slug           string `yaml:"slug"`
	DependencySlug string `yaml:"dependencySlug"`
	Type           string `yaml:"type"`
	Optional       bool   `yaml:"optional"`
}

func (d *DepEntry) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var s string
	if err := unmarshal(&s); err == nil {
		d.DependencySlug = s
		d.Type = "DATABASE"
		return nil
	}
	var r struct {
		ID             string `yaml:"id"`
		Slug           string `yaml:"slug"`
		DependencySlug string `yaml:"dependencySlug"`
		Type           string `yaml:"type"`
		Optional       bool   `yaml:"optional"`
	}
	if err := unmarshal(&r); err != nil {
		return err
	}
	d.ID = r.ID
	d.Slug = r.Slug
	d.DependencySlug = r.DependencySlug
	if d.DependencySlug == "" {
		d.DependencySlug = r.ID
	}
	if d.DependencySlug == "" {
		d.DependencySlug = r.Slug
	}
	d.Type = r.Type
	if d.Type == "" {
		d.Type = "DATABASE"
	}
	d.Optional = r.Optional
	return nil
}

// GitHub API responses
type ghRepoResponse struct {
	StargazersCount int    `json:"stargazers_count"`
	PushedAt        string `json:"pushed_at"`
}

type ghReleaseResponse struct {
	TagName   string `json:"tag_name"`
	Published string `json:"published_at"`
}

// Docker Hub API response
type dockerTagsResponse struct {
	Results []struct {
		LastUpdated string `json:"last_updated"`
	} `json:"results"`
}

func main() {
	_ = godotenv.Load()

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL is required")
	}

	githubToken := os.Getenv("GITHUB_TOKEN")

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer pool.Close()

	projectRoot := findProjectRoot()
	if projectRoot == "" {
		log.Fatal("could not find project root (registry/repos.txt or registry/apps)")
	}

	appsDir := filepath.Join(projectRoot, "registry", "apps")
	contentDir := filepath.Join(projectRoot, "registry", "content", "apps")

	entries, err := os.ReadDir(appsDir)
	if err != nil {
		if os.IsNotExist(err) {
			log.Printf("registry/apps directory does not exist, creating it")
			if err := os.MkdirAll(appsDir, 0755); err != nil {
				log.Fatalf("failed to create apps dir: %v", err)
			}
			entries = nil
		} else {
			log.Fatalf("failed to read apps dir: %v", err)
		}
	}

	httpClient := &http.Client{Timeout: 15 * time.Second}

	var synced, warnings, errors, deactivated int
	var yamlSlugs []string

	for _, e := range entries {
		if e.IsDir() || !strings.HasSuffix(e.Name(), ".yaml") {
			continue
		}

		path := filepath.Join(appsDir, e.Name())
		data, err := os.ReadFile(path)
		if err != nil {
			log.Printf("warning: could not read %s: %v", path, err)
			warnings++
			continue
		}

		var app AppYAML
		if err := yaml.Unmarshal(data, &app); err != nil {
			log.Printf("error: failed to parse %s: %v", path, err)
			errors++
			continue
		}

		// Resolve dockerImage: prefer dockerImage, fallback to image
		dockerImage := app.DockerImage
		if dockerImage == "" {
			dockerImage = app.Image
		}

		// Validate required fields
		if app.Slug == "" || app.Name == "" || app.Category == "" || app.Description == "" ||
			app.Subdomain == "" || dockerImage == "" || app.Port == 0 {
			log.Printf("warning: skipping %s: missing required fields (slug, name, category, description, subdomain, dockerImage, port)", app.Slug)
			warnings++
			continue
		}

		// Fetch GitHub stats
		ghStars, lastCommitAt, lastReleaseAt := fetchGitHubStats(httpClient, githubToken, app)
		if ghStars == nil && lastCommitAt == nil && lastReleaseAt == nil && (app.GitHubUrl != "" || (app.Meta != nil && app.Meta.GitHub != "")) {
			log.Printf("warning: %s: GitHub fetch failed", app.Slug)
			warnings++
		}

		// Fetch Docker Hub tag info (if dockerRegistry=dockerhub)
		dockerVerified := false
		if app.DockerRegistry == "dockerhub" {
			_, err := fetchDockerHubLastUpdated(httpClient, dockerImage)
			if err != nil {
				log.Printf("warning: %s: Docker Hub fetch failed: %v", app.Slug, err)
				warnings++
			} else {
				dockerVerified = true
			}
		} else {
			// Non-dockerhub: still set metaVerifiedAt
			dockerVerified = true
		}

		// Derive activelyMaintained
		activelyMaintained := true
		if lastCommitAt != nil {
			if time.Since(*lastCommitAt) > 6*30*24*time.Hour {
				activelyMaintained = false
			}
		}

		// Upsert App
		maintenanceVerified := lastCommitAt != nil || lastReleaseAt != nil

		ghStarsVal := 0
		if ghStars != nil {
			ghStarsVal = *ghStars
		}

		dockerSupported := true
		if app.DockerSupported != nil {
			dockerSupported = *app.DockerSupported
		}
		officialDockerImage := false
		if app.OfficialDockerImage != nil {
			officialDockerImage = *app.OfficialDockerImage
		}

		tier := "FREE"
		if app.Tier != "" {
			tier = app.Tier
		}
		license := "OTHER"
		if app.License != "" {
			license = app.License
		}
		deploymentComplexity := "MODERATE"
		if app.DeploymentComplexity != "" {
			deploymentComplexity = app.DeploymentComplexity
		}

		hasApi, hasMobileApp, hasSSOSupport, hasBackupTool, hasMultiLanguage, hasAuditLog, hasGuestAccess, hasOfflineMode := false, false, false, false, false, false, false, false
		if app.Features != nil {
			hasApi = app.Features.HasAPI
			hasMobileApp = app.Features.HasMobileApp
			hasSSOSupport = app.Features.HasSSOSupport
			hasBackupTool = app.Features.HasBackupTool
			hasMultiLanguage = app.Features.HasMultiLanguage
			hasAuditLog = app.Features.HasAuditLog
			hasGuestAccess = app.Features.HasGuestAccess
			hasOfflineMode = app.Features.HasOfflineMode
		}

		hasAffiliate, affiliateUrl, affiliateSignupUrl := false, "", ""
		if app.Affiliate != nil {
			hasAffiliate = app.Affiliate.HasAffiliate
			affiliateUrl = app.Affiliate.AffiliateUrl
			affiliateSignupUrl = app.Affiliate.AffiliateSignupUrl
		}

		minRam := "512MB"
		if app.MinRam != "" {
			minRam = app.MinRam
		}
		businessRelevance := 5
		if app.BusinessRelevance > 0 {
			businessRelevance = app.BusinessRelevance
		}

		githubUrl := app.GitHubUrl
		if githubUrl == "" && app.Meta != nil && app.Meta.GitHub != "" {
			githubUrl = app.Meta.GitHub
		}
		websiteUrl := app.WebsiteUrl
		if websiteUrl == "" && app.Meta != nil && app.Meta.Website != "" {
			websiteUrl = app.Meta.Website
		}
		docsUrl := app.DocsUrl
		if docsUrl == "" && app.Meta != nil && app.Meta.Docs != "" {
			docsUrl = app.Meta.Docs
		}
		logoUrl := app.LogoUrl
		if logoUrl == "" && app.Meta != nil && app.Meta.Logo != "" {
			logoUrl = app.Meta.Logo
		}

		replaces := app.Replaces
		if replaces == nil {
			replaces = []string{}
		}
		tags := app.Tags
		if tags == nil {
			tags = []string{}
		}

		var appID string
		err = pool.QueryRow(ctx, `
			INSERT INTO "App" (
				id, slug, name, category, description, subdomain, tier, "dockerImage", "dockerHubUrl", "dockerSupported", "officialDockerImage",
				"websiteUrl", "githubUrl", "docsUrl", "logoUrl", port, "minRam", license, "deploymentComplexity", replaces, tags,
				"githubStars", "lastCommitAt", "lastReleaseAt", "activelyMaintained",
				"hasApi", "hasMobileApp", "hasSSOSupport", "hasBackupTool", "hasMultiLanguage", "hasAuditLog", "hasGuestAccess", "hasOfflineMode",
				"hasAffiliate", "affiliateUrl", "affiliateSignupUrl", featured, "businessRelevance", "isActive",
				"dockerVerifiedAt", "maintenanceVerifiedAt", "metaVerifiedAt", "updatedAt"
			) VALUES (
				gen_random_uuid(), $1, $2, $3, $4, $5, $6::"AppTier", $7, NULLIF($8,''), $9, $10,
				NULLIF($11,''), NULLIF($12,''), NULLIF($13,''), NULLIF($14,''), $15, $16, NULLIF($17,'')::"LicenseType", $18::"DeploymentComplexity", $19, $20,
				NULLIF($21,0), $22, $23, $24,
				$25, $26, $27, $28, $29, $30, $31, $32,
				$33, NULLIF($34,''), NULLIF($35,''), $36, $37, true,
				CASE WHEN $38 THEN NOW() ELSE NULL END,
				CASE WHEN $39 THEN NOW() ELSE NULL END,
				NOW(),
				NOW()
			)
			ON CONFLICT (slug) DO UPDATE SET
				name = EXCLUDED.name, category = EXCLUDED.category, description = EXCLUDED.description, subdomain = EXCLUDED.subdomain,
				tier = EXCLUDED.tier, "dockerImage" = EXCLUDED."dockerImage", "dockerHubUrl" = EXCLUDED."dockerHubUrl",
				"dockerSupported" = EXCLUDED."dockerSupported", "officialDockerImage" = EXCLUDED."officialDockerImage",
				"websiteUrl" = EXCLUDED."websiteUrl", "githubUrl" = EXCLUDED."githubUrl", "docsUrl" = EXCLUDED."docsUrl", "logoUrl" = EXCLUDED."logoUrl",
				port = EXCLUDED.port, "minRam" = EXCLUDED."minRam", license = EXCLUDED.license, "deploymentComplexity" = EXCLUDED."deploymentComplexity",
				replaces = EXCLUDED.replaces, tags = EXCLUDED.tags,
				"githubStars" = EXCLUDED."githubStars", "lastCommitAt" = EXCLUDED."lastCommitAt", "lastReleaseAt" = EXCLUDED."lastReleaseAt",
				"activelyMaintained" = EXCLUDED."activelyMaintained",
				"hasApi" = EXCLUDED."hasApi", "hasMobileApp" = EXCLUDED."hasMobileApp", "hasSSOSupport" = EXCLUDED."hasSSOSupport",
				"hasBackupTool" = EXCLUDED."hasBackupTool", "hasMultiLanguage" = EXCLUDED."hasMultiLanguage", "hasAuditLog" = EXCLUDED."hasAuditLog",
				"hasGuestAccess" = EXCLUDED."hasGuestAccess", "hasOfflineMode" = EXCLUDED."hasOfflineMode",
				"hasAffiliate" = EXCLUDED."hasAffiliate", "affiliateUrl" = EXCLUDED."affiliateUrl", "affiliateSignupUrl" = EXCLUDED."affiliateSignupUrl",
				featured = EXCLUDED.featured, "businessRelevance" = EXCLUDED."businessRelevance", "isActive" = true,
				"dockerVerifiedAt" = CASE WHEN $38 THEN NOW() ELSE "App"."dockerVerifiedAt" END,
				"maintenanceVerifiedAt" = CASE WHEN $39 THEN NOW() ELSE "App"."maintenanceVerifiedAt" END,
				"metaVerifiedAt" = NOW(),
				"updatedAt" = NOW()
			RETURNING id
		`,
			app.Slug, app.Name, app.Category, app.Description, app.Subdomain, tier, dockerImage,
			app.DockerHubUrl, dockerSupported, officialDockerImage,
			websiteUrl, githubUrl, docsUrl, logoUrl, app.Port, minRam, license, deploymentComplexity,
			replaces, tags,
			ghStarsVal, lastCommitAt, lastReleaseAt, activelyMaintained,
			hasApi, hasMobileApp, hasSSOSupport, hasBackupTool, hasMultiLanguage, hasAuditLog, hasGuestAccess, hasOfflineMode,
			hasAffiliate, affiliateUrl, affiliateSignupUrl, app.Featured, businessRelevance,
			dockerVerified, maintenanceVerified,
		).Scan(&appID)

		if err != nil {
			log.Printf("error: failed to upsert %s: %v", app.Slug, err)
			errors++
			continue
		}

		// Delete existing AppDependency rows, then insert fresh
		_, err = pool.Exec(ctx, `DELETE FROM "AppDependency" WHERE "appId" = $1`, appID)
		if err != nil {
			log.Printf("error: failed to delete dependencies for %s: %v", app.Slug, err)
			errors++
			continue
		}

		for _, dep := range app.Dependencies {
			depSlug := dep.DependencySlug
			if depSlug == "" {
				depSlug = dep.Slug
			}
			if depSlug == "" {
				continue
			}
			depType := dep.Type
			if depType == "" {
				depType = "DATABASE"
			}
			_, err = pool.Exec(ctx, `
				INSERT INTO "AppDependency" (id, "appId", "dependencySlug", type, optional)
				VALUES (gen_random_uuid(), $1, $2, $3::"DependencyType", $4)
			`, appID, depSlug, depType, dep.Optional)
			if err != nil {
				log.Printf("warning: failed to insert dependency %s for %s: %v", depSlug, app.Slug, err)
				warnings++
			}
		}

		yamlSlugs = append(yamlSlugs, app.Slug)
		synced++

		// Check for missing MDX
		mdxPath := filepath.Join(contentDir, app.Slug+".mdx")
		if _, err := os.Stat(mdxPath); os.IsNotExist(err) {
			log.Printf("warning: missing MDX file: registry/content/apps/%s.mdx", app.Slug)
			warnings++
		}
	}

	// Soft delete: set isActive=false for apps not in YAML
	if len(yamlSlugs) > 0 {
		result, err := pool.Exec(ctx, `UPDATE "App" SET "isActive" = false WHERE NOT (slug = ANY($1))`, yamlSlugs)
		if err != nil {
			log.Printf("error: failed to deactivate removed apps: %v", err)
			errors++
		} else {
			deactivated = int(result.RowsAffected())
		}
	}

	// Summary
	fmt.Printf("\n--- Sync Summary ---\n")
	fmt.Printf("Synced: %d\n", synced)
	fmt.Printf("Warnings: %d\n", warnings)
	fmt.Printf("Errors: %d\n", errors)
	fmt.Printf("Deactivated: %d\n", deactivated)

	if errors > 0 {
		os.Exit(1)
	}
	os.Exit(0)
}

func findProjectRoot() string {
	dir, err := os.Getwd()
	if err != nil {
		return ""
	}
	for {
		if _, err := os.Stat(filepath.Join(dir, "registry", "repos.txt")); err == nil {
			return dir
		}
		if _, err := os.Stat(filepath.Join(dir, "registry", "apps")); err == nil {
			return dir
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			return ""
		}
		dir = parent
	}
}

func extractOwnerRepo(githubURL string) (owner, repo string, ok bool) {
	if githubURL == "" {
		return "", "", false
	}
	// Match https://github.com/owner/repo or https://github.com/owner/repo/
	re := regexp.MustCompile(`github\.com/([^/]+)/([^/]+)`)
	m := re.FindStringSubmatch(githubURL)
	if len(m) != 3 {
		return "", "", false
	}
	return m[1], strings.TrimSuffix(m[2], ".git"), true
}

func fetchGitHubStats(client *http.Client, token string, app AppYAML) (*int, *time.Time, *time.Time) {
	githubURL := app.GitHubUrl
	if githubURL == "" && app.Meta != nil {
		githubURL = app.Meta.GitHub
	}
	owner, repo, ok := extractOwnerRepo(githubURL)
	if !ok {
		return nil, nil, nil
	}

	url := fmt.Sprintf("https://api.github.com/repos/%s/%s", owner, repo)
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("Accept", "application/vnd.github.v3+json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, nil, nil
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil, nil, nil
	}

	var gh ghRepoResponse
	if err := json.NewDecoder(resp.Body).Decode(&gh); err != nil {
		return nil, nil, nil
	}

	stars := gh.StargazersCount
	var lastCommitAt, lastReleaseAt *time.Time
	if gh.PushedAt != "" {
		t, err := time.Parse(time.RFC3339, gh.PushedAt)
		if err == nil {
			lastCommitAt = &t
		}
	}

	// Fetch latest release
	relURL := fmt.Sprintf("https://api.github.com/repos/%s/%s/releases/latest", owner, repo)
	relReq, _ := http.NewRequest("GET", relURL, nil)
	relReq.Header.Set("Accept", "application/vnd.github.v3+json")
	if token != "" {
		relReq.Header.Set("Authorization", "Bearer "+token)
	}
	relResp, err := client.Do(relReq)
	if err == nil && relResp.StatusCode == 200 {
		var rel ghReleaseResponse
		if json.NewDecoder(relResp.Body).Decode(&rel) == nil && rel.Published != "" {
			t, err := time.Parse(time.RFC3339, rel.Published)
			if err == nil {
				lastReleaseAt = &t
			}
		}
		relResp.Body.Close()
	}

	return &stars, lastCommitAt, lastReleaseAt
}

func fetchDockerHubLastUpdated(client *http.Client, image string) (string, error) {
	parts := strings.SplitN(image, "/", 2)
	var ns, img string
	if len(parts) == 2 {
		ns, img = parts[0], parts[1]
	} else {
		ns = "library"
		img = parts[0]
	}

	url := fmt.Sprintf("https://hub.docker.com/v2/repositories/%s/%s/tags/?page_size=1&ordering=-last_updated", ns, img)
	resp, err := client.Get(url)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return "", fmt.Errorf("status %d", resp.StatusCode)
	}

	var dr dockerTagsResponse
	if err := json.NewDecoder(resp.Body).Decode(&dr); err != nil {
		return "", err
	}
	if len(dr.Results) == 0 {
		return "", nil
	}
	return dr.Results[0].LastUpdated, nil
}
