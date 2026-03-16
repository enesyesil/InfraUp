package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"gopkg.in/yaml.v3"
)

type DependencyYAML struct {
	ID    string `yaml:"id"`
	Name  string `yaml:"name"`
	Type  string `yaml:"type"`
	Image string `yaml:"image"`
	Port  int    `yaml:"port"`
}

type DependencyRecord struct {
	Slug  string
	Name  string
	Type  string
	Image string
	Port  int
}

type AppUpsertInput struct {
	Slug                 string
	Name                 string
	Category             string
	Description          string
	Subdomain            string
	Tier                 string
	DockerImage          string
	DockerHubURL         string
	DockerSupported      bool
	OfficialDockerImage  bool
	WebsiteURL           string
	GitHubURL            string
	DocsURL              string
	LogoURL              string
	Port                 int
	MinRAM               string
	License              string
	DeploymentComplexity string
	Replaces             []string
	Tags                 []string
	Stars                int
	LastCommitAt         *time.Time
	LastReleaseAt        *time.Time
	ActivelyMaintained   bool
	HasAPI               bool
	HasMobileApp         bool
	HasSSOSupport        bool
	HasBackupTool        bool
	HasMultiLanguage     bool
	HasAuditLog          bool
	HasGuestAccess       bool
	HasOfflineMode       bool
	HasAffiliate         bool
	AffiliateURL         string
	AffiliateSignupURL   string
	Featured             bool
	BusinessRelevance    int
	DockerVerified       bool
	MaintenanceVerified  bool
}

type AppDependencyInput struct {
	Slug     string
	Type     string
	Optional bool
}

type appPersistor interface {
	UpsertApp(ctx context.Context, input AppUpsertInput) (string, error)
	ReplaceDependencies(ctx context.Context, appID string, deps []AppDependencyInput) error
}

type txRunner interface {
	RunInTx(ctx context.Context, fn func(store appPersistor) error) error
}

type pgxTxRunner struct {
	pool *pgxpool.Pool
}

type pgxAppPersistor struct {
	tx pgx.Tx
}

func (r pgxTxRunner) RunInTx(ctx context.Context, fn func(store appPersistor) error) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}

	if err := fn(&pgxAppPersistor{tx: tx}); err != nil {
		_ = tx.Rollback(ctx)
		return err
	}

	return tx.Commit(ctx)
}

