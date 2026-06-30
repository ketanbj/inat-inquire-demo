import { AudienceKey, audiences } from "../data/content";

type AudiencePickerProps = {
  selected: AudienceKey;
  onSelect: (key: AudienceKey) => void;
};

export function AudiencePicker({ selected, onSelect }: AudiencePickerProps) {
  return (
    <section className="mode-band" aria-label="Audience views">
      <div className="mode-grid">
        {audiences.map((audience) => {
          const Icon = audience.icon;
          const isSelected = audience.key === selected;
          return (
            <button
              key={audience.key}
              className={isSelected ? "mode-tile active" : "mode-tile"}
              onClick={() => onSelect(audience.key)}
              type="button"
            >
              <Icon size={24} />
              <span>
                <strong>{audience.label}</strong>
                <small>{audience.caption}</small>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
