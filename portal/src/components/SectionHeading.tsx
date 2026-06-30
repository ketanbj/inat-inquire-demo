export type PanelIntro = {
  eyebrow: string;
  title: string;
  context?: string;
};

export function SectionHeading({ eyebrow, title, context }: PanelIntro) {
  return (
    <>
      <div className="section-heading">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
      </div>
      {context ? <p className="section-context">{context}</p> : null}
    </>
  );
}
