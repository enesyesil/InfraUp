package main

import (
	"context"
	"errors"
	"testing"
)

type fakeAppPersistor struct {
	upsertAppID      string
	upsertErr        error
	replaceErr       error
	receivedApp      AppUpsertInput
	receivedAppID    string
	receivedDeps     []AppDependencyInput
	upsertCalled     bool
	replaceDepsCalled bool
}

func (f *fakeAppPersistor) UpsertApp(_ context.Context, input AppUpsertInput) (string, error) {
	f.upsertCalled = true
	f.receivedApp = input
	if f.upsertErr != nil {
		return "", f.upsertErr
	}
	return f.upsertAppID, nil
}

func (f *fakeAppPersistor) ReplaceDependencies(_ context.Context, appID string, deps []AppDependencyInput) error {
	f.replaceDepsCalled = true
	f.receivedAppID = appID
	f.receivedDeps = deps
	return f.replaceErr
}

type fakeTxRunner struct {
	store      *fakeAppPersistor
	committed  bool
	rolledBack bool
}

func (f *fakeTxRunner) RunInTx(ctx context.Context, fn func(store appPersistor) error) error {
	err := fn(f.store)
	if err != nil {
		f.rolledBack = true
		return err
	}
	f.committed = true
	return nil
}

func TestNormalizeAppDependenciesUsesRegistryMetadata(t *testing.T) {
	t.Parallel()

	records := map[string]DependencyRecord{
		"redis": {
			Slug:  "redis",
			Name:  "Redis",
			Type:  "CACHE",
			Image: "redis:7-alpine",
			Port:  6379,
		},
	}

	deps, err := normalizeAppDependencies([]DepEntry{{DependencySlug: "redis"}}, records)
	if err != nil {
		t.Fatalf("expected dependencies to normalize, got error: %v", err)
	}
	if len(deps) != 1 {
		t.Fatalf("expected one dependency, got %d", len(deps))
	}
	if deps[0].Type != "CACHE" {
		t.Fatalf("expected dependency type to come from registry, got %s", deps[0].Type)
	}
}

func TestNormalizeAppDependenciesRejectsUnknownDependency(t *testing.T) {
	t.Parallel()

	_, err := normalizeAppDependencies([]DepEntry{{DependencySlug: "unknown"}}, map[string]DependencyRecord{})
	if err == nil {
		t.Fatal("expected unknown dependency to fail normalization")
	}
}

func TestSyncAppWithRunnerCommitsOnSuccess(t *testing.T) {
	t.Parallel()

	store := &fakeAppPersistor{upsertAppID: "app-123"}
	runner := &fakeTxRunner{store: store}
	deps := []AppDependencyInput{{Slug: "postgres", Type: "DATABASE"}}
	input := AppUpsertInput{Slug: "listmonk", Name: "Listmonk"}

	if err := syncAppWithRunner(context.Background(), runner, input, deps); err != nil {
		t.Fatalf("expected sync to succeed, got error: %v", err)
	}
	if !runner.committed {
		t.Fatal("expected transaction runner to commit on success")
	}
	if runner.rolledBack {
		t.Fatal("did not expect transaction runner to roll back on success")
	}
	if !store.upsertCalled || !store.replaceDepsCalled {
		t.Fatal("expected app upsert and dependency replacement to both run")
	}
	if store.receivedAppID != "app-123" {
		t.Fatalf("expected dependency replacement to receive upserted app ID, got %s", store.receivedAppID)
	}
	if len(store.receivedDeps) != 1 || store.receivedDeps[0].Slug != "postgres" {
		t.Fatalf("expected dependency replacement to receive normalized deps, got %#v", store.receivedDeps)
	}
}

func TestSyncAppWithRunnerRollsBackOnDependencyFailure(t *testing.T) {
	t.Parallel()

	store := &fakeAppPersistor{
		upsertAppID: "app-123",
		replaceErr:  errors.New("boom"),
	}
	runner := &fakeTxRunner{store: store}

	err := syncAppWithRunner(context.Background(), runner, AppUpsertInput{Slug: "chatwoot"}, []AppDependencyInput{{Slug: "redis", Type: "CACHE"}})
	if err == nil {
		t.Fatal("expected sync to fail when dependency persistence fails")
	}
	if runner.committed {
		t.Fatal("did not expect transaction runner to commit on dependency failure")
	}
	if !runner.rolledBack {
		t.Fatal("expected transaction runner to roll back on dependency failure")
	}
}
