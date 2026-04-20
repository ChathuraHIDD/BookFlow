import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import GoogleSignInButton from "../components/GoogleSignInButton";
import { useAuth } from "../context/useAuth";
import { homePathByRole } from "../utils/role";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const { login, loginWithGoogle, ready, isAuthenticated, user } = useAuth();

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
    setSubmitting(true);

    try {
      const signedInUser = await loginWithGoogle(idToken);
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
    <div className="login-view">
      <div className="login-card-shell">
        <section className="login-hero-panel" aria-label="Welcome message">
          <div className="login-hero-overlay" />
          <div className="login-hero-content">
            <div className="login-brand-lockup">
              <img src="/auth-campus-logo.png" alt="Campus logo" className="login-brand-logo" />
            </div>
            <h1>Welcome Back.</h1>
            <p>
              Sign in to the NNIC Smart Resource and Management Platform and
              continue handling campus facilities, support requests, and resource
              coordination in one place.
            </p>
            <ul className="login-hero-highlights">
              <li>Unified facility booking and approvals</li>
              <li>Fast support-ticket tracking</li>
              <li>Role-based student and admin workspaces</li>
            </ul>
          </div>
        </section>

        <section className="login-form-panel" aria-label="Login form">
          <div className="login-form-wrap">
            <div className="login-form-brand">
              <img src="/auth-campus-logo.png" alt="" aria-hidden="true" />
              <span>Secure Access Portal</span>
            </div>
            <h2>Log in</h2>

            <GoogleSignInButton
              text="signin_with"
              onCredential={onGoogleCredential}
              onError={(err) => setError(err.message)}
              disabled={submitting}
            />

            <div className="divider-row" aria-hidden="true">
              <span />
              <em>or</em>
              <span />
            </div>

            <form className="login-form-grid" onSubmit={onSubmit}>
              <label>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </label>

              <label>
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </label>

              {error ? <p className="error-text">{error}</p> : null}

              <button className="login-submit-btn" type="submit" disabled={submitting}>
                {submitting ? "Signing In..." : "Log in"}
              </button>
            </form>

            <div className="login-footnote-row">
              <button className="link-look-btn" type="button">
                Forgot password?
              </button>
              <p>
                Don't have an account? <Link to="/register">Sign Up</Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Login;
