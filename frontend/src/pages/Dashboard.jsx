import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { profilePathByRole } from "../utils/role";

const services = [
  {
    title: "Smart Catalog Search",
    description:
      "Find books, journals, and learning resources in seconds with a clean search and filter experience.",
  },
  {
    title: "Borrowing Made Easy",
    description:
      "Track active loans, due dates, and renewals from one central space built for students and staff.",
  },
  {
    title: "Library Support",
    description:
      "Raise support requests, get status updates, and stay connected with the library team without delays.",
  },
];

const testimonials = [
  {
    quote:
      "BookFlow gave our students one clear place to manage borrowing, notifications, and support without confusion.",
    author: "A. Fernando",
    role: "Student Services Coordinator",
  },
  {
    quote:
      "The platform feels simple for users, but it still gives staff the structure needed to keep the library running smoothly.",
    author: "M. Perera",
    role: "Campus Librarian",
  },
];

function Dashboard() {
  const { user, ready, isAuthenticated } = useAuth();

  if (ready && isAuthenticated) {
    return <Navigate to={profilePathByRole(user.role)} replace />;
  }

  return (
    <div className="landing-page">
      <header className="landing-header">
        <Link className="landing-logo" to="/">
          BookFlow
        </Link>

        <nav className="landing-nav" aria-label="Primary navigation">
          <a href="#about">About</a>
          <a href="#services">Services</a>
          <a href="#contact">Contact</a>
        </nav>

        <div className="landing-header-actions">
          <Link className="landing-header-link" to="/login">
            Login
          </Link>
          <Link className="landing-btn landing-btn-primary" to="/register">
            Create Account
          </Link>
        </div>
      </header>

      <main className="landing-main">
        <section className="landing-hero" id="about">
          <div className="landing-hero-copy">
            <span className="landing-eyebrow">Modern Library Experience</span>
            <h1>Make every library visit smoother, faster, and easier to manage.</h1>
            <p>
              BookFlow helps students, staff, librarians, and administrators stay
              connected with borrowing, notifications, support, and facility access
              in one polished digital portal.
            </p>

            <div className="landing-hero-actions">
              <Link className="landing-btn landing-btn-accent" to="/register">
                Learn More
              </Link>
              <Link className="landing-btn landing-btn-secondary" to="/login">
                Sign In
              </Link>
            </div>
          </div>

          <div className="landing-hero-media" aria-hidden="true">
            <div className="landing-video-card">
              <div className="landing-video-glow" />
              <button className="landing-play-button" type="button" tabIndex={-1}>
                <span />
              </button>
              <div className="landing-video-lines">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        </section>

        <section className="landing-services" id="services">
          <div className="landing-section-heading">
            <span className="landing-section-kicker">Our Services</span>
            <h2>Everything your library community needs in one place</h2>
          </div>

          <div className="landing-service-grid">
            {services.map((service) => (
              <article className="landing-service-card" key={service.title}>
                <div className="landing-service-visual" aria-hidden="true">
                  <span />
                  <span />
                </div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-testimonials">
          <div className="landing-section-heading landing-section-heading-center">
            <span className="landing-section-kicker">Testimonials</span>
            <h2>Trusted by teams who need clarity and consistency</h2>
          </div>

          <div className="landing-testimonial-grid">
            {testimonials.map((item) => (
              <article className="landing-testimonial-card" key={item.author}>
                <p>{item.quote}</p>
                <div className="landing-testimonial-author">
                  <span className="landing-testimonial-avatar" aria-hidden="true" />
                  <div>
                    <strong>{item.author}</strong>
                    <span>{item.role}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-cta">
          <span className="landing-section-kicker">Get Started</span>
          <h2>Build a more connected library workflow with BookFlow.</h2>
          <p>
            Create an account to access library tools, facility features, updates,
            and support services designed around your campus.
          </p>
          <Link className="landing-btn landing-btn-primary" to="/register">
            Launch Now
          </Link>
        </section>
      </main>

      <footer className="landing-footer" id="contact">
        <div className="landing-footer-info">
          <Link className="landing-logo landing-logo-footer" to="/">
            BookFlow
          </Link>
          <p>
            A cleaner digital front desk for borrowing, member support, and
            day-to-day library operations.
          </p>

          <ul className="landing-footer-links">
            <li>About</li>
            <li>Portal Access</li>
            <li>Support</li>
            <li>FAQ</li>
          </ul>

          <div className="landing-socials" aria-label="Social links">
            <span>f</span>
            <span>t</span>
            <span>in</span>
          </div>
        </div>

        <form className="landing-contact-card">
          <label>
            Name
            <input type="text" name="name" placeholder="Your name" />
          </label>
          <label>
            Email
            <input type="email" name="email" placeholder="you@example.com" />
          </label>
          <label>
            Message
            <textarea name="message" rows="4" placeholder="How can we help?" />
          </label>
          <button className="landing-btn landing-btn-accent" type="submit">
            Contact Us
          </button>
        </form>
      </footer>
    </div>
  );
}

export default Dashboard;
