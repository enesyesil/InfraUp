import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeader } from "@/components/site/SectionHeader";

export const metadata: Metadata = {
  title: "Deploy Guide — Self-Host in 5 Steps",
  description:
    "End-to-end guide to deploy self-hosted apps: pick a VPS, get a domain, set up Docker, configure Traefik, and deploy your first app.",
};

const traefikCompose = `version: "3.8"

services:
  traefik:
    image: traefik:v3.0
    command:
      - "--api.dashboard=true"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.email=you@example.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - traefik-letsencrypt:/letsencrypt
      - traefik-certs:/certs
    restart: unless-stopped

volumes:
  traefik-letsencrypt:
  traefik-certs:
`;

const dockerInstall = `# Update and install Docker
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add your user to docker group
sudo usermod -aG docker $USER
# Log out and back in for group to take effect
`;

export default function DeployPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 overflow-hidden">
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-16">
        <div className="min-w-0">
          <SectionHeader
            eyebrow="DEPLOY GUIDE"
            title="Deploy Self-Hosted Apps in 5 Steps"
            description="From zero to production. Pick a server, get a domain, install Docker, add Traefik, and deploy your first app."
          />

          <div className="space-y-16">
            {/* STEP 1 */}
            <section>
              <h2 className="font-serif text-2xl font-bold mb-4">
                Step 1: Pick a Server
              </h2>
              <p className="text-ink/70 mb-6 max-w-2xl">
                You need a VPS (or bare metal) to run your apps. These providers
                offer strong price-to-performance, global regions, and stable
                networking for self-hosted workloads.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <a
                  href="https://www.hetzner.com/cloud"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card block group"
                >
                  <span className="stamp-solid mb-3 inline-block">RECOMMENDED</span>
                  <h3 className="font-serif text-lg font-bold">Hetzner</h3>
                  <p className="mt-2 text-sm text-ink/70">
                    From €4.15/mo. Excellent value, EU & US regions.
                  </p>
                  <span className="mt-4 inline-flex font-mono text-xs uppercase tracking-wider text-ink/60 group-hover:text-ink">
                    Get server →
                  </span>
                </a>
                <a
                  href="https://www.digitalocean.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card block group"
                >
                  <h3 className="font-serif text-lg font-bold">DigitalOcean</h3>
                  <p className="mt-2 text-sm text-ink/70">
                    From $6/mo. Great UX, docs, and managed networking.
                  </p>
                  <span className="mt-4 inline-flex font-mono text-xs uppercase tracking-wider text-ink/60 group-hover:text-ink">
                    Get server →
                  </span>
                </a>
                <a
                  href="https://www.vultr.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card block group"
                >
                  <h3 className="font-serif text-lg font-bold">Vultr</h3>
                  <p className="mt-2 text-sm text-ink/70">
                    From $6/mo. Many regions, hourly billing.
                  </p>
                  <span className="mt-4 inline-flex font-mono text-xs uppercase tracking-wider text-ink/60 group-hover:text-ink">
                    Get server →
                  </span>
                </a>
                <a
                  href="https://www.linode.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card block group"
                >
                  <h3 className="font-serif text-lg font-bold">Linode (Akamai)</h3>
                  <p className="mt-2 text-sm text-ink/70">
                    Developer-friendly cloud VPS with simple pricing.
                  </p>
                  <span className="mt-4 inline-flex font-mono text-xs uppercase tracking-wider text-ink/60 group-hover:text-ink">
                    Get server →
                  </span>
                </a>
                <a
                  href="https://www.ovhcloud.com/en/bare-metal/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card block group"
                >
                  <h3 className="font-serif text-lg font-bold">OVHcloud Bare Metal</h3>
                  <p className="mt-2 text-sm text-ink/70">
                    Dedicated hardware for heavier production workloads.
                  </p>
                  <span className="mt-4 inline-flex font-mono text-xs uppercase tracking-wider text-ink/60 group-hover:text-ink">
                    Get bare metal →
                  </span>
                </a>
                <a
                  href="https://www.hivelocity.net/dedicated-servers/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card block group"
                >
                  <h3 className="font-serif text-lg font-bold">Hivelocity Bare Metal</h3>
                  <p className="mt-2 text-sm text-ink/70">
                    US-focused dedicated servers and private networking.
                  </p>
                  <span className="mt-4 inline-flex font-mono text-xs uppercase tracking-wider text-ink/60 group-hover:text-ink">
                    Get bare metal →
                  </span>
                </a>
              </div>

              <div className="ruled-divider mt-10 pt-8">
                <h3 className="font-serif text-xl font-bold mb-2">
                  Running Platforms (easier ops)
                </h3>
                <p className="text-ink/70 mb-6 max-w-2xl">
                  Prefer a dashboard to manage containers, domains, and deployments?
                  Use one of these on top of your VPS.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <a
                    href="https://coolify.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card block group"
                  >
                    <h4 className="font-serif text-lg font-bold">Coolify</h4>
                    <p className="mt-2 text-sm text-ink/70">
                      Open-source PaaS with app, DB, and domain management.
                    </p>
                    <span className="mt-4 inline-flex font-mono text-xs uppercase tracking-wider text-ink/60 group-hover:text-ink">
                      Open Coolify →
                    </span>
                  </a>
                  <a
                    href="https://dokploy.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card block group"
                  >
                    <h4 className="font-serif text-lg font-bold">Dokploy</h4>
                    <p className="mt-2 text-sm text-ink/70">
                      Docker-native deploy platform for apps, DBs, and queues.
                    </p>
                    <span className="mt-4 inline-flex font-mono text-xs uppercase tracking-wider text-ink/60 group-hover:text-ink">
                      Open Dokploy →
                    </span>
                  </a>
                  <a
                    href="https://caprover.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card block group"
                  >
                    <h4 className="font-serif text-lg font-bold">CapRover</h4>
                    <p className="mt-2 text-sm text-ink/70">
                      Minimal self-hosted PaaS with one-click app templates.
                    </p>
                    <span className="mt-4 inline-flex font-mono text-xs uppercase tracking-wider text-ink/60 group-hover:text-ink">
                      Open CapRover →
                    </span>
                  </a>
                </div>
              </div>

              <div className="ruled-divider mt-10 pt-8">
                <h3 className="font-serif text-xl font-bold mb-2">
                  Don&apos;t want to manage servers?
                </h3>
                <p className="text-ink/70 mb-6 max-w-2xl">
                  You can still run containers on managed platforms with less
                  infrastructure overhead.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <a
                    href="https://railway.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card block group"
                  >
                    <h4 className="font-serif text-lg font-bold">Railway</h4>
                    <p className="mt-2 text-sm text-ink/70">
                      Fast deploys, managed services, and simple private networking.
                    </p>
                    <span className="mt-4 inline-flex font-mono text-xs uppercase tracking-wider text-ink/60 group-hover:text-ink">
                      Open Railway →
                    </span>
                  </a>
                  <a
                    href="https://render.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card block group"
                  >
                    <h4 className="font-serif text-lg font-bold">Render</h4>
                    <p className="mt-2 text-sm text-ink/70">
                      Managed web services, Postgres, and background workers.
                    </p>
                    <span className="mt-4 inline-flex font-mono text-xs uppercase tracking-wider text-ink/60 group-hover:text-ink">
                      Open Render →
                    </span>
                  </a>
                  <a
                    href="https://fly.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card block group"
                  >
                    <h4 className="font-serif text-lg font-bold">Fly.io</h4>
                    <p className="mt-2 text-sm text-ink/70">
                      App containers close to users with global regions.
                    </p>
                    <span className="mt-4 inline-flex font-mono text-xs uppercase tracking-wider text-ink/60 group-hover:text-ink">
                      Open Fly.io →
                    </span>
                  </a>
                </div>
              </div>
            </section>

            {/* STEP 2 */}
            <section>
              <h2 className="font-serif text-2xl font-bold mb-4">
                Step 2: Get a Domain
              </h2>
              <p className="text-ink/70 mb-6 max-w-2xl">
                Point a domain (or subdomain) to your server. These registrars
                offer good prices and easy DNS management.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <a
                  href="https://www.namecheap.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card block"
                >
                  <h3 className="font-serif font-bold">Namecheap</h3>
                  <p className="mt-1 text-sm text-ink/70">Low prices, free WHOIS</p>
                </a>
                <a
                  href="https://www.cloudflare.com/products/registrar"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card block"
                >
                  <h3 className="font-serif font-bold">Cloudflare</h3>
                  <p className="mt-1 text-sm text-ink/70">At-cost pricing, DNS</p>
                </a>
                <a
                  href="https://porkbun.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card block"
                >
                  <h3 className="font-serif font-bold">Porkbun</h3>
                  <p className="mt-1 text-sm text-ink/70">Cheap, simple</p>
                </a>
              </div>
            </section>

            {/* STEP 3 */}
            <section>
              <h2 className="font-serif text-2xl font-bold mb-4">
                Step 3: Set Up the Server
              </h2>
              <p className="text-ink/70 mb-4 max-w-2xl">
                SSH into your server and install Docker and Docker Compose. Replace{" "}
                <code className="font-mono text-sm bg-ink/10 px-1">root@your-ip</code>{" "}
                with your actual user and IP.
              </p>
              <pre className="code-block p-4 text-sm overflow-x-auto mb-4 max-w-full">
