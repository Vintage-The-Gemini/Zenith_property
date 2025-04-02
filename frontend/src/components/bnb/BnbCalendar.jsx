// frontend/src/components/bnb/BnbCalendar.jsx
import { useState, useEffect } from "react";
import { Calendar, Clock, Users, AlertCircle, Plus } from "lucide-react";
import Card from "../ui/Card";
import bnbService from "../../services/bnbService";
import BnbBookingForm from "./BnbBookingForm";
import LoadingSpinner from "../common/LoadingSpinner";

const BnbCalendar = ({ unitId, onBookingCreated }) => {
  const [calendarData, setCalendarData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [monthDays, setMonthDays] = useState([]);
  const [bookingsByDay, setBookingsByDay] = useState({});

  useEffect(() => {
    if (unitId) {
      loadCalendarData();
    }
  }, [unitId]);

  useEffect(() => {
    generateCalendarDays(currentMonth, currentYear);
  }, [currentMonth, currentYear, calendarData]);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await bnbService.getBnbCalendar(unitId);
      setCalendarData(data);

      // Organize bookings by day for easy retrieval
      const bookingMap = {};
      if (data.occupiedDates) {
        data.occupiedDates.forEach((booking) => {
          const startDate = new Date(booking.startDate);
          const endDate = new Date(booking.endDate);

          // For each day in the booking range, add to the booking map
          let currentDate = new Date(startDate);
          while (currentDate < endDate) {
            const dateKey = currentDate.toISOString().split("T")[0];
            if (!bookingMap[dateKey]) {
              bookingMap[dateKey] = [];
            }
            bookingMap[dateKey].push(booking);

            // Move to next day
            currentDate.setDate(currentDate.getDate() + 1);
          }
        });
      }

      setBookingsByDay(bookingMap);
    } catch (err) {
      console.error("Error loading BnB calendar:", err);
      setError("Failed to load calendar data");
    } finally {
      setLoading(false);
    }
  };

  const generateCalendarDays = (month, year) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Get the day of the week for the first day (0-6, where 0 is Sunday)
    const firstDayIndex = firstDay.getDay();

    // Generate array of days including padding for previous and next months
    const days = [];

    // Add days from previous month for padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const date = new Date(year, month - 1, day);
      days.push({
        date,
        day,
        isCurrentMonth: false,
        isToday: false,
        hasBooking: isDateBooked(date),
      });
    }

    // Add days for current month
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();

      days.push({
        date,
        day: i,
        isCurrentMonth: true,
        isToday,
        hasBooking: isDateBooked(date),
      });
    }

    // Add days from next month to complete the calendar grid (6 rows x 7 days)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        day: i,
        isCurrentMonth: false,
        isToday: false,
        hasBooking: isDateBooked(date),
      });
    }

    setMonthDays(days);
  };

  const isDateBooked = (date) => {
    if (!calendarData) return false;

    const dateKey = date.toISOString().split("T")[0];
    return bookingsByDay[dateKey] && bookingsByDay[dateKey].length > 0;
  };

  const getBookingsForDay = (date) => {
    const dateKey = date.toISOString().split("T")[0];
    return bookingsByDay[dateKey] || [];
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setShowBookingForm(true);
  };

  const handleCreateBooking = async (bookingData) => {
    try {
      setLoading(true);
      const result = await bnbService.createBnbBooking(bookingData);
      setShowBookingForm(false);
      loadCalendarData();
      if (onBookingCreated) {
        onBookingCreated(result);
      }
    } catch (err) {
      setError(err.message || "Failed to create booking");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !calendarData) {
    return <LoadingSpinner message="Loading BnB calendar..." />;
  }

  if (showBookingForm) {
    return (
      <BnbBookingForm
        unitId={unitId}
        unitDetails={calendarData?.unitDetails}
        onSubmit={handleCreateBooking}
        onCancel={() => setShowBookingForm(false)}
      />
    );
  }

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">BnB Booking Calendar</h3>
        <button
          onClick={() => setShowBookingForm(true)}
          className="inline-flex items-center px-3 py-1.5 text-sm text-white bg-primary-600 rounded-md hover:bg-primary-700"
        >
          <Plus className="h-4 w-4 mr-1" />
          New Booking
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {calendarData && (
        <div className="bg-blue-50 p-3 rounded-md mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-blue-700">Nightly Rate</p>
              <p className="text-lg font-semibold">
                KES {calendarData.unitDetails.nightlyRate.toLocaleString()}
              </p>
            </div>
            {calendarData.unitDetails.weeklyRate && (
              <div>
                <p className="text-sm font-medium text-blue-700">Weekly Rate</p>
                <p className="text-lg font-semibold">
                  KES {calendarData.unitDetails.weeklyRate.toLocaleString()}
                </p>
              </div>
            )}
            {calendarData.unitDetails.monthlyRate && (
              <div>
                <p className="text-sm font-medium text-blue-700">
                  Monthly Rate
                </p>
                <p className="text-lg font-semibold">
                  KES {calendarData.unitDetails.monthlyRate.toLocaleString()}
                </p>
              </div>
            )}
          </div>
          <div className="mt-2 flex items-center">
            <Clock className="h-4 w-4 text-blue-700 mr-1" />
            <span className="text-sm text-blue-700">
              Check-in: {calendarData.unitDetails.checkInTime} | Check-out:{" "}
              {calendarData.unitDetails.checkOutTime}
            </span>
          </div>
        </div>
      )}

      <div className="mb-4">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={handlePrevMonth}
            className="px-3 py-1 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50"
          >
            &lt; Prev
          </button>
          <h4 className="text-lg font-medium">
            {new Date(currentYear, currentMonth).toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}
          </h4>
          <button
            onClick={handleNextMonth}
            className="px-3 py-1 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50"
          >
            Next &gt;
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-gray-500 py-1"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {monthDays.map((day, index) => {
            const bookings = getBookingsForDay(day.date);
            const isDisabled = day.date < new Date(); // Can't book past days

            return (
              <div
                key={index}
                className={`
                  p-2 text-center border rounded-md cursor-pointer
                  ${
                    day.isCurrentMonth
                      ? "border-gray-300"
                      : "border-gray-200 bg-gray-50 text-gray-400"
                  } 
                  ${day.isToday ? "bg-blue-50 border-blue-300" : ""}
                  ${day.hasBooking ? "bg-red-50 border-red-200" : ""}
                  ${
                    isDisabled
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-gray-100"
                  }
                `}
                onClick={() =>
                  !isDisabled && !day.hasBooking && handleDateClick(day.date)
                }
              >
                <div className="font-medium">{day.day}</div>
                {bookings.length > 0 && (
                  <div className="mt-1 text-xs bg-red-200 text-red-800 rounded-full px-1 py-0.5">
                    Booked
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {loading && (
        <div className="text-center py-2 text-gray-500">
          Updating calendar...
        </div>
      )}
    </Card>
  );
};

export default BnbCalendar;
