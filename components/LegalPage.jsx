import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export default function LegalPage({ title, description, sections, otherPolicyHref, otherPolicyLabel }) {
  return (
    <>
      <SiteHeader />
      <main className="legal-page">
        <div className="wrap narrow">
          <Link className="legal-back" href="/help">← Help &amp; FAQs</Link>
          <header className="legal-heading">
            <p className="legal-eyebrow">Vanify · Hyderabad</p>
            <h1>{title}</h1>
            <p className="legal-description">{description}</p>
            <p className="legal-updated">Last updated: 31 October 2026</p>
          </header>

          <nav className="legal-toc" aria-label={`${title} contents`}>
            <h2>On this page</h2>
            <ol>
              {sections.map((section, index) => (
                <li key={section.title}>
                  <a href={`#section-${index + 1}`}>{section.title}</a>
                </li>
              ))}
            </ol>
          </nav>

          <article className="legal-content">
            {sections.map((section, index) => (
              <section className="legal-section" id={`section-${index + 1}`} key={section.title}>
                <h2>{index + 1}. {section.title}</h2>
                {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {section.bullets && (
                  <ul>
                    {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                  </ul>
                )}
              </section>
            ))}
          </article>

          <p className="legal-related">
            Also read <Link href={otherPolicyHref}>{otherPolicyLabel}</Link>.
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
