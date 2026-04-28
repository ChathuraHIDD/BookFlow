import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import GoogleSignInButton from "../components/GoogleSignInButton";
import { useAuth } from "../context/useAuth";
import { homePathByRole, ROLE_OPTIONS } from "../utils/role";
import "./Register.css";

const CENTER_OPTIONS = [
  { value: "COLOMBO_CENTER", label: "Colombo Center" },
  { value: "MATHARA_CENTER", label: "Mathara Center" },
  { value: "JAFFNA_CENTER", label: "Jaffna Center" },
];

const DEGREE_OPTIONS = ["IT", "EN", "ART", "BS", "LAW"];

const CAMPUS_YEAR_OPTIONS = [
  { value: "1st", label: "1st Year" },
  { value: "2nd", label: "2nd Year" },
  { value: "3rd", label: "3rd Year" },
  { value: "4th", label: "4th Year" },
];

const COUNTRY_CODE_OPTIONS = [
  { value: "+94", label: "🇱🇰 Sri Lanka (+94)" },
  { value: "+91", label: "🇮🇳 India (+91)" },
  { value: "+1", label: "🇺🇸 United States (+1)" },
  { value: "+44", label: "🇬🇧 United Kingdom (+44)" },
  { value: "+61", label: "🇦🇺 Australia (+61)" },
];

const FULL_NAME_ALLOWED_PATTERN = /^[A-Za-z\s]*$/;
const FULL_NAME_VALID_PATTERN = /^[A-Za-z]+(?:\s+[A-Za-z]+)*$/;
const TELEPHONE_ALLOWED_PATTERN = /^\d*$/;
const TELEPHONE_LENGTH = 10;

