import { useState, useRef, useCallback } from "react";

const STRIPE_LINK = "https://buy.stripe.com/test_aFa9AT8E89I978x4tr2Fa00";

const CORAL       = "#D85A30";
const CORAL_LIGHT = "#FAECE7";
const CORAL_MID   = "#F0997B";
const TEAL        = "#1D9E75";
const TEAL_LIGHT  = "#E1F5EE";
const GRAY_TEXT   = "#5F5E5A";
const DARK        = "#2C2C2A";
const BORDER      = "rgba(0,0,0,0.08)";

const STEPS = [
  { id: 1, label: "Your details",  icon: "ti-user"        },
  { id: 2, label: "Your car",      icon: "ti-car"         },
  { id: 3, label: "Documents",     icon: "ti-upload"      },
  { id: 4, label: "Declarations",  icon: "ti-checkbox"    },
  { id: 5, label: "Review & pay",  icon: "ti-credit-card" },
];

const CHECKS = [
  { icon: "ti-id",          label: "Identity verified",    desc: "Government ID checked"          },
  { icon: "ti-file-check",  label: "Ownership confirmed",  desc: "Rego certificate matched"       },
  { icon: "ti-search",      label: "PPSR search",          desc: "No finance owing"               },
  { icon: "ti-license",     label: "Registration current", desc: "State portal confirmed"         },
  { icon: "ti-gauge",       label: "Odometer verified",    desc: "Photo reviewed & cross-checked" },
  { icon: "ti-camera",      label: "Photos reviewed",      desc: "Condition as described"         },
];

const UPLOADS = [
  { key: "lic_front",  label: "Licence — front",          icon: "ti-id"        },
  { key: "lic_back",   label: "Licence — back",           icon: "ti-id"        },
  { key: "rego_cert",  label: "Registration certificate", icon: "ti-file-text" },
  { key: "odometer",   label: "Odometer photo (today)",   icon: "ti-gauge"     },
  { key: "ext_front",  label: "Exterior — front",         icon: "ti-car"       },
  { key: "ext_rear",   label: "Exterior — rear",          icon: "ti-car"       },
  { key: "ext_left",   label: "Driver side",              icon: "ti-car"       },
  { key: "ext_right",  label: "Passenger side",           icon: "ti-car"       },
  { key: "engine",     label: "Engine bay",               icon: "ti-engine"    },
  { key: "interior",   label: "Interior",                 icon: "ti-armchair"  },
];

const DECLS = [
  "I am the sole registered owner of this vehicle.",
  "There is no money owing on this vehicle to my knowledge.",
  "The odometer reading I have provided is accurate.",
  "I have not knowingly withheld information about accident or flood damage.",
  "I agree to VeriAuto’s Terms of Service and Privacy Policy.",
];

const inputStyle = {
  width: "100%", boxSizing: "border-box", height: 42,
  padding: "0 14px", borderRadius: 8, fontSize: 14,
  border: `1.5px solid ${BORDER}`, outline: "none",
  background: "var(--color-background-primary)",
  color: "var(--color-text-primary)", transition: "border-color 0.2s",
  fontFamily: "var(--font-sans)",
};

