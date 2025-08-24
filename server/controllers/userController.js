import { clerkClient } from "@clerk/express";
import Booking from "../models/Booking.js";
import Movie from "../models/Movie.js";

export const getUserBookings=async (req,res) => {

    try {
       const { userId } = req.auth();


        const bookings=await Booking.find({user:userId}).populate({
            path:"show",
            populate:{path:"movie"}
        }).sort({createdAt:-1})
        res.json({success:true,bookings})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message})
        
    }
    
}


// api controll to add fav movei in cler user metadat

export const updateFavorite = async (req, res) => {
  try {
    const { movieId } = req.body;
    const { userId } = req.auth();
    const user = await clerkClient.users.getUser(userId);

    // Initialize favorites array
    let favorites = user.privateMetadata.favorites || [];

    if (favorites.includes(movieId)) {
      // Remove from favorites
      favorites = favorites.filter(item => item !== movieId);
    } else {
      // Add to favorites
      favorites.push(movieId);
    }

    await clerkClient.users.updateUserMetadata(userId, { privateMetadata: { ...user.privateMetadata, favorites } });

    res.json({ success: true, message: "Favorite movies updated" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// 

export const getFavorites=async (req,res) => {

    try {
         const { userId } = req.auth();
        const user=await clerkClient.users.getUser(req.auth.userId)
        const favorites=user.privateMetadata.favorites;


        const movies=await Movie.find({_id: {$in : favorites}})
        res.json({success:true,movies})
    } catch (error) {
           console.log(error);
        res.json({success:false,message:error.message})
    }
    
}



