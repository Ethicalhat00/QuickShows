import { Inngest } from "inngest";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";


// Create a client to send and receive events
export const inngest = new Inngest({ id: "movie-booking-system",
    eventKey:process.env.INNGEST_EVENT_KEY,
 });

// Ingest fun to save user data to db

const syncUserCreation=inngest.createFunction(
    {id:'sync-user-from-clerk'},
    {event:'clerk/user.created'},
    async ({event})=>{
        const {id,first_name,last_name,email_addresses,image_url}=event.data;
        const userData={
            _id:id,
            email:email_addresses[0].email_address,
            name:first_name + ' '+ last_name,
            image:image_url
        }
        await User.create(userData);

    }
)

// Ingest func to delete user form db

const syncUserDeletion=inngest.createFunction(
    {id:'delete-user-with-clerk'},
    {event:'clerk/user.deleted'},
    async ({event})=>{
       
       const {id}=event.data;

       await User.findByIdAndDelete(id);

    }
)

// Ingest func to upadte user form db

const syncUserUpdation=inngest.createFunction(
    {id:'update-user-from-clerk'},
    {event:'clerk/user.updated'},
    async ({event})=>{
          const {id,first_name,last_name,email_addresses,image_url}=event.data;
           const userData={
            _id:id,
            email:email_addresses[0].email_address,
            name:first_name + ' '+ last_name,
            image:image_url
        }
        await User.findByIdAndUpdate(id,userData);
       
      
    }
)


// ingest func to cancle nooking and relase stats of show after 10in of booking craeteed

const releaseSeatsAndDeleteBooking=inngest.createFunction(
    {id:'release-seats-delete-booking'},
    {event:"app/checkpayment"},
    async ({event,step}) => {
        const tenMinutesLater=new Date(Date.now() + 10 *60 *1000);
        await step.sleepUntil('wait-for-10-minutes',tenMinutesLater)
        await step.run('check-payment-status',async () => {
            const bookingId=event.data.bookingId;
            const booking=await Booking.findById(bookingId);


            // if paymetn is not mase relase seats and delete booking

            if(!booking.isPaid){
                const show=await Show.findById(booking.show);

                booking.bookedSeats.forEach((seat)=>{
                    delete show.occupiedSeats[seat]
                });
                show.markModified('occupiedSeats')
                await show.save()
                await Booking.findByIdAndDelete(booking._id)
            }
            
        })
        
    })

export const functions = [
    syncUserCreation,
    syncUserDeletion,
    syncUserUpdation,
    releaseSeatsAndDeleteBooking
];