import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import PortalLayout from "../components/PortalLayout";
import { useAuth } from "../context/useAuth";
import { profilePathByRole } from "../utils/role";

function Login() {
  const navigate = useNavigate();
  const { login, ready, isAuthenticated, user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const user = await login(email, password);
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
      title="Welcome Back"
      subtitle="Sign in with your email address and password to access your role dashboard."
    >
      <form className="form-grid" onSubmit={onSubmit}>
        <label>
          Email Address
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        {error ? <p className="error-text">{error}</p> : null}

        <button className="solid-btn full-width" type="submit" disabled={submitting}>
          {submitting ? "Signing In..." : "Login"}
        </button>

        <p className="helper-text">
          New to BookFlow? <Link to="/register">Create account</Link>
        </p>
      </form>
    </PortalLayout>
  );
}

export default Login;
