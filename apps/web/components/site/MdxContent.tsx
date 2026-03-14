import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";

const proseClasses =
  "prose prose-neutral max-w-none prose-headings:font-serif prose-code:font-mono prose-code:bg-ink/10 prose-code:px-1 prose-a:underline";

const components = {
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 {...props} className="font-serif" />
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 {...props} className="font-serif" />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 {...props} className="font-serif" />
  ),
  code: (props: React.HTMLAttributes<HTMLElement>) => (
    <code {...props} className="font-mono bg-ink/10 px-1" />
  ),
  pre: (props: React.HTMLAttributes<HTMLPreElement>) => (
    <pre {...props} className="code-block" />
  ),
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...props} className="underline hover:text-accent" />
  ),
};

interface MdxContentProps {
  source: string;
}

export function MdxContent({ source }: MdxContentProps) {
  return (
    <div className={proseClasses}>
      <MDXRemote
        source={source}
        options={{
          mdxOptions: {
            remarkPlugins: [remarkGfm],
          },
        }}
        components={components}
      />
    </div>
  );
}
