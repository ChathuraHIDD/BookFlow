import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import PortalLayout from "../components/PortalLayout";
import { useAuth } from "../context/useAuth";
import { profilePathByRole, ROLE_OPTIONS } from "../utils/role";

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

function Register() {
  const navigate = useNavigate();
  const { register, ready, isAuthenticated, user } = useAuth();

  const [form, setForm] = useState({
    role: "student",
    fullName: "",
    email: "",
    password: "",
    telephone: "",
    campusYear: "1st",
    semester: 1,
    center: "COLOMBO_CENTER",
    degreeProgram: "IT",
  });

  const [error, setError] = useState("");
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
      base.telephone = form.telephone;
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

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const user = await register(payload);
      navigate(profilePathByRole(user.role));
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (ready && isAuthenticated) {
    return <Navigate to={profilePathByRole(user.role)} replace />;
  }

  return (
    <PortalLayout
      title="Create Your Account"
      subtitle="Role-based registration for students, librarians, admins, and staff members."
    >
      <form className="form-grid" onSubmit={onSubmit}>
        <label>
          Role
          <select
            value={form.role}
            onChange={(event) => updateField("role", event.target.value)}
          >
            {ROLE_OPTIONS.map((role) => (
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
            onChange={(event) => updateField("fullName", event.target.value)}
            required
          />
        </label>

        <label>
          Email Address
          <input
            type="email"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={(event) => updateField("password", event.target.value)}
            minLength={6}
            required
          />
        </label>

        {needsStudentLikeFields ? (
          <label>
            Telephone
            <input
              type="tel"
              value={form.telephone}
              onChange={(event) => updateField("telephone", event.target.value)}
              required
            />
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

        <button className="solid-btn full-width" type="submit" disabled={submitting}>
          {submitting ? "Creating Account..." : "Register"}
        </button>

        <p className="helper-text">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </PortalLayout>
  );
}

export default Register;
