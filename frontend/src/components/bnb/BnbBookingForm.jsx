// frontend/src/components/bnb/BnbBookingForm.jsx
import { useState, useEffect } from "react";
import { X, Calendar, Users, DollarSign, AlertCircle } from "lucide-react";
import Card from "../ui/Card";
import paymentService from "../../services/paymentService";
import tenantService from "../../services/tenantService";

const BnbBookingForm = ({
  onSubmit,
  onCancel,
  unitId,
  unitDetails,
  tenantOptions = [],
}) => {
  const [formData, setFormData] = useState({
    checkIn: "",
    checkOut: "",
    tenantId: "",
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    nightlyRate: 0,
    totalAmount: 0,
    paymentMethod: "card",
    notes: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [availabilityData, setAvailabilityData] = useState(null);
  const [totalNights, setTotalNights] = useState(0);
  const [createNewTenant, setCreateNewTenant] = useState(false);

  useEffect(() => {
    if (unitId) {
      loadBnbCalendar();
    }
  }, [unitId]);

  useEffect(() => {
    if (unitDetails) {
      setFormData((prev) => ({
        ...prev,
        nightlyRate: unitDetails.nightlyRate || 0,
      }));
    }
  }, [unitDetails]);

  useEffect(() => {
    calculateTotalAmount();
  }, [formData.checkIn, formData.checkOut, formData.nightlyRate]);

  const loadBnbCalendar = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch BnB calendar data including booked dates
      const calendarData = await paymentService.getBnbCalendar(unitId);
      setAvailabilityData(calendarData);

      // Set default nightly rate from unit settings
      setFormData((prev) => ({
        ...prev,
        nightlyRate: calendarData.unitDetails.nightlyRate || prev.nightlyRate,
      }));
    } catch (err) {
      console.error("Error loading BnB calendar:", err);
      setError("Failed to load availability calendar");
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalAmount = () => {
    if (!formData.checkIn || !formData.checkOut) return;

    const checkIn = new Date(formData.checkIn);
    const checkOut = new Date(formData.checkOut);

    // Calculate total nights
    const timeDiff = checkOut.getTime() - checkIn.getTime();
    const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (nights <= 0) {
      setError("Check-out date must be after check-in date");
      setTotalNights(0);
      setFormData((prev) => ({
        ...prev,
        totalAmount: 0,
      }));
      return;
    }

    setTotalNights(nights);

    // Calculate total amount based on nightly rate
    // Can be adjusted based on weekly/monthly discounts
    let totalAmount = nights * formData.nightlyRate;

    // Apply weekly discount if stay is 7+ nights
    if (nights >= 7 && unitDetails?.weeklyRate) {
      const weeksCount = Math.floor(nights / 7);
      const remainingDays = nights % 7;

      totalAmount =
        weeksCount * unitDetails.weeklyRate +
        remainingDays * formData.nightlyRate;
    }

    // Apply monthly discount if stay is 30+ nights
    if (nights >= 30 && unitDetails?.monthlyRate) {
      const monthsCount = Math.floor(nights / 30);
      const remainingDays = nights % 30;

      totalAmount =
        monthsCount * unitDetails.monthlyRate +
        remainingDays * formData.nightlyRate;
    }

    setFormData((prev) => ({
      ...prev,
      totalAmount: totalAmount,
    }));
  };

  const isDateBooked = (date) => {
    if (!availabilityData || !availabilityData.occupiedDates) return false;

    const checkDate = new Date(date);
    return availabilityData.occupiedDates.some((booking) => {
      const startDate = new Date(booking.startDate);
      const endDate = new Date(booking.endDate);
      return checkDate >= startDate && checkDate < endDate;
    });
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;

    // Don't allow selection of booked dates
    if (name === "checkIn" || name === "checkOut") {
      if (isDateBooked(value)) {
        setError(
          `This date (${new Date(
            value
          ).toLocaleDateString()}) is already booked`
        );
        return;
      }
    }

    setFormData({
      ...formData,
      [name]: value,
    });

    setError(""); // Clear any existing errors
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (!formData.checkIn || !formData.checkOut) {
      setError("Please select check-in and check-out dates");
      return;
    }

    if (
      createNewTenant &&
      (!formData.guestName || !formData.guestEmail || !formData.guestPhone)
    ) {
      setError("Please provide guest details");
      return;
    }

    if (!createNewTenant && !formData.tenantId) {
      setError("Please select a tenant");
      return;
    }

    if (formData.totalAmount <= 0) {
      setError("Total amount must be greater than zero");
      return;
    }

    try {
      setLoading(true);

      let tenantId = formData.tenantId;

      // Create new tenant if selected
      if (createNewTenant) {
        const newTenant = {
          firstName: formData.guestName.split(" ")[0] || formData.guestName,
          lastName: formData.guestName.split(" ").slice(1).join(" ") || "",
          email: formData.guestEmail,
          phone: formData.guestPhone,
          unitId: unitId,
          propertyId: unitDetails.propertyId,
          status: "active",
        };

        const createdTenant = await tenantService.createTenant(newTenant);
        tenantId = createdTenant._id;
      }

      // Format booking data
      const bookingData = {
        unitId: unitId,
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        tenantId: tenantId,
        amount: formData.totalAmount,
        nightlyRate: formData.nightlyRate,
        totalNights: totalNights,
        paymentMethod: formData.paymentMethod,
        type: "bnb",
        description: `BnB booking from ${new Date(
          formData.checkIn
        ).toLocaleDateString()} to ${new Date(
          formData.checkOut
        ).toLocaleDateString()}${formData.notes ? `: ${formData.notes}` : ""}`,
      };

      await onSubmit(bookingData);
    } catch (err) {
      console.error("Error saving booking:", err);
      setError(err.message || "Failed to save booking");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-primary-600" />
          <h2 className="text-xl font-medium">Create BnB Booking</h2>
        </div>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-500"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Check-in Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="checkIn"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              value={formData.checkIn}
              onChange={handleDateChange}
              min={new Date().toISOString().split("T")[0]}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Check-out Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="checkOut"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              value={formData.checkOut}
              onChange={handleDateChange}
              min={formData.checkIn || new Date().toISOString().split("T")[0]}
              required
            />
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center mt-1 mb-4">
              <input
                id="createNewTenant"
                name="createNewTenant"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                checked={createNewTenant}
                onChange={() => setCreateNewTenant(!createNewTenant)}
              />
              <label
                htmlFor="createNewTenant"
                className="ml-2 block text-sm text-gray-700"
              >
                Create new guest (for walk-in bookings)
              </label>
            </div>
          </div>

          {createNewTenant ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Guest Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="guestName"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  value={formData.guestName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Guest Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="guestEmail"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  value={formData.guestEmail}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Guest Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="guestPhone"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  value={formData.guestPhone}
                  onChange={handleChange}
                  required
                />
              </div>
            </>
          ) : (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Select Tenant <span className="text-red-500">*</span>
              </label>
              <select
                name="tenantId"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={formData.tenantId}
                onChange={handleChange}
                required={!createNewTenant}
              >
                <option value="">-- Select Tenant --</option>
                {tenantOptions.map((tenant) => (
                  <option key={tenant._id} value={tenant._id}>
                    {tenant.firstName} {tenant.lastName} ({tenant.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nightly Rate (KES) <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">KES</span>
              </div>
              <input
                type="number"
                name="nightlyRate"
                className="pl-12 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={formData.nightlyRate}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Total Amount (KES)
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">KES</span>
              </div>
              <input
                type="number"
                name="totalAmount"
                className="pl-12 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-gray-50"
                value={formData.totalAmount}
                onChange={handleChange}
                readOnly
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {totalNights} night{totalNights !== 1 ? "s" : ""} at KES{" "}
              {formData.nightlyRate} per night
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Payment Method
            </label>
            <select
              name="paymentMethod"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              value={formData.paymentMethod}
              onChange={handleChange}
            >
              <option value="card">Card</option>
              <option value="cash">Cash</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              name="notes"
              rows="3"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any additional information about this booking"
            />
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-md">
          <div className="flex items-center">
            <Calendar className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-600">
              Booking Summary
            </span>
          </div>
          <div className="mt-2 text-sm text-blue-600">
            <p>
              Check-in:{" "}
              {formData.checkIn
                ? new Date(formData.checkIn).toLocaleDateString()
                : "Not selected"}
            </p>
            <p>
              Check-out:{" "}
              {formData.checkOut
                ? new Date(formData.checkOut).toLocaleDateString()
                : "Not selected"}
            </p>
            <p>
              Duration: {totalNights} night{totalNights !== 1 ? "s" : ""}
            </p>
            <p>Total Amount: KES {formData.totalAmount.toLocaleString()}</p>
          </div>
        </div>

        <div className="flex justify-end space-x-4 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            disabled={loading}
          >
            {loading ? "Processing..." : "Create Booking"}
          </button>
        </div>
      </form>
    </Card>
  );
};

export default BnbBookingForm;