function Register() {
  const navigate = useNavigate();
  const { register, registerWithGoogle, ready, isAuthenticated, user } = useAuth();
  const registerRoleOptions = ROLE_OPTIONS.filter(
    (role) => role.value !== "technician" && role.value !== "admin",
  );

  const [form, setForm] = useState({
    role: "student",
    fullName: "",
    email: "",
    password: "",
    countryCode: "+94",
    telephone: "",
    campusYear: "1st",
    semester: 1,
    center: "COLOMBO_CENTER",
    degreeProgram: "IT",
  });

  const [error, setError] = useState("");
  const [fullNameError, setFullNameError] = useState("");
  const [telephoneError, setTelephoneError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isStudent = form.role === "student";
  const isStaffMember = form.role === "staff_member";
  const needsStudentLikeFields = isStudent || isStaffMember;

  const payload = useMemo(() => {
    const base = {
      fullName: form.fullName,
      email: form.email,
      password: form.password,
      role: form.role,
    };

    if (needsStudentLikeFields) {
      base.telephone = `${form.countryCode}${form.telephone}`;
      base.center = form.center;
      base.degreeProgram = form.degreeProgram;
    }

    if (isStudent) {
      base.campusYear = form.campusYear;
      base.semester = Number(form.semester);
    }

    return base;
  }, [form, isStudent, needsStudentLikeFields]);

  const googlePayload = useMemo(() => {
    const base = {
      role: form.role,
    };

    if (needsStudentLikeFields) {
      base.telephone = `${form.countryCode}${form.telephone}`;
      base.center = form.center;
      base.degreeProgram = form.degreeProgram;
    }

    if (isStudent) {
      base.campusYear = form.campusYear;
      base.semester = Number(form.semester);
    }

    return base;
  }, [form, isStudent, needsStudentLikeFields]);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const isValidFullName = (name) => FULL_NAME_VALID_PATTERN.test(name.trim());
  const isValidTelephone = (telephone) => telephone.length === TELEPHONE_LENGTH;

  const onFullNameChange = (event) => {
    const nextValue = event.target.value;
    if (!FULL_NAME_ALLOWED_PATTERN.test(nextValue)) {
      setFullNameError("Full name can contain letters and spaces only. Numbers and special characters are not allowed.");
      return;
    }

    setFullNameError("");
    updateField("fullName", nextValue);
  };

  const onTelephoneChange = (event) => {
    const nextValue = event.target.value;

    if (!TELEPHONE_ALLOWED_PATTERN.test(nextValue)) {
      setTelephoneError("Telephone can contain digits only.");
      return;
    }

    if (nextValue.length > TELEPHONE_LENGTH) {
      setTelephoneError("Telephone number must be exactly 10 digits.");
      return;
    }

    setTelephoneError("");
    updateField("telephone", nextValue);
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!isValidFullName(form.fullName)) {
      setFullNameError("Please enter a valid full name using letters and spaces only.");
      return;
    }

    setFullNameError("");

    if (needsStudentLikeFields && !isValidTelephone(form.telephone)) {
      setTelephoneError("Telephone number must be exactly 10 digits.");
      return;
    }

    setTelephoneError("");
    setSubmitting(true);

    try {
      const user = await register(payload);
      navigate(homePathByRole(user.role));
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const onGoogleCredential = async (idToken) => {
    if (submitting) {
      return;
    }

    setError("");

    if (!isValidFullName(form.fullName)) {
      setFullNameError("Please enter a valid full name using letters and spaces only.");
      return;
    }

    setFullNameError("");

    if (needsStudentLikeFields && !isValidTelephone(form.telephone)) {
      setTelephoneError("Telephone number must be exactly 10 digits.");
      return;
    }

    setTelephoneError("");
    setSubmitting(true);

    try {
      const signedInUser = await registerWithGoogle({ ...googlePayload, idToken });
      navigate(homePathByRole(signedInUser.role));
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (ready && isAuthenticated) {
    return <Navigate to={homePathByRole(user.role)} replace />;
  }

  return (
    <div className="register-view">
      <div className="register-card-shell">
        <section className="register-hero-panel" aria-label="Registration intro">
          <div className="register-hero-overlay" />
          <div className="register-hero-content">
            <div className="register-brand-lockup">
              <img src="/auth-campus-logo.png" alt="Campus logo" className="register-brand-logo" />
            </div>
            <h1>Create Account.</h1>
            <p>
              Join the NNIC Smart Resource and Management Platform to reserve
              facilities, submit support requests, and manage smart campus
              activities from one place.
            </p>
            <ul className="register-hero-highlights">
              <li>Student and staff role onboarding</li>
              <li>Campus-center aligned profile setup</li>
              <li>Ready for bookings, updates, and support</li>
            </ul>
          </div>
        </section>

        <section className="register-form-panel" aria-label="Register form">
          <div className="register-form-wrap">
            <div className="register-form-brand">
              <img src="/auth-campus-logo.png" alt="" aria-hidden="true" />
              <span>Create Your Campus Account</span>
            </div>
            <h2>Register</h2>

            <GoogleSignInButton
              text="signup_with"
              onCredential={onGoogleCredential}
              onError={(err) => setError(err.message)}
              disabled={submitting}
            />

            <p className="google-register-note">
              Google registration uses your Google name and email. Choose your role and details below before clicking Google Sign Up.
            </p>

            <div className="divider-row" aria-hidden="true">
              <span />
              <em>or</em>
              <span />
            </div>

            <form className="register-form-grid" onSubmit={onSubmit}>
              <label>
                Role
                <select
                  value={form.role}
                  onChange={(event) => updateField("role", event.target.value)}
                >
                  {registerRoleOptions.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Full Name
                <input
                  type="text"
                  value={form.fullName}
                  onChange={onFullNameChange}
                  placeholder="Enter your full name"
                  required
                />
                {fullNameError ? <p className="register-inline-error" role="alert">{fullNameError}</p> : null}
              </label>

              <label className="register-field-wide">
                Email Address
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </label>

              <label className="register-field-wide">
                Password
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => updateField("password", event.target.value)}
                  placeholder="Minimum 6 characters"
                  minLength={6}
                  required
                />
              </label>

              {needsStudentLikeFields ? (
                <label>
                  Country Code
                  <select
                    value={form.countryCode}
                    onChange={(event) => updateField("countryCode", event.target.value)}
                  >
                    {COUNTRY_CODE_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {needsStudentLikeFields ? (
                <label>
                  Telephone
                  <input
                    type="text"
                    value={form.telephone}
                    onChange={onTelephoneChange}
                    placeholder="Enter 10-digit phone number"
                    inputMode="numeric"
                    maxLength={TELEPHONE_LENGTH}
                    required
                  />
                  {telephoneError ? <p className="register-inline-error" role="alert">{telephoneError}</p> : null}
                </label>
              ) : null}

              {isStudent ? (
                <label>
                  Campus Year
                  <select
                    value={form.campusYear}
                    onChange={(event) => updateField("campusYear", event.target.value)}
                  >
                    {CAMPUS_YEAR_OPTIONS.map((year) => (
                      <option key={year.value} value={year.value}>
                        {year.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {isStudent ? (
                <label>
                  Semester
                  <select
                    value={form.semester}
                    onChange={(event) => updateField("semester", Number(event.target.value))}
                  >
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                  </select>
                </label>
              ) : null}

              {needsStudentLikeFields ? (
                <label>
                  Center
                  <select
                    value={form.center}
                    onChange={(event) => updateField("center", event.target.value)}
                  >
                    {CENTER_OPTIONS.map((center) => (
                      <option key={center.value} value={center.value}>
                        {center.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {needsStudentLikeFields ? (
                <label>
                  Degree Program
                  <select
                    value={form.degreeProgram}
                    onChange={(event) => updateField("degreeProgram", event.target.value)}
                  >
                    {DEGREE_OPTIONS.map((degree) => (
                      <option key={degree} value={degree}>
                        {degree}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {error ? <p className="error-text">{error}</p> : null}

              <button className="register-submit-btn" type="submit" disabled={submitting}>
                {submitting ? "Creating Account..." : "Register"}
              </button>
            </form>

            <p className="register-helper-text">
              Already have an account? <Link to="/login">Log in</Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Register;
