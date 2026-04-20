import { useEffect, useMemo, useState } from "react";
import PortalLayout from "../components/PortalLayout";
import { useAuth } from "../context/useAuth";
import { fetchMyProfileRequests, submitMyProfileRequest } from "../services/profile";
import { formatEnumText, normalizeRole, roleLabel } from "../utils/role";

const CAMPUS_YEAR_OPTIONS = [
  { value: "1st", label: "1st Year" },
  { value: "2nd", label: "2nd Year" },
  { value: "3rd", label: "3rd Year" },
  { value: "4th", label: "4th Year" },
];

const DEGREE_OPTIONS = ["IT", "EN", "ART", "BS", "LAW"];
const CENTER_OPTIONS = [
  { value: "COLOMBO_CENTER", label: "Colombo Center" },
  { value: "MATHARA_CENTER", label: "Mathara Center" },
  { value: "JAFFNA_CENTER", label: "Jaffna Center" },
];

function buildForm(user) {
  return {
    fullName: user?.fullName || "",
    email: user?.email || "",
    telephone: user?.telephone || "",
    campusYear: user?.campusYear
      ? ({ FIRST: "1st", SECOND: "2nd", THIRD: "3rd", FOURTH: "4th" }[user.campusYear] || "1st")
      : "1st",
    semester: user?.semester || 1,
    center: user?.center || "COLOMBO_CENTER",
    degreeProgram: user?.degreeProgram || "IT",
  };
}

function UserProfile() {
  const { user, refreshUser } = useAuth();
  const role = normalizeRole(user?.role);
  const [profile, setProfile] = useState(user);
  const [form, setForm] = useState(buildForm(user));
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isStudent = role === "student";

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setError("");
        const latestProfile = await refreshUser();
        if (!active) {
          return;
        }
        setProfile(latestProfile);
        setForm(buildForm(latestProfile));
        const requestData = await fetchMyProfileRequests();
        if (active) {
          setRequests(requestData);
        }
      } catch (err) {
        if (active) {
          setError(err.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    const intervalId = window.setInterval(() => {
      load();
    }, 15000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [refreshUser]);

  useEffect(() => {
    setProfile(user);
    setForm(buildForm(user));
  }, [user]);

  const pendingRequest = useMemo(() => requests.find((request) => request.status === "PENDING"), [requests]);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      await submitMyProfileRequest({
        fullName: form.fullName,
        email: form.email,
        telephone: form.telephone,
        campusYear: form.campusYear,
        semester: Number(form.semester),
        center: form.center,
        degreeProgram: form.degreeProgram,
      });
      setMessage("Profile change request submitted for admin approval.");
      const requestData = await fetchMyProfileRequests();
      setRequests(requestData);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isStudent) {
    return (
      <PortalLayout title={`${roleLabel(role)} Profile`} subtitle="Your account information is loaded from the database.">
        <p className="helper-text">This profile update workflow is currently enabled for student accounts.</p>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout
      title="Student Profile"
      subtitle="Review your current details, edit them below, and submit changes for admin approval."
      loading={loading}
    >
      {error ? <p className="error-text">{error}</p> : null}
      {message ? <p className="helper-text">{message}</p> : null}

      <div className="profile-grid">
        <article className="metric-card">
          <h3>Current Profile</h3>
          <p><strong>Name:</strong> {profile?.fullName}</p>
          <p><strong>Email:</strong> {profile?.email}</p>
          <p><strong>Telephone:</strong> {profile?.telephone || "-"}</p>
          <p><strong>Center:</strong> {formatEnumText(profile?.center)}</p>
          <p><strong>Degree Program:</strong> {formatEnumText(profile?.degreeProgram)}</p>
          <p><strong>Campus Year:</strong> {formatEnumText(profile?.campusYear)}</p>
          <p><strong>Semester:</strong> {profile?.semester || "-"}</p>
          <p className="helper-text">
            Current approval status: {pendingRequest ? "Pending update request" : "No pending update request"}
          </p>
        </article>

        <article className="metric-card">
          <h3>Request Profile Update</h3>
          <form className="student-profile-form" onSubmit={onSubmit}>
            <label>
              Full Name
              <input type="text" value={form.fullName} onChange={(event) => updateField("fullName", event.target.value)} required />
            </label>

            <label>
              Email
              <input type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} required />
            </label>

            <label>
              Telephone
              <input type="tel" value={form.telephone} onChange={(event) => updateField("telephone", event.target.value)} required />
            </label>

            <label>
              Campus Year
              <select value={form.campusYear} onChange={(event) => updateField("campusYear", event.target.value)}>
                {CAMPUS_YEAR_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label>
              Semester
              <select value={form.semester} onChange={(event) => updateField("semester", Number(event.target.value))}>
                <option value={1}>1</option>
                <option value={2}>2</option>
              </select>
            </label>

            <label>
              Center
              <select value={form.center} onChange={(event) => updateField("center", event.target.value)}>
                {CENTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label>
              Degree Program
              <select value={form.degreeProgram} onChange={(event) => updateField("degreeProgram", event.target.value)}>
                {DEGREE_OPTIONS.map((degree) => (
                  <option key={degree} value={degree}>{degree}</option>
                ))}
              </select>
            </label>

            <button className="solid-btn full-width" type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit for Approval"}
            </button>
          </form>
        </article>
      </div>

      <article className="metric-card" style={{ marginTop: 16 }}>
        <h3>Update History</h3>
        <ul className="list-clean">
          {requests.length === 0 ? <li>No profile update requests yet.</li> : null}
          {requests.map((request) => (
            <li key={request.id}>
              <div>
                <strong>{request.status}</strong>
                <div className="helper-text">Requested at {request.requestedAt}</div>
                {request.adminNote ? <div className="helper-text">Admin note: {request.adminNote}</div> : null}
              </div>
              <span>{request.reviewedAt || "Awaiting review"}</span>
            </li>
          ))}
        </ul>
      </article>
    </PortalLayout>
  );
}

export default UserProfile;