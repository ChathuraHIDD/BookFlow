import React, { useState, useMemo } from "react";
import "./SeatSelector.css";

function SeatSelector({ classroom, bookedSeats = [], onSeatsSelected }) {
  const [selectedSeats, setSelectedSeats] = useState([]);

  // Calculate seats per row and create a grid layout
  const seatLayout = useMemo(() => {
    if (!classroom?.capacity) return [];
    const capacity = classroom.capacity;
    const seatsPerRow = Math.ceil(Math.sqrt(capacity));
    const rows = Math.ceil(capacity / seatsPerRow);
    
    const layout = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < seatsPerRow; c++) {
        const seatNumber = r * seatsPerRow + c + 1;
        if (seatNumber <= capacity) {
          row.push(seatNumber);
        }
      }
      layout.push(row);
    }
    return layout;
  }, [classroom?.capacity]);

  const toggleSeat = (seatNumber) => {
    if (bookedSeats.includes(seatNumber)) {
      return; // Can't select a booked seat
    }
    setSelectedSeats((prev) => {
      const newSelected = prev.includes(seatNumber)
        ? prev.filter((s) => s !== seatNumber)
        : [...prev, seatNumber];
      
      onSeatsSelected(newSelected);
      return newSelected;
    });
  };

  const clearSeats = () => {
    setSelectedSeats([]);
    onSeatsSelected([]);
  };

  return (
    <div className="seat-selector">
      <div className="seat-selector-header">
        <h4>Select Seats</h4>
        <p className="seat-selector-subtitle">Room {classroom?.roomNumber} • Capacity: {classroom?.capacity}</p>
      </div>

      <div className="seat-selector-legend">
        <div className="seat-selector-legend-item">
          <span className="seat-selector-seat seat-selector-seat-available"></span>
          <span>Available</span>
        </div>
        <div className="seat-selector-legend-item">
          <span className="seat-selector-seat seat-selector-seat-selected"></span>
          <span>Selected</span>
        </div>
        <div className="seat-selector-legend-item">
          <span className="seat-selector-seat seat-selector-seat-booked"></span>
          <span>Booked</span>
        </div>
      </div>

      <div className="seat-selector-grid-container">
        <div className="seat-selector-grid">
          {seatLayout.map((row, rowIndex) => (
            <div key={rowIndex} className="seat-selector-row">
              <span className="seat-selector-row-label">{String.fromCharCode(65 + rowIndex)}</span>
              <div className="seat-selector-row-seats">
                {row.map((seatNumber) => {
                  const isBooked = bookedSeats.includes(seatNumber);
                  const isSelected = selectedSeats.includes(seatNumber);
                  return (
                    <button
                      key={seatNumber}
                      className={`seat-selector-seat ${
                        isBooked
                          ? "seat-selector-seat-booked"
                          : isSelected
                          ? "seat-selector-seat-selected"
                          : "seat-selector-seat-available"
                      }`}
                      type="button"
                      disabled={isBooked}
                      onClick={() => toggleSeat(seatNumber)}
                      title={`Seat ${String.fromCharCode(65 + rowIndex)}${seatNumber}`}
                      aria-label={`Seat ${String.fromCharCode(65 + rowIndex)}${seatNumber} - ${
                        isBooked ? "Booked" : isSelected ? "Selected" : "Available"
                      }`}
                    >
                      {seatNumber}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="seat-selector-column-labels">
          {seatLayout[0]?.map((_, colIndex) => (
            <span key={colIndex} className="seat-selector-column-label">
              {colIndex + 1}
            </span>
          ))}
        </div>
      </div>

      <div className="seat-selector-footer">
        <p className="seat-selector-selected-count">
          {selectedSeats.length > 0 ? (
            <>
              <strong>{selectedSeats.length}</strong> seat{selectedSeats.length !== 1 ? "s" : ""} selected
            </>
          ) : (
            <span>No seats selected</span>
          )}
        </p>
        {selectedSeats.length > 0 && (
          <button className="link-btn" type="button" onClick={clearSeats}>
            Clear Selection
          </button>
        )}
      </div>
    </div>
  );
}

export default SeatSelector;
