import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Heart, PlayCircle, StarIcon } from "lucide-react";
import BlurCircle from "../components/BlurCircle";
import timeFormat from "../lib/timeFormat";
import DateSelect from "../components/DateSelect";
import MovieCard from "../components/MovieCard";
import Loading from "../components/Loading";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";

const MovieDetails = () => {
  const { id } = useParams();
  const [show, setShow] = useState(null);
  const navigate = useNavigate();
  const {
    shows,
    axios,
    getToken,
    favoriteMovies,
    fetchFavoriteMovies,
    image_base_url,
    user,
  } = useAppContext();

  const getShow = async () => {
    try {
      const { data } = await axios.get(`/api/show/${id}`);

      if (data.success) {
        setShow(data);
      }
    } catch (error) {
      console.log(error);
    }
  };
  const handleFavorite = async () => {
    try {
      if (!user) return toast.error("please login to proceed");

      const { data } = await axios.post(
        "/api/user/update-favorite",
        { movieId: id },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );

      if (data.success) {
        await fetchFavoriteMovies();
        toast.success(data.message);
      }
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    getShow();
    window.scrollTo(0, 0);
  }, [id]);

  return show ? (
    <div className="px-6 md:px-16 lg:px-40 pt-30 md:pt-50">
      {/* Poster + details */}
      <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto">
        <img
          src={image_base_url + show.movie.poster_path}
          alt={show.movie.title}
          className="max-md:mx-auto rounded-xl h-104 max-w-70 object-cover"
        />

        <div className="relative flex flex-col gap-3">
          <BlurCircle top="-100px" left="-100px" />
          <p className="text-primary uppercase">ENGLISH</p>
          <h1 className="text-4xl font-semibold max-w-96 text-balance">
            {show.movie.title}
          </h1>

          <div className="flex items-center gap-2 text-gray-300">
            <StarIcon className="w-5 h-5 text-primary fill-primary" />
            <span>{show.movie.vote_average.toFixed(1)} / 10 User Rating</span>
          </div>

          <p className="text-gray-400 mt-2 text-sm leading-tight max-w-xl">
            {show.movie.overview}
          </p>

          <p className="text-gray-300 text-sm">
            {timeFormat(show.movie.runtime)} •{" "}
            {show.movie.genres.map((genre) => genre.name).join(", ")} •{" "}
            {show.movie.release_date.split("-")[0]}
          </p>

          <div className="flex items-center flex-wrap gap-4 mt-4">
            <button className="flex items-center gap-2 px-7 py-3 text-sm bg-gray-800 hover:bg-gray-900 transition rounded-md font-medium cursor-pointer active:scale-95">
              <PlayCircle className="w-5 h-5" />
              Watch Trailer
            </button>
            <a
              className="px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-md font-medium cursor-pointer active:scale-95"
              href="#dateSelect"
            >
              Buy Tickets
            </a>
            <button
              onClick={handleFavorite}
              className="bg-gray-700 p-2.5 rounded-full transition cursor-pointer active:scale-95"
            >
              <Heart
                className={`w-5 h-5 ${
                  favoriteMovies.find(movie => movie._id === id)
                    ? "fill-primary text-primary"
                    : ""
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Cast section */}
      <div className="max-w-6xl mx-auto mt-20">
        <p className="text-lg font-medium">Your Favorite Cast</p>
        <div className="overflow-x-auto no-scrollbar mt-8 pb-4">
          <div className="inline-flex  gap-4  px-4">
            {show.movie.casts.slice(0, 12).map((cast, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center text-center scroll-item"
              >
                <img
                  src={image_base_url + cast.profile_path}
                  alt={cast.name}
                  className="rounded-full h-20 md:h-24 w-20 md:w-24 object-cover"
                />
                <p className="mt-2 text-sm">{cast.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <DateSelect dateTime={show.dateTime} id={id} />

      <p className="text-lg font-medium mt-20 mb-8">You May Also Like</p>

      <div className="flex flex-wrap max-sm:justify-center gap-8">
        {shows.slice(0, 4).map((movie, idx) => (
          <MovieCard key={idx} movie={movie} />
        ))}
      </div>

      <div className="flex justify-center mt-20">
        <button
          className="px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-md font-medium cursor-pointer"
          onClick={() => {
            navigate("/movies");
            scrollTo(0, 0);
          }}
        >
          Show More
        </button>
      </div>
    </div>
  ) : (
    <Loading />
  );
};

export default MovieDetails;
