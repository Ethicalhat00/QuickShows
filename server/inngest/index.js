import { Inngest } from "inngest";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import sendEmail from "../configs/nodeMailer.js";

// Create a client to send and receive events
export const inngest = new Inngest({
  id: "movie-booking-system",
  eventKey: process.env.INNGEST_EVENT_KEY,
});

// Ingest fun to save user data to db

const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } =
      event.data;
    const userData = {
      _id: id,
      email: email_addresses[0].email_address,
      name: first_name + " " + last_name,
      image: image_url,
    };
    await User.create(userData);
  }
);

// Ingest func to delete user form db

const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-with-clerk" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    const { id } = event.data;

    await User.findByIdAndDelete(id);
  }
);

// Ingest func to upadte user form db

const syncUserUpdation = inngest.createFunction(
  { id: "update-user-from-clerk" },
  { event: "clerk/user.updated" },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } =
      event.data;
    const userData = {
      _id: id,
      email: email_addresses[0].email_address,
      name: first_name + " " + last_name,
      image: image_url,
    };
    await User.findByIdAndUpdate(id, userData);
  }
);

// ingest func to cancle nooking and relase stats of show after 10in of booking craeteed

const releaseSeatsAndDeleteBooking = inngest.createFunction(
  { id: "release-seats-delete-booking" },
  { event: "app/checkpayment" },
  async ({ event, step }) => {
    const tenMinutesLater = new Date(Date.now() + 10 * 60 * 1000);
    await step.sleepUntil("wait-for-10-minutes", tenMinutesLater);
    await step.run("check-payment-status", async () => {
      const bookingId = event.data.bookingId;
      const booking = await Booking.findById(bookingId);

      // if paymetn is not mase relase seats and delete booking

      if (!booking.isPaid) {
        const show = await Show.findById(booking.show);

        booking.bookedSeats.forEach((seat) => {
          delete show.occupiedSeats[seat];
        });
        show.markModified("occupiedSeats");
        await show.save();
        await Booking.findByIdAndDelete(booking._id);
      }
    });
  }
);

// inngest func tio send a aemail user book a dhow

const sendBookingConfirmEmail = inngest.createFunction(
  { id: "send-booking-confirmation-email" },
  { event: "app/show.booked" },
  async ({ event, step }) => {
    try {
      console.log("Incoming event data:", event.data);

      const { bookingId } = event.data;
      const booking = await Booking.findById(bookingId)
        .populate({
          path: "show",
          populate: { path: "movie", model: "Movie" },
        })
        .populate("user");

      if (!booking) {
        console.error("Booking not found for ID:", bookingId);
        return;
      }

      if (!booking.user || !booking.user.email) {
        console.error("User or user email not found for booking:", bookingId);
        return;
      }

      const emailBody = `
      <div style="font-family: Arial, sans-serif; text-align: center; background: #f9f9f9; padding: 20px;">
        <img src="https://your-cdn-or-image-link.com/ticket-confirmed-banner.png" 
             alt="Booking Confirmed" 
             style="max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 20px;" />

        <img src="${booking.show.movie.posterUrl}" 
             alt="${booking.show.movie.title}" 
             style="width: 200px; height: auto; border-radius: 10px; margin-bottom: 15px;" />

        <h2 style="color: #222;">${booking.show.movie.title}</h2>

        <p style="font-size: 14px; color: #555;">
          <strong>Date:</strong> ${new Date(booking.show.showDateTime).toLocaleDateString("en-US", { timeZone: "Asia/Kolkata" })} <br/>
          <strong>Time:</strong> ${new Date(booking.show.showDateTime).toLocaleTimeString("en-US", { timeZone: "Asia/Kolkata" })} <br/>
          <strong>Seats:</strong> ${booking.bookedSeats.join(", ")}
        </p>

        <div style="margin: 20px 0;">
          <span style="display: inline-block; padding: 12px 20px; background: #e50914; color: #fff; font-weight: bold; border-radius: 6px;">
            Paid: ₹${booking.amount}
          </span>
        </div>

        <p style="color: #666;">Enjoy your movie! 🍿</p>
        <p style="font-size: 12px; color: #aaa;">QuickShows © ${new Date().getFullYear()}</p>
      </div>
      `;

      const response = await sendEmail({
        to: booking.user.email,
        subject: `🎟️ Ticket Confirmed: "${booking.show.movie.title}"`,
        body: emailBody,
      });

      console.log("Booking confirmation email sent:", response?.messageId);
    } catch (err) {
      console.error("Error sending booking confirmation email:", err);
    }
  }
);



export const functions = [
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdation,
  releaseSeatsAndDeleteBooking,
  sendBookingConfirmEmail,
];