function ProgressBar({ step }) {
  const pct = ((step - 1) / (STEPS.length - 1)) * 100;
  return (
    <div style={{ position: "relative", padding: "0 0 2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
        {STEPS.map((s) => {
          const done   = step > s.id;
          const active = step === s.id;
          return (
            <div key={s.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1 }}>
              <div style={{
                width: 38, height: 38, borderRadius: "50%",
                background: done ? TEAL : active ? CORAL : "var(--color-background-secondary)",
                border: `2px solid ${done ? TEAL : active ? CORAL : BORDER}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.35s ease", boxShadow: active ? `0 0 0 4px ${CORAL_LIGHT}` : "none",
              }}>
                {done
                  ? <i className="ti ti-check" style={{ fontSize: 16, color: "#fff" }} />
                  : <i className={`ti ${s.icon}`} style={{ fontSize: 15, color: active ? "#fff" : GRAY_TEXT }} />
                }
              </div>
              <span style={{
                fontSize: 11, fontWeight: active ? 500 : 400,
                color: active ? CORAL : done ? TEAL : GRAY_TEXT,
                textAlign: "center", lineHeight: 1.3, transition: "color 0.3s",
              }}>{s.label}</span>
            </div>
          );
        })}
      </div>
      <div style={{
        position: "absolute", top: 19, left: "calc(10% + 4px)", right: "calc(10% + 4px)",
        height: 2, background: BORDER, zIndex: 0,
      }}>
        <div style={{
          height: "100%", background: `linear-gradient(90deg, ${TEAL}, ${CORAL})`,
          width: `${pct}%`, transition: "width 0.4s ease", borderRadius: 2,
        }} />
      </div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: DARK, marginBottom: 6 }}>
        {label}
        {hint && <span style={{ fontWeight: 400, color: GRAY_TEXT, marginLeft: 6 }}>{hint}</span>}
      </label>
      {children}
    </div>
  );
}

function Input({ placeholder, value, onChange, type = "text" }) {
  const [focused, setFocused] = useState(false);
  return (
    <input type={type} placeholder={placeholder} value={value} onChange={onChange}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{ ...inputStyle, borderColor: focused ? CORAL : BORDER }} />
  );
}

function Select({ options, value, onChange }) {
  const [focused, setFocused] = useState(false);
  return (
    <select value={value} onChange={onChange}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{ ...inputStyle, cursor: "pointer", borderColor: focused ? CORAL : BORDER }}>
      <option value="">Select…</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function CTA({ label, onClick, disabled, secondary }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        height: 46, padding: "0 28px", borderRadius: 10, fontSize: 15,
        fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer",
        border: secondary ? `1.5px solid ${BORDER}` : "none",
        background: secondary ? "transparent"
          : disabled ? "#D3D1C7"
          : hov ? "#993C1D"
          : CORAL,
        color: secondary ? "var(--color-text-primary)"
          : disabled ? GRAY_TEXT
          : "#fff",
        transition: "all 0.2s", fontFamily: "var(--font-sans)",
      }}>
      {label}
    </button>
  );
}

function Step1({ data, setData }) {
  return (
    <div>
      <div style={{ marginBottom: "1.75rem" }}>
        <h2 style={{ fontSize: 20, fontWeight: 500, color: DARK, margin: "0 0 6px" }}>About you</h2>
        <p style={{ fontSize: 14, color: GRAY_TEXT, margin: 0 }}>
          Your details must match your driver&apos;s licence exactly.
        </p>
      </div>
      <Field label="Full legal name" hint="as it appears on your licence">
        <Input placeholder="e.g. Mohammed Al-Hassan" value={data.name}
          onChange={e => setData({ ...data, name: e.target.value })} />
      </Field>
      <Field label="Mobile number">
        <Input placeholder="+61 4XX XXX XXX" value={data.mobile} type="tel"
          onChange={e => setData({ ...data, mobile: e.target.value })} />
      </Field>
      <Field label="Email address">
        <Input placeholder="you@email.com" value={data.email} type="email"
          onChange={e => setData({ ...data, email: e.target.value })} />
      </Field>
      <Field label="Suburb and state">
        <Input placeholder="e.g. Auburn, NSW" value={data.suburb}
          onChange={e => setData({ ...data, suburb: e.target.value })} />
      </Field>
      <div style={{
        background: CORAL_LIGHT, borderRadius: 10, padding: "0.9rem 1rem",
        display: "flex", gap: 10, alignItems: "flex-start",
        border: `1px solid ${CORAL_MID}`, marginTop: "0.5rem",
      }}>
        <i className="ti ti-info-circle" style={{ fontSize: 16, color: CORAL, flexShrink: 0, marginTop: 1 }} />
        <span style={{ fontSize: 12, color: "#711B0C", lineHeight: 1.5 }}>
          Your name here must match your registration certificate exactly.
          A mismatch is the most common reason applications are delayed.
        </span>
      </div>
    </div>
  );
}

function Step2({ data, setData }) {
  const STATES = ["NSW", "VIC", "QLD", "SA", "WA", "ACT", "TAS", "NT"];
  const MAKES  = ["Toyota", "Mazda", "Honda", "Hyundai", "Ford", "Kia", "Nissan",
                  "Mitsubishi", "Subaru", "BMW", "Mercedes-Benz", "Volkswagen",
                  "Holden", "Lexus", "Other"];
  return (
    <div>
      <div style={{ marginBottom: "1.75rem" }}>
        <h2 style={{ fontSize: 20, fontWeight: 500, color: DARK, margin: "0 0 6px" }}>About your car</h2>
        <p style={{ fontSize: 14, color: GRAY_TEXT, margin: 0 }}>
          Have your registration certificate handy — you&apos;ll need the VIN.
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <Field label="Make">
          <Select options={MAKES} value={data.make}
            onChange={e => setData({ ...data, make: e.target.value })} />
        </Field>
        <Field label="Year">
          <Input placeholder="e.g. 2019" value={data.year} type="number"
            onChange={e => setData({ ...data, year: e.target.value })} />
        </Field>
      </div>
      <Field label="Model">
        <Input placeholder="e.g. Camry Ascent Sport" value={data.model}
          onChange={e => setData({ ...data, model: e.target.value })} />
      </Field>
      <Field label="VIN" hint="17 characters — on your rego certificate">
        <Input placeholder="e.g. JTDKN3DU4A0000000" value={data.vin}
          onChange={e => setData({ ...data, vin: e.target.value.toUpperCase() })} />
        {data.vin && data.vin.length !== 17 && (
          <span style={{ fontSize: 12, color: "#A32D2D", marginTop: 4, display: "block" }}>
            VIN must be exactly 17 characters ({data.vin.length} entered)
          </span>
        )}
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <Field label="Registration plate">
          <Input placeholder="e.g. ABC123" value={data.rego}
            onChange={e => setData({ ...data, rego: e.target.value.toUpperCase() })} />
        </Field>
        <Field label="State registered">
          <Select options={STATES} value={data.state}
            onChange={e => setData({ ...data, state: e.target.value })} />
        </Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <Field label="Odometer (km)">
          <Input placeholder="e.g. 87400" value={data.odo} type="number"
            onChange={e => setData({ ...data, odo: e.target.value })} />
        </Field>
        <Field label="Asking price (AUD)">
          <Input placeholder="e.g. 18500" value={data.price} type="number"
            onChange={e => setData({ ...data, price: e.target.value })} />
        </Field>
      </div>
    </div>
  );
}

function UploadTile({ item, file, onFile }) {
  const inputRef = useRef(null);

  const handleChange = useCallback((e) => {
    const selected = e.target.files[0];
    if (selected) onFile(item.key, selected);
    e.target.value = "";
  }, [item.key, onFile]);

  const truncate = (name) => name.length > 18 ? name.slice(0, 15) + "…" : name;

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        style={{ display: "none" }}
        onChange={handleChange}
      />
      <div onClick={() => inputRef.current.click()} style={{
        border: `1.5px dashed ${file ? TEAL : BORDER}`,
        borderRadius: 10, padding: "14px 12px",
        background: file ? TEAL_LIGHT : "var(--color-background-secondary)",
        cursor: "pointer", transition: "all 0.2s",
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: 8, textAlign: "center", minHeight: 90, justifyContent: "center",
      }}>
        {file
          ? <i className="ti ti-check" style={{ fontSize: 22, color: TEAL }} />
          : <i className={`ti ${item.icon}`} style={{ fontSize: 22, color: GRAY_TEXT }} />
        }
        <span style={{ fontSize: 12, color: file ? TEAL : GRAY_TEXT, fontWeight: file ? 500 : 400, lineHeight: 1.3 }}>
          {file ? truncate(file.name) : item.label}
        </span>
        {file && (
          <span style={{ fontSize: 10, color: GRAY_TEXT }}>tap to change</span>
        )}
      </div>
    </>
  );
}

function Step3({ uploads, setUploads }) {
  const done  = Object.values(uploads).filter(Boolean).length;
  const total = UPLOADS.length;
  const pct   = Math.round((done / total) * 100);
  const onFile = useCallback((key, file) => setUploads(prev => ({ ...prev, [key]: file })), [setUploads]);

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: 20, fontWeight: 500, color: DARK, margin: "0 0 6px" }}>Upload your documents</h2>
        <p style={{ fontSize: 14, color: GRAY_TEXT, margin: "0 0 1rem" }}>
          Tap a tile to select a file. JPG, PNG or PDF, max 10 MB each.
        </p>
        <div style={{ background: "var(--color-background-secondary)", borderRadius: 8, height: 8, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${pct}%`,
            background: pct === 100 ? TEAL : CORAL,
            transition: "width 0.3s ease, background 0.3s", borderRadius: 8,
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          <span style={{ fontSize: 12, color: GRAY_TEXT }}>{done} of {total} uploaded</span>
          <span style={{ fontSize: 12, fontWeight: 500, color: pct === 100 ? TEAL : CORAL }}>{pct}%</span>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
        {UPLOADS.map(item => (
          <UploadTile key={item.key} item={item} file={uploads[item.key]} onFile={onFile} />
        ))}
      </div>
      <div style={{
        marginTop: "1.25rem", background: TEAL_LIGHT, borderRadius: 10,
        padding: "0.9rem 1rem", display: "flex", gap: 10,
        alignItems: "flex-start", border: `1px solid #9FE1CB`,
      }}>
        <i className="ti ti-bulb" style={{ fontSize: 16, color: TEAL, flexShrink: 0, marginTop: 1 }} />
        <span style={{ fontSize: 12, color: "#085041", lineHeight: 1.5 }}>
          Take odometer and exterior photos in good daylight.
          Make sure the rego plate is visible in at least one exterior photo.
        </span>
      </div>
    </div>
  );
}

function Step4({ agreed, setAgreed }) {
  const toggle = (i) => setAgreed(prev => prev.map((v, j) => j === i ? !v : v));
  const allDone = agreed.every(Boolean);

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: 20, fontWeight: 500, color: DARK, margin: "0 0 6px" }}>Declarations</h2>
        <p style={{ fontSize: 14, color: GRAY_TEXT, margin: 0 }}>
          All five must be confirmed before your application is submitted.
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {DECLS.map((d, i) => (
          <div key={i} onClick={() => toggle(i)} style={{
            display: "flex", alignItems: "flex-start", gap: 14, padding: "1rem 1.1rem",
            borderRadius: 10, cursor: "pointer",
            border: `1.5px solid ${agreed[i] ? TEAL : BORDER}`,
            background: agreed[i] ? TEAL_LIGHT : "var(--color-background-secondary)",
            transition: "all 0.2s",
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1,
              border: `2px solid ${agreed[i] ? TEAL : BORDER}`,
              background: agreed[i] ? TEAL : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s",
            }}>
              {agreed[i] && <i className="ti ti-check" style={{ fontSize: 12, color: "#fff" }} />}
            </div>
            <span style={{ fontSize: 13, color: agreed[i] ? "#085041" : DARK, lineHeight: 1.5 }}>{d}</span>
          </div>
        ))}
      </div>
      {allDone && (
        <div style={{
          marginTop: "1.25rem", background: TEAL_LIGHT, borderRadius: 10,
          padding: "0.9rem 1rem", display: "flex", gap: 10,
          alignItems: "center", border: `1px solid #9FE1CB`,
        }}>
          <i className="ti ti-circle-check" style={{ fontSize: 18, color: TEAL }} />
          <span style={{ fontSize: 13, fontWeight: 500, color: "#085041" }}>All confirmed — you&apos;re ready for review.</span>
        </div>
      )}
    </div>
  );
}

function Step5({ carData, sellerData, onPay, submitting, error }) {
  const car = `${carData.year || "—"} ${carData.make || "—"} ${carData.model || "—"}`;
  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: 20, fontWeight: 500, color: DARK, margin: "0 0 6px" }}>Review & pay</h2>
        <p style={{ fontSize: 14, color: GRAY_TEXT, margin: 0 }}>
          Check everything below, then proceed to payment.
        </p>
      </div>

      <div style={{
        background: "var(--color-background-secondary)", borderRadius: 12,
        padding: "1.25rem", marginBottom: "1rem", border: `1px solid ${BORDER}`,
      }}>
        <p style={{ fontSize: 12, fontWeight: 500, color: GRAY_TEXT, margin: "0 0 0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Seller</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { label: "Name",   val: sellerData.name   || "—" },
            { label: "Email",  val: sellerData.email  || "—" },
            { label: "Mobile", val: sellerData.mobile || "—" },
          ].map(({ label, val }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
              <span style={{ color: GRAY_TEXT }}>{label}</span>
              <span style={{ color: DARK }}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        background: "var(--color-background-secondary)", borderRadius: 12,
        padding: "1.25rem", marginBottom: "1.5rem", border: `1px solid ${BORDER}`,
      }}>
        <p style={{ fontSize: 12, fontWeight: 500, color: GRAY_TEXT, margin: "0 0 0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Vehicle</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { label: "Car",   val: car },
            { label: "VIN",   val: carData.vin   || "—" },
            { label: "Rego",  val: carData.rego  ? `${carData.rego} (${carData.state})` : "—" },
            { label: "Odo",   val: carData.odo   ? `${parseInt(carData.odo).toLocaleString()} km` : "—" },
            { label: "Price", val: carData.price ? `$${parseInt(carData.price).toLocaleString()}` : "—" },
          ].map(({ label, val }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
              <span style={{ color: GRAY_TEXT }}>{label}</span>
              <span style={{ color: DARK }}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        background: `linear-gradient(135deg, ${CORAL_LIGHT}, #EEEDFE)`,
        borderRadius: 14, padding: "1.5rem",
        border: `1px solid ${CORAL_MID}`, marginBottom: "1rem",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 500, color: DARK, margin: "0 0 3px" }}>Verified Listing Certificate</p>
            <p style={{ fontSize: 13, color: GRAY_TEXT, margin: 0 }}>Valid for 60 days from issue</p>
          </div>
          <div style={{ fontSize: 28, fontWeight: 500, color: CORAL }}>$99</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {CHECKS.map(c => (
            <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <i className="ti ti-check" style={{ fontSize: 14, color: TEAL }} />
              <span style={{ fontSize: 13, color: DARK }}>{c.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ fontSize: 11, color: GRAY_TEXT, lineHeight: 1.5, marginBottom: "1.5rem" }}>
        By proceeding you confirm your declarations are truthful.
        This is not a mechanical inspection. Refund issued if verification cannot be completed within 72 hours.
      </div>

      {error && (
        <div style={{
          background: "#FCEBEB", border: "1px solid #F09595", borderRadius: 8,
          padding: "0.75rem", marginBottom: "0.75rem", fontSize: 13, color: "#A32D2D",
        }}>{error}</div>
      )}

      <button onClick={onPay} disabled={submitting} style={{
        width: "100%", height: 52, borderRadius: 12, fontSize: 16,
        fontWeight: 500, background: submitting ? "#D3D1C7" : CORAL, color: "#fff",
        border: "none", cursor: submitting ? "not-allowed" : "pointer", display: "flex",
        alignItems: "center", justifyContent: "center", gap: 10,
        fontFamily: "var(--font-sans)", transition: "background 0.2s",
      }}
        onMouseEnter={e => { if (!submitting) e.currentTarget.style.background = "#993C1D"; }}
        onMouseLeave={e => { if (!submitting) e.currentTarget.style.background = CORAL; }}
      >
        <i className="ti ti-lock" style={{ fontSize: 18 }} />
        {submitting ? "Uploading & submitting…" : "Proceed to payment — $99"}
      </button>
      <p style={{ textAlign: "center", fontSize: 12, color: GRAY_TEXT, marginTop: 10 }}>
        Powered by Stripe · Secure payment
      </p>
    </div>
  );
}

export default function Apply() {
  const [step,       setStep      ] = useState(1);
  const [seller,     setSeller    ] = useState({ name: "", mobile: "", email: "", suburb: "" });
  const [car,        setCar       ] = useState({ make: "", model: "", year: "", vin: "", rego: "", state: "", odo: "", price: "" });
  const [uploads,    setUploads   ] = useState(Object.fromEntries(UPLOADS.map(u => [u.key, null])));
  const [agreed,     setAgreed    ] = useState(Array(DECLS.length).fill(false));
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const topRef = useRef(null);

  const scrollUp = () => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const canAdvance = () => {
    if (step === 1) return seller.name && seller.email && seller.mobile;
    if (step === 2) return car.make && car.model && car.year && car.vin?.length === 17 && car.rego && car.state;
    if (step === 3) return Object.values(uploads).every(Boolean);
    if (step === 4) return agreed.every(Boolean);
    return true;
  };

  const handlePay = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      // 1. Create application record
      const appRes = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seller, car, declarations: agreed, uploads: Object.keys(uploads) }),
      });
      if (!appRes.ok) throw new Error((await appRes.json()).error || "Submission failed.");
      const { id } = await appRes.json();

      // 2. Upload files to R2 via backend
      const formData = new FormData();
      Object.entries(uploads).forEach(([key, file]) => formData.append("files", file, key));
      const upRes = await fetch(`/api/applications/${id}/upload`, { method: "POST", body: formData });
      if (!upRes.ok) throw new Error("File upload failed — please try again.");

      // 3. Redirect to Stripe
      window.location.href = STRIPE_LINK;
    } catch (err) {
      setSubmitError(err.message);
      setSubmitting(false);
    }
  };

  const next = () => { if (step < STEPS.length) { setStep(s => s + 1); scrollUp(); } };
  const back = () => { if (step > 1) { setStep(s => s - 1); scrollUp(); } };

  return (
    <div ref={topRef} style={{ maxWidth: 560, margin: "0 auto", padding: "1.5rem 1rem", fontFamily: "var(--font-sans)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: CORAL,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <i className="ti ti-shield-check" style={{ fontSize: 16, color: "#fff" }} />
          </div>
          <span style={{ fontSize: 18, fontWeight: 500, color: DARK }}>VeriAuto</span>
        </div>
        <span style={{ fontSize: 13, color: GRAY_TEXT }}>Step {step} of {STEPS.length}</span>
      </div>

      <ProgressBar step={step} />

      <div style={{
        background: "var(--color-background-primary)", borderRadius: 16,
        padding: "1.75rem 1.5rem", border: `1px solid ${BORDER}`, marginBottom: "1.25rem",
      }}>
        {step === 1 && <Step1 data={seller} setData={setSeller} />}
        {step === 2 && <Step2 data={car}    setData={setCar}    />}
        {step === 3 && <Step3 uploads={uploads} setUploads={setUploads} />}
        {step === 4 && <Step4 agreed={agreed}   setAgreed={setAgreed}  />}
        {step === 5 && <Step5 carData={car} sellerData={seller} onPay={handlePay} submitting={submitting} error={submitError} />}
      </div>

      {step < 5 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <CTA label="Back" onClick={back} secondary />
          <CTA
            label={step === 4 ? "Review application →" : "Continue →"}
            onClick={next}
            disabled={!canAdvance()}
          />
        </div>
      )}
      {step === 5 && (
        <div style={{ textAlign: "center" }}>
          <button onClick={back} style={{
            background: "none", border: "none", color: GRAY_TEXT,
            fontSize: 13, cursor: "pointer", fontFamily: "var(--font-sans)", padding: "8px 0",
          }}>← Go back and edit</button>
        </div>
      )}
    </div>
  );
}
