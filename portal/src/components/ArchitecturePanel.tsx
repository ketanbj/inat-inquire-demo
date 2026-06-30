import { architectureSteps } from "../data/content";
import { SectionHeading, type PanelIntro } from "./SectionHeading";
import type { LucideIcon } from "lucide-react";

type FlowStep = {
  icon: LucideIcon;
  label: string;
  copy: string;
};

function FlowStepCard({ step, index }: { step: FlowStep; index: number }) {
  const StepIcon = step.icon;
  return (
    <article className="flow-step">
      <span className="step-index">{index + 1}</span>
      <StepIcon size={24} />
      <h3>{step.label}</h3>
      <p>{step.copy}</p>
    </article>
  );
}

export function ArchitecturePanel(props: PanelIntro) {
  return (
    <section className="architecture-section" aria-label="Architecture walkthrough">
      <SectionHeading {...props} />
      <div className="flow-grid">
        {architectureSteps.map((step, index) => (
          <FlowStepCard step={step} index={index} key={step.label} />
        ))}
      </div>
    </section>
  );
}
