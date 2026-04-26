import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";

import StudentPortalShell from "../components/StudentPortalShell";
import { fetchStudentFacilitiesOverview } from "../services/facilities";
import { fetchStudentResourceBookings } from "../services/resources";
import { readApiError } from "../services/api";
import { facilityCategoryGrid } from "../data/facilityCatalog";

function StudentFacilities() {
  const [overview, setOverview] = useState({ buildings: [], myBookings: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [passError, setPassError] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [passLoadingBookingId, setPassLoadingBookingId] = useState("");
  const [passDownloadingBookingId, setPassDownloadingBookingId] = useState("");
  const [expandedPassBookingId, setExpandedPassBookingId] = useState("");
  const [bookingPassQrs, setBookingPassQrs] = useState({});

  const buildBadge = (building) => {
    const code = building?.code?.trim();
    if (code) {
      return code.slice(0, 2).toUpperCase();
    }

    return (building?.name || "B")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("");
  };

  useEffect(() => {
    const loadOverview = async () => {
      try {
        const [overviewData, resourceBookingsData] = await Promise.all([
          fetchStudentFacilitiesOverview(),
          fetchStudentResourceBookings()
        ]);
        
        // Normalize resource bookings to match classroom bookings shape
        const normalizedResourceBookings = (resourceBookingsData || []).map(rb => ({
          ...rb,
          isResource: true,
          buildingName: rb.resourceCategory,
          floorNumber: "",
          roomNumber: rb.resourceName
        }));

        setOverview({
          buildings: overviewData.buildings || [],
          myBookings: [...(overviewData.myBookings || []), ...normalizedResourceBookings]
        });
      } catch (err) {
        setError(readApiError(err));
      } finally {
        setLoading(false);
      }
    };

    loadOverview();
  }, []);

  const allBookings = overview.myBookings || [];
  const approvedCount = allBookings.filter((booking) => booking.status === "APPROVED").length;
  const rejectedCount = allBookings.filter((booking) => booking.status === "REJECTED").length;

  const filteredBookings = allBookings
    .filter((booking) => {
      const bookingDate = booking.bookingDate || "";
      const status = (booking.status || "").toUpperCase();

      if (monthFilter && !bookingDate.startsWith(monthFilter)) {
        return false;
      }

      if (dateFilter && bookingDate !== dateFilter) {
        return false;
      }

      if (statusFilter !== "ALL" && status !== statusFilter) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      const left = `${b.bookingDate || ""} ${b.startTime || ""}`;
      const right = `${a.bookingDate || ""} ${a.startTime || ""}`;
      return left.localeCompare(right);
    });

  const statusTone = (status) => {
    const normalized = (status || "").toLowerCase();
    if (normalized === "approved") {
      return "approved";
    }
    if (normalized === "rejected") {
      return "rejected";
    }
    if (normalized === "pending") {
      return "pending";
    }
    if (normalized === "cancelled") {
      return "cancelled";
    }
    return "default";
  };

  const isApprovedBooking = (booking) => (booking?.status || "").toUpperCase() === "APPROVED";

  const getBookingLocationLabel = (booking) => {
    if (booking?.isResource) {
      return `${booking.buildingName || "Resource"} | ${booking.roomNumber || "-"}`;
    }
    return `${booking?.buildingName || "Building"} | Floor ${booking?.floorNumber ?? "-"} | ${booking?.roomNumber || "-"}`;
  };

  const buildBookingPassQrText = (booking) => {
    // Encode the validation URL into the QR code
    return `${window.location.origin}/admin/verify/booking/${booking.id}`;
  };

  const ensureBookingPassQr = async (booking) => {
    if (bookingPassQrs[booking.id]) {
      return bookingPassQrs[booking.id];
    }

    const qrDataUrl = await QRCode.toDataURL(buildBookingPassQrText(booking), {
      width: 280,
      margin: 1,
      color: {
        dark: '#1f478c', // NNIC Blue
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    });

    setBookingPassQrs((previous) => ({
      ...previous,
      [booking.id]: qrDataUrl,
    }));

    return qrDataUrl;
  };

  const toggleBookingPassPanel = async (booking) => {
    if (expandedPassBookingId === booking.id) {
      setExpandedPassBookingId("");
      return;
    }

    try {
      setPassError("");
      setPassLoadingBookingId(booking.id);
      await ensureBookingPassQr(booking);
      setExpandedPassBookingId(booking.id);
    } catch (err) {
      setPassError(err?.message || "Could not generate booking pass QR code.");
    } finally {
      setPassLoadingBookingId("");
    }
  };

  const downloadBookingPassPdf = async (booking) => {
    try {
      setPassError("");
      setPassDownloadingBookingId(booking.id);

      const qrDataUrl = await ensureBookingPassQr(booking);
      const locationLabel = getBookingLocationLabel(booking);
      const seatText = booking?.selectedSeats?.length ? booking.selectedSeats.join(", ") : "None";

      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // 1. Header Branded Background
      doc.setFillColor(31, 71, 140); // NNIC Deep Blue
      doc.rect(0, 0, pageWidth, 100, 'F');

      // 2. Official Logo Image
      try {
        doc.addImage("/nnic-logo-icon.png", "PNG", 40, 20, 60, 60);
      } catch (e) {
        // Fallback to programmatic icon if image fails
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(40, 25, 50, 50, 10, 10, 'F');
        doc.setTextColor(31, 71, 140);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.text("N", 54, 58);
      }
      
      // 3. Title & Tagline
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.text("NNIC SMART CAMPUS", 115, 52);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("OFFICIAL BOOKING PASS", 115, 68);

      // 4. Content Area Styling
      doc.setTextColor(30, 41, 59); // Slate 800
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Booking Confirmation Details", 40, 140);
      
      // Horizontal Rule
      doc.setDrawColor(226, 232, 240); // Slate 200
      doc.setLineWidth(1);
      doc.line(40, 150, pageWidth - 40, 150);

      // 5. Details Grid
      doc.setFontSize(11);
      const details = [
        ["Booking ID", booking.id || "-"],
        ["Subject", booking?.isResource ? "Resource Allocation" : "Facility Reservation"],
        ["Student", booking?.requestedByName || "Student Account"],
        ["Location", locationLabel],
        ["Date", booking?.bookingDate || "-"],
        ["Time Slot", `${booking?.startTime || "-"} - ${booking?.endTime || "-"}`],
        ["Purpose", booking?.purpose || "Educational Activity"],
        ["Priority", booking?.priority || "NORMAL"],
        ["Seats", seatText],
        ["Status", booking?.status || "VERIFIED"],
      ];

      let currentTop = 180;
      details.forEach(([label, value]) => {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 116, 139); // Slate 500
        doc.text(label, 40, currentTop);
        
        doc.setFont("helvetica", "normal");
        doc.setTextColor(30, 41, 59); // Slate 800
        doc.text(value, 160, currentTop);
        
        currentTop += 24;
      });

      // 6. QR Code Section (Right Side Box)
      doc.setFillColor(248, 250, 252); // Slate 50
      doc.roundedRect(380, 130, 175, 210, 8, 8, 'F');
      doc.setDrawColor(203, 213, 225); // Slate 300
      doc.roundedRect(380, 130, 175, 210, 8, 8, 'S');
      
      doc.addImage(qrDataUrl, "PNG", 392, 145, 150, 150);
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(71, 85, 105); // Slate 600
      doc.text("SECURE VERIFICATION", 420, 310);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("Authorized by NNIC Security", 425, 322);

      // 7. Footer
      const footerY = doc.internal.pageSize.getHeight() - 40;
      doc.setDrawColor(226, 232, 240);
      doc.line(40, footerY - 10, pageWidth - 40, footerY - 10);
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184); // Slate 400
      doc.text("Generated via NNIC Smart Campus Portal. Please present this pass for entrance.", 40, footerY);
      doc.text(`Doc ID: ${booking.id?.slice(0, 8) || "N/A"}`, pageWidth - 120, footerY);

      doc.save(`nnic-pass-${booking.id?.slice(0, 8) || "booking"}.pdf`);
    } catch (err) {
      setPassError(err?.message || "Could not download booking pass PDF.");
    } finally {
      setPassDownloadingBookingId("");
    }
  };

  return (
    <StudentPortalShell activeKey="facilities">
      <section className="student-modern-hero-card student-facilities-hero">
        <div className="student-modern-hero-copy">
          <p className="student-modern-section-label">Facilities</p>
          <h2>Select a building to start your booking.</h2>
          <p>
            Choose a building, open a floor, then pick an available classroom to reserve.
          </p>
        </div>
      </section>

      {error ? <p className="error-text">{error}</p> : null}
  {passError ? <p className="error-text">{passError}</p> : null}

      <section className="student-facilities-grid">
        <article className="student-modern-workspace-card student-facilities-wide-card">
          <div className="student-modern-card-head">
            <div>
              <p className="student-modern-section-label">Buildings</p>
              <h3>Building Selection</h3>
            </div>
          </div>

          {loading ? (
            <p className="helper-text">Loading buildings...</p>
          ) : (
            <div className="student-building-card-grid">
              {overview.buildings.map((building) => (
                <Link
                  key={building.id}
                  className="student-building-card"
                  to={`/student/facilities/buildings/${building.id}`}
                >
                  <div className="student-building-card-visual" aria-hidden="true">
                    <span className="student-building-card-icon">{buildBadge(building)}</span>
                  </div>
                  <strong>{building.name}</strong>
                  <div className="student-building-card-meta">
                    <span>{building.floorCount} floors</span>
                    <span>{building.classroomCount} classrooms</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </article>

        <article className="student-modern-workspace-card student-facilities-wide-card">
          <div className="student-modern-card-head student-facility-catalog-head">
            <div>
              <p className="student-modern-section-label">Catalogue</p>
              <h3>Facilities Catalogue</h3>
            </div>
            <p className="helper-text">Select a category to open its sub parts page.</p>
          </div>

          <div className="student-facility-catalog-grid student-facility-catalog-grid-featured" aria-label="Facility categories">
            {facilityCategoryGrid.map((category) => (
              <Link
                key={category.slug}
                className="student-facility-catalog-card student-facility-catalog-card-featured"
                to={`/student/facilities/categories/${category.slug}`}
                style={{ "--facility-accent": category.accent }}
              >
                <span className="student-facility-catalog-card-emoji" aria-hidden="true">{category.emoji}</span>
                <strong>{category.name}</strong>
              </Link>
            ))}
          </div>
        </article>

        <article className="student-modern-workspace-card student-facilities-wide-card">
          <div className="student-modern-card-head">
            <div>
              <p className="student-modern-section-label">My Bookings</p>
              <h3>Booking History</h3>
            </div>
          </div>

          {loading ? (
            <p className="helper-text">Loading bookings...</p>
          ) : (
            <>
              <div className="student-booking-stat-grid">
                <article className="student-booking-stat-card student-booking-stat-card-total">
                  <p>Total Bookings</p>
                  <strong>{allBookings.length}</strong>
                  <span>All requests</span>
                </article>
                <article className="student-booking-stat-card student-booking-stat-card-approved">
                  <p>Approved</p>
                  <strong>{approvedCount}</strong>
                  <span>Confirmed by admin</span>
                </article>
                <article className="student-booking-stat-card student-booking-stat-card-rejected">
                  <p>Rejected</p>
                  <strong>{rejectedCount}</strong>
                  <span>Not approved</span>
                </article>
              </div>

              <div className="student-booking-filter-bar">
                <label>
                  Month
                  <input
                    type="month"
                    value={monthFilter}
                    onChange={(event) => setMonthFilter(event.target.value)}
                  />
                </label>

                <label>
                  Date
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(event) => setDateFilter(event.target.value)}
                  />
                </label>

                <label>
                  Status
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                  >
                    <option value="ALL">All</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="PENDING">Pending</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </label>
              </div>

              <ul className="list-clean student-booking-history-list">
                {filteredBookings.length ? (
                  filteredBookings.map((booking) => (
                    <li key={booking.id} className="student-booking-history-card">
                      <div className="student-booking-history-top">
                        <strong>
                          {booking.isResource 
                            ? `${booking.buildingName} | ${booking.roomNumber}`
                            : `${booking.buildingName} | Floor ${booking.floorNumber} | ${booking.roomNumber}`
                          }
                        </strong>
                        <span className={`student-booking-status-badge student-booking-status-${statusTone(booking.status)}`}>
                          {booking.status}
                        </span>
                      </div>
                      <p>{booking.bookingDate} | {booking.startTime} - {booking.endTime}</p>
                      <p className="student-booking-history-meta">
                        {booking.purpose || "Study"} | {booking.priority || "NORMAL"} | {booking.reviewRequired ? "Review needed" : booking.status}
                      </p>
                      {booking.selectedSeats && booking.selectedSeats.length > 0 && (
                        <p className="student-booking-history-seats">
                          Seats: {booking.selectedSeats.join(", ")}
                        </p>
                      )}

                      {isApprovedBooking(booking) && (
                        <div className="student-booking-pass-actions">
                          <button
                            className="student-booking-pass-btn"
                            type="button"
                            disabled={passLoadingBookingId === booking.id}
                            onClick={() => toggleBookingPassPanel(booking)}
                          >
                            {passLoadingBookingId === booking.id
                              ? "Generating QR..."
                              : expandedPassBookingId === booking.id
                                ? "Hide QR Pass"
                                : "Show QR Pass"}
                          </button>

                          <button
                            className="student-booking-pass-btn student-booking-pass-btn-download"
                            type="button"
                            disabled={passDownloadingBookingId === booking.id || passLoadingBookingId === booking.id}
                            onClick={() => downloadBookingPassPdf(booking)}
                          >
                            {passDownloadingBookingId === booking.id ? "Preparing PDF..." : "Download PDF"}
                          </button>
                        </div>
                      )}

                      {expandedPassBookingId === booking.id && bookingPassQrs[booking.id] && (
                        <div className="student-booking-pass-panel">
                          <img
                            className="student-booking-pass-qr"
                            src={bookingPassQrs[booking.id]}
                            alt={`QR booking pass for ${booking.id}`}
                          />
                          <div className="student-booking-pass-details">
                            <p><strong>Booking ID:</strong> {booking.id}</p>
                            <p><strong>Type:</strong> {booking.isResource ? "Resource" : "Facility"}</p>
                            <p><strong>Location:</strong> {getBookingLocationLabel(booking)}</p>
                            <p><strong>Date:</strong> {booking.bookingDate}</p>
                            <p><strong>Time:</strong> {booking.startTime} - {booking.endTime}</p>
                          </div>
                        </div>
                      )}
                    </li>
                  ))
                ) : (
                  <li>No bookings match the selected filters.</li>
                )}
              </ul>
            </>
          )}
        </article>
      </section>
    </StudentPortalShell>
  );
}

export default StudentFacilities;
