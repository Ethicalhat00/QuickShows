// controllers/showController.js

import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import stripe from "stripe";

// ✅ Function to check availability of seats
const checkSeatsAvailability = async (showId, selectedSeats) => {
  try {
    const showData = await Show.findById(showId);

    if (!showData) return false;

    const occupiedSeats = showData.occupiedSeats || {};
    const isAnySeatTaken = selectedSeats.some((seat) => occupiedSeats[seat]);

    return !isAnySeatTaken;
  } catch (error) {
    console.log(error.message);
    return false;
  }
};

// ✅ Create booking
export const createBooking = async (req, res) => {
  try {
    const { userId } = req.auth(); // 🔥 Correct way
    const { showId, selectedSeats } = req.body;
    const { origin } = req.headers;

    // 1. Check if seats are available
    const isAvailable = await checkSeatsAvailability(showId, selectedSeats);
    if (!isAvailable) {
      return res.json({
        success: false,
        message: "Selected seats are not available",
      });
    }

    // 2. Get the show details
    const showData = await Show.findById(showId).populate("movie");
    if (!showData) {
      return res.json({ success: false, message: "Show not found" });
    }

    // 3. Create a new booking
    let booking = await Booking.create({
      user: userId,
      show: showId,
      amount: showData.showPrice * selectedSeats.length,
      bookedSeats: selectedSeats,
    });

    // 4. Mark seats as occupied
    selectedSeats.forEach((seat) => {
      showData.occupiedSeats[seat] = userId;
    });

    showData.markModified("occupiedSeats");
    await showData.save();

    //  stripe
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

    // ?line iotems
    const line_items = [
      {
        price_data: {
          currency: "inr",
          product_data: {
            name: showData.movie.title,
          },
          unit_amount: Math.floor(booking.amount) * 100,
        },
        quantity: 1,
      },
    ];
    const session = await stripeInstance.checkout.sessions.create({
      success_url: `${origin}/loading/my-bookings`,
      cancel_url: `${origin}/my-bookings`,
      line_items: line_items,
      mode: "payment",
      metadata: {
        bookingId: booking._id.toString(),
      },
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    });
    (booking.paymentLink = session.url), await booking.save();

    // 5. Response
    res.json({ success: true, url: session.url });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// ✅ Get occupied seats for a show
export const getOccupiedSeats = async (req, res) => {
  try {
    const { showId } = req.params;

    const showData = await Show.findById(showId);
    if (!showData) {
      return res.json({ success: false, message: "Show not found" });
    }

    const occupiedSeats = Object.keys(showData.occupiedSeats || {});
    res.json({ success: true, occupiedSeats });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};