func (p *pgxAppPersistor) UpsertApp(ctx context.Context, input AppUpsertInput) (string, error) {
	var appID string
	err := p.tx.QueryRow(ctx, `
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
		input.Slug, input.Name, input.Category, input.Description, input.Subdomain, input.Tier, input.DockerImage,
		input.DockerHubURL, input.DockerSupported, input.OfficialDockerImage,
		input.WebsiteURL, input.GitHubURL, input.DocsURL, input.LogoURL, input.Port, input.MinRAM, input.License, input.DeploymentComplexity,
		input.Replaces, input.Tags,
		input.Stars, input.LastCommitAt, input.LastReleaseAt, input.ActivelyMaintained,
		input.HasAPI, input.HasMobileApp, input.HasSSOSupport, input.HasBackupTool, input.HasMultiLanguage, input.HasAuditLog, input.HasGuestAccess, input.HasOfflineMode,
		input.HasAffiliate, input.AffiliateURL, input.AffiliateSignupURL, input.Featured, input.BusinessRelevance,
		input.DockerVerified, input.MaintenanceVerified,
	).Scan(&appID)

	return appID, err
}

func (p *pgxAppPersistor) ReplaceDependencies(ctx context.Context, appID string, deps []AppDependencyInput) error {
	if _, err := p.tx.Exec(ctx, `DELETE FROM "AppDependency" WHERE "appId" = $1`, appID); err != nil {
		return err
	}

	for _, dep := range deps {
		if _, err := p.tx.Exec(ctx, `
			INSERT INTO "AppDependency" (id, "appId", "dependencySlug", type, optional)
			VALUES (gen_random_uuid(), $1, $2, $3::"DependencyType", $4)
		`, appID, dep.Slug, dep.Type, dep.Optional); err != nil {
			return fmt.Errorf("insert dependency %s: %w", dep.Slug, err)
		}
	}

	return nil
}

func syncAppWithRunner(ctx context.Context, runner txRunner, input AppUpsertInput, deps []AppDependencyInput) error {
	return runner.RunInTx(ctx, func(store appPersistor) error {
		appID, err := store.UpsertApp(ctx, input)
		if err != nil {
			return fmt.Errorf("upsert app %s: %w", input.Slug, err)
		}
		if err := store.ReplaceDependencies(ctx, appID, deps); err != nil {
			return fmt.Errorf("replace dependencies for %s: %w", input.Slug, err)
		}
		return nil
	})
}

func loadDependencyRecords(dir string) (map[string]DependencyRecord, error) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, err
	}

	records := make(map[string]DependencyRecord, len(entries))
	for _, entry := range entries {
		if entry.IsDir() || filepath.Ext(entry.Name()) != ".yaml" {
			continue
		}

		path := filepath.Join(dir, entry.Name())
		data, err := os.ReadFile(path)
		if err != nil {
			return nil, fmt.Errorf("read dependency %s: %w", path, err)
		}

		var spec DependencyYAML
		if err := yaml.Unmarshal(data, &spec); err != nil {
			return nil, fmt.Errorf("parse dependency %s: %w", path, err)
		}

		record, err := normalizeDependencyRecord(spec)
		if err != nil {
			return nil, fmt.Errorf("invalid dependency %s: %w", path, err)
		}
		records[record.Slug] = record
	}

	return records, nil
}

func normalizeDependencyRecord(spec DependencyYAML) (DependencyRecord, error) {
	if spec.ID == "" || spec.Name == "" || spec.Type == "" || spec.Image == "" || spec.Port == 0 {
		return DependencyRecord{}, fmt.Errorf("missing required fields")
	}

	return DependencyRecord{
		Slug:  spec.ID,
		Name:  spec.Name,
		Type:  spec.Type,
		Image: spec.Image,
		Port:  spec.Port,
	}, nil
}

func normalizeAppDependencies(entries []DepEntry, dependencies map[string]DependencyRecord) ([]AppDependencyInput, error) {
	result := make([]AppDependencyInput, 0, len(entries))
	for _, dep := range entries {
		depSlug := dep.DependencySlug
		if depSlug == "" {
			depSlug = dep.Slug
		}
		if depSlug == "" {
			continue
		}

		record, ok := dependencies[depSlug]
		if !ok {
			return nil, fmt.Errorf("unknown dependency %s", depSlug)
		}

		depType := dep.Type
		if depType == "" {
			depType = record.Type
		}

		result = append(result, AppDependencyInput{
			Slug:     depSlug,
			Type:     depType,
			Optional: dep.Optional,
		})
	}

	return result, nil
}

func upsertDependencyRecords(ctx context.Context, pool *pgxpool.Pool, records map[string]DependencyRecord) error {
	sorted := sortedDependencyRecords(records)
	for _, record := range sorted {
		if _, err := pool.Exec(ctx, `
			INSERT INTO "Dependency" (slug, name, type, image, port, "updatedAt")
			VALUES ($1, $2, $3::"DependencyType", $4, $5, NOW())
			ON CONFLICT (slug) DO UPDATE SET
				name = EXCLUDED.name,
				type = EXCLUDED.type,
				image = EXCLUDED.image,
				port = EXCLUDED.port,
				"updatedAt" = NOW()
		`, record.Slug, record.Name, record.Type, record.Image, record.Port); err != nil {
			return fmt.Errorf("upsert dependency %s: %w", record.Slug, err)
		}
	}

	return nil
}

func cleanupInactiveAppDependencies(ctx context.Context, pool *pgxpool.Pool) error {
	_, err := pool.Exec(ctx, `
		DELETE FROM "AppDependency"
		WHERE "appId" IN (SELECT id FROM "App" WHERE "isActive" = false)
	`)
	return err
}

func cleanupStaleDependencies(ctx context.Context, pool *pgxpool.Pool, activeSlugs []string) error {
	if len(activeSlugs) == 0 {
		_, err := pool.Exec(ctx, `DELETE FROM "Dependency"`)
		return err
	}

	_, err := pool.Exec(ctx, `DELETE FROM "Dependency" WHERE NOT (slug = ANY($1))`, activeSlugs)
	return err
}

func sortedDependencyRecords(records map[string]DependencyRecord) []DependencyRecord {
	sorted := make([]DependencyRecord, 0, len(records))
	for _, record := range records {
		sorted = append(sorted, record)
	}
	sort.Slice(sorted, func(i, j int) bool {
		return sorted[i].Slug < sorted[j].Slug
	})
	return sorted
}

func sortedDependencySlugs(records map[string]DependencyRecord) []string {
	slugs := make([]string, 0, len(records))
	for slug := range records {
		slugs = append(slugs, slug)
	}
	sort.Strings(slugs)
	return slugs
}

func buildAppUpsertInput(
	app AppYAML,
	dockerImage string,
	ghStars *int,
	lastCommitAt *time.Time,
	lastReleaseAt *time.Time,
	dockerVerified bool,
) AppUpsertInput {
	activelyMaintained := true
	if lastCommitAt != nil && time.Since(*lastCommitAt) > 6*30*24*time.Hour {
		activelyMaintained = false
	}

	maintenanceVerified := lastCommitAt != nil || lastReleaseAt != nil
	stars := 0
	if ghStars != nil {
		stars = *ghStars
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

	hasAPI, hasMobileApp, hasSSOSupport, hasBackupTool := false, false, false, false
	hasMultiLanguage, hasAuditLog, hasGuestAccess, hasOfflineMode := false, false, false, false
	if app.Features != nil {
		hasAPI = app.Features.HasAPI
		hasMobileApp = app.Features.HasMobileApp
		hasSSOSupport = app.Features.HasSSOSupport
		hasBackupTool = app.Features.HasBackupTool
		hasMultiLanguage = app.Features.HasMultiLanguage
		hasAuditLog = app.Features.HasAuditLog
		hasGuestAccess = app.Features.HasGuestAccess
		hasOfflineMode = app.Features.HasOfflineMode
	}

	hasAffiliate, affiliateURL, affiliateSignupURL := false, "", ""
	if app.Affiliate != nil {
		hasAffiliate = app.Affiliate.HasAffiliate
		affiliateURL = app.Affiliate.AffiliateUrl
		affiliateSignupURL = app.Affiliate.AffiliateSignupUrl
	}

	minRAM := "512MB"
	if app.MinRam != "" {
		minRAM = app.MinRam
	}

	businessRelevance := 5
	if app.BusinessRelevance > 0 {
		businessRelevance = app.BusinessRelevance
	}

	githubURL := app.GitHubUrl
	if githubURL == "" && app.Meta != nil {
		githubURL = app.Meta.GitHub
	}

	websiteURL := app.WebsiteUrl
	if websiteURL == "" && app.Meta != nil {
		websiteURL = app.Meta.Website
	}

	docsURL := app.DocsUrl
	if docsURL == "" && app.Meta != nil {
		docsURL = app.Meta.Docs
	}

	logoURL := app.LogoUrl
	if logoURL == "" && app.Meta != nil {
		logoURL = app.Meta.Logo
	}

	replaces := app.Replaces
	if replaces == nil {
		replaces = []string{}
	}

	tags := app.Tags
	if tags == nil {
		tags = []string{}
	}

	return AppUpsertInput{
		Slug:                 app.Slug,
		Name:                 app.Name,
		Category:             app.Category,
		Description:          app.Description,
		Subdomain:            app.Subdomain,
		Tier:                 tier,
		DockerImage:          dockerImage,
		DockerHubURL:         app.DockerHubUrl,
		DockerSupported:      dockerSupported,
		OfficialDockerImage:  officialDockerImage,
		WebsiteURL:           websiteURL,
		GitHubURL:            githubURL,
		DocsURL:              docsURL,
		LogoURL:              logoURL,
		Port:                 app.Port,
		MinRAM:               minRAM,
		License:              license,
		DeploymentComplexity: deploymentComplexity,
		Replaces:             replaces,
		Tags:                 tags,
		Stars:                stars,
		LastCommitAt:         lastCommitAt,
		LastReleaseAt:        lastReleaseAt,
		ActivelyMaintained:   activelyMaintained,
		HasAPI:               hasAPI,
		HasMobileApp:         hasMobileApp,
		HasSSOSupport:        hasSSOSupport,
		HasBackupTool:        hasBackupTool,
		HasMultiLanguage:     hasMultiLanguage,
		HasAuditLog:          hasAuditLog,
		HasGuestAccess:       hasGuestAccess,
		HasOfflineMode:       hasOfflineMode,
		HasAffiliate:         hasAffiliate,
		AffiliateURL:         affiliateURL,
		AffiliateSignupURL:   affiliateSignupURL,
		Featured:             app.Featured,
		BusinessRelevance:    businessRelevance,
		DockerVerified:       dockerVerified,
		MaintenanceVerified:  maintenanceVerified,
	}
}