<code>{`ssh root@your-ip`}</code>
              </pre>
              <pre className="code-block p-4 text-sm overflow-x-auto max-w-full">
<code>{dockerInstall}</code>
              </pre>
            </section>

            {/* STEP 4 */}
            <section>
              <h2 className="font-serif text-2xl font-bold mb-4">
                Step 4: Traefik Reverse Proxy
              </h2>
              <p className="text-ink/70 mb-4 max-w-2xl">
                Traefik handles SSL (Let&apos;s Encrypt) and routes traffic to your
                apps. Create a <code className="font-mono text-sm bg-ink/10 px-1">docker-compose.yml</code>{" "}
                and run it. Update the ACME email before deploying.
              </p>
              <pre className="code-block p-4 text-sm overflow-x-auto max-w-full">
<code>{traefikCompose}</code>
              </pre>
              <pre className="code-block p-4 text-sm overflow-x-auto max-w-full mt-4">
<code>{`docker compose up -d`}</code>
              </pre>
            </section>

            {/* STEP 5 */}
            <section>
              <h2 className="font-serif text-2xl font-bold mb-4">
                Step 5: Deploy Your First App
              </h2>
              <p className="text-ink/70 mb-4 max-w-2xl">
                Add your app&apos;s service to the same <code className="font-mono text-sm bg-ink/10 px-1">docker-compose.yml</code>{" "}
                (or a separate stack), configure Traefik labels for your domain,
                and bring it up.
              </p>
              <pre className="code-block p-4 text-sm overflow-x-auto max-w-full">
<code>{`docker compose up -d`}</code>
              </pre>
              <div className="mt-6">
                <Link href="/apps" className="btn-primary">
                  Browse app catalog
                </Link>
              </div>
            </section>
          </div>
        </div>

        {/* Sticky savings sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 border-2 border-ink p-6" style={{ boxShadow: "var(--shadow-brutal)" }}>
            <p className="eyebrow mb-3">VPS vs SaaS</p>
            <p className="font-serif text-xl font-bold mb-2">Save thousands</p>
            <p className="text-sm text-ink/70 mb-6">
              A $10/mo VPS can replace $200+/mo in SaaS subscriptions. See how
              much you could save.
            </p>
            <Link href="/calculator" className="btn-accent w-full text-center">
              Open calculator
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
