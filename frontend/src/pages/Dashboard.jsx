import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { homePathByRole } from "../utils/role";
import "./Dashboard.css";

const storyCards = [
  {
    title: "Campus Facilities Modernization",
    image: "/landing/campus-building.jpg",
  },
  {
    title: "AI-Driven Student Insights",
    image: "/landing/tech-vision.jpg",
  },
  {
    title: "Community & Learning Moments",
    image: "/landing/students-hero.jpg",
  },
];

const progressItems = [
  {
    progress: 75,
    title: "Structured Study Plans",
    description:
      "A clear, guided approach for organizing course milestones, assignments, and faculty touchpoints.",
  },
  {
    progress: 50,
    title: "Progress Tracking & Reports",
    description:
      "Centralized status views for attendance, requests, and academic activity across departments.",
  },
  {
    progress: 88,
    title: "Student Communication",
    description:
      "Faster, consistent updates through announcements, support alerts, and priority notifications.",
  },
];

function Dashboard() {
  const { user, ready, isAuthenticated } = useAuth();

  if (ready && isAuthenticated) {
    return <Navigate to={homePathByRole(user.role)} replace />;
  }

  return (
    <div className="dash-shot-page">
      <header className="dash-shot-header" aria-label="Main navigation">
        <div className="dash-shot-header-inner">
          <Link className="dash-shot-brand" to="/">
            <img src="/auth-campus-logo.png" alt="NNIC logo" />
          </Link>

          <div className="dash-shot-header-right">
            <nav className="dash-shot-links">
              <a href="#hero">News</a>
              <a href="#progress">Insights</a>
              <a href="#contact">Contact</a>
            </nav>

            <div className="dash-shot-auth-actions">
              <Link className="dash-shot-login" to="/login">
                Login
              </Link>
              <Link className="dash-shot-plan" to="/register">
                Register
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="dash-shot-main">
        <section className="dash-shot-hero" id="hero" aria-label="Hero news">
          <div className="dash-shot-hero-overlay" />

          <div className="dash-shot-hero-content">
            <p className="dash-shot-kicker">Student Management Dashboard</p>
            <h1>"Campus Operations and Student Success in One Platform"</h1>
            <div className="dash-shot-meta">
              <span className="dash-shot-tag">FEATURED</span>
              <span>Updated 3 hrs ago</span>
            </div>
          </div>

          <div className="dash-shot-story-grid" aria-label="Top stories">
            {storyCards.map((card) => (
              <article className="dash-shot-story-card" key={card.title}>
                <img src={card.image} alt={card.title} />
                <p>{card.title}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="dash-shot-progress" id="progress" aria-label="Progress highlights">
          {progressItems.map((item) => (
            <article className="dash-shot-progress-card" key={item.title}>
              <div className="dash-shot-progress-ring" style={{ "--progress": `${item.progress}%` }}>
                <span>{item.progress}%</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </section>
      </main>

      <footer className="dash-shot-footer" id="contact">
        <p>NNIC Smart Resource and Management Platform</p>
        <div>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </div>
      </footer>
    </div>
  );
}

export default Dashboard;
