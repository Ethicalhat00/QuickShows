import axios from "axios";
import Movie from "../models/Movie.js";
import Show from "../models/Show.js";

// to get noe playing movies
export const getNowPlayingMovies = async (req, res) => {
  try {
    const { data } = await axios.get(
      "https://api.themoviedb.org/3/movie/now_playing",
      {
        headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
      }
    );

    const movies = data.results;
    res.json({ success: true, movies: movies });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// to add new show to dab
export const addShow = async (req, res) => {
  try {
    const { userId } = req.auth(); // ✅ fix for Clerk
    const { movieId, showsInput, showPrice } = req.body;

    const showInput = showsInput || []; // fallback

    let movie = await Movie.findById(movieId);

    if (!movie) {
      // fetch movie details & credits from TMDB
      const [movieDetailsResponse, movieCreditsResponse] = await Promise.all([
        axios.get(`https://api.themoviedb.org/3/movie/${movieId}`, {
          headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
        }),
        axios.get(`https://api.themoviedb.org/3/movie/${movieId}/credits`, {
          headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
        }),
      ]);

      const movieApiData = movieDetailsResponse.data;
      const movieCreditsData = movieCreditsResponse.data;

      const movieDetails = {
        _id: movieId,
        title: movieApiData.title,
        overview: movieApiData.overview,
        poster_path: movieApiData.poster_path,
        backdrop_path: movieApiData.backdrop_path,
        genres: movieApiData.genres,
        casts: movieCreditsData.cast,
        release_date: movieApiData.release_date,
        original_language: movieApiData.original_language,
        tagline: movieApiData.tagline || "",
        vote_average: movieApiData.vote_average,
        runtime: movieApiData.runtime,
      };

      // save movie in DB
      movie = await Movie.create(movieDetails);
    }
   

    // ✅ Build shows safely
    const showsToCreate = [];

    if (Array.isArray(showInput)) {
      showInput.forEach((show) => {
        if (!show.date || !Array.isArray(show.time)) return;

        show.time.forEach((time) => {
          const dateTimeString = `${show.date}T${time}`;
          showsToCreate.push({
            movie: movieId,
            showDateTime: new Date(dateTimeString),
            showPrice,
            occupiedSeats: {},
          });
        });
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid input: showInput must be an array",
      });
    }

    if (showsToCreate.length > 0) {
      await Show.insertMany(showsToCreate);
    }

    res.json({ success: true, message: "Show Added successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// api toget all shows from db

export const getShows = async (req, res) => {
  try {
    const shows = await Show.find({
      showDateTime: { $gte: new Date() },
    })
      .populate("movie")
      .sort({ showDateTime: 1 });

    // Use a Map to keep only one show per movie
    const uniqueMoviesMap = new Map();

    shows.forEach((show) => {
      if (!uniqueMoviesMap.has(show.movie._id.toString())) {
        uniqueMoviesMap.set(show.movie._id.toString(), show.movie);
      }
    });

    res.json({ success: true, shows: Array.from(uniqueMoviesMap.values()) });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// api to get the single show from db

export const getShow = async (req, res) => {
  try {
    const { movieId } = req.params;
    // get all upcoming moviue
    const shows = await Show.find({
      movie: movieId,
      showDateTime: { $gte: new Date() },
    });

    const movie = await Movie.findById(movieId);
    const dateTime = {};
    shows.forEach((show) => {
      const date = show.showDateTime.toISOString().split("T")[0];

      if (!dateTime[date]) {
        dateTime[date] = [];
      }
      dateTime[date].push({ time: show.showDateTime, showId: show._id });
    });

    res.json({ success: true, movie, dateTime });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
