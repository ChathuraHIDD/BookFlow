import { useEffect, useMemo, useRef, useState } from "react";

function SupportDropdown({
  id,
  label,
  value,
  options,
  onChange,
  placeholder = "Select an option",
  className = "",
  disabled = false,
  align = "left",
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) || options[0],
    [options, value],
  );

  useEffect(() => {
    const handleDocumentClick = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleDocumentClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleSelect = (nextValue) => {
    onChange(nextValue);
    setOpen(false);
  };

  return (
    <div className={`support-filter-field support-filter-dropdown ${className}`} ref={rootRef}>
      <span id={`${id}-label`}>{label}</span>
      <button
        id={id}
        type="button"
        className={`support-dropdown-trigger ${open ? "is-open" : ""}`}
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${id}-label ${id}-value`}
        disabled={disabled}
      >
        <span id={`${id}-value`}>{selectedOption?.label || placeholder}</span>
        <span className="support-dropdown-caret" aria-hidden="true" />
      </button>

      {open ? (
        <div className={`support-dropdown-menu support-dropdown-menu-${align}`} role="listbox" aria-label={label}>
          {options.map((option) => {
            const active = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={active}
                className={`support-dropdown-option ${active ? "is-active" : ""}`}
                onClick={() => handleSelect(option.value)}
              >
                <span>{option.label}</span>
                {active ? <span className="support-dropdown-check" aria-hidden="true">✓</span> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default SupportDropdown;