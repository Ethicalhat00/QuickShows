import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { MenuIcon, SearchIcon, TicketPlus, XIcon } from "lucide-react";
import { useClerk, UserButton, useUser } from "@clerk/clerk-react";
import { useAppContext } from "../context/AppContext";

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUser();
  const { openSignIn } = useClerk();
  const navigate = useNavigate();
  const { favoriteMovies } = useAppContext();

  return (
    <div className="fixed top-0 left-0 z-50 w-full flex items-center justify-between px-6 md:px-16 lg:px-36 py-5 bg-black/60 backdrop-blur">
      {/* Logo */}
      <Link className="max-md:flex-1" to="/">
        <img src={assets.logo} alt="logo" className="w-36 h-auto" />
      </Link>

      {/* Mobile Menu */}
      <div
        className={`
          fixed top-0 left-0 h-screen w-3/4 bg-black/90 backdrop-blur 
          flex flex-col items-center justify-center gap-8 text-lg font-medium 
          transform transition-transform duration-300 z-40
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:static md:flex md:flex-row md:h-auto md:w-auto md:bg-transparent md:translate-x-0
        `}
      >
        {/* Close Button */}
        <XIcon
          onClick={() => setIsOpen(false)}
          className="md:hidden absolute top-6 right-6 w-6 h-6 cursor-pointer text-white"
        />

        <Link
          onClick={() => {
            scrollTo(0, 0);
            setIsOpen(false);
          }}
          to="/"
        >
          Home
        </Link>
        <Link
          onClick={() => {
            scrollTo(0, 0);
            setIsOpen(false);
          }}
          to="/movies"
        >
          Movies
        </Link>
        <Link
          onClick={() => {
            scrollTo(0, 0);
            setIsOpen(false);
          }}
          to="/"
        >
          Theaters
        </Link>
        <Link
          onClick={() => {
            scrollTo(0, 0);
            setIsOpen(false);
          }}
          to="/"
        >
          Releases
        </Link>
        {favoriteMovies.length > 0 && (
          <Link
            onClick={() => {
              scrollTo(0, 0);
              setIsOpen(false);
            }}
            to="/favorite"
          >
            Favorites
          </Link>
        )}
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-8">
        <SearchIcon className="max-md:hidden w-6 h-6 cursor-pointer" />
        {!user ? (
          <button
            onClick={openSignIn}
            className="px-4 py-1 sm:py-2 bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer"
          >
            Login
          </button>
        ) : (
          <UserButton>
            <UserButton.MenuItems>
              <UserButton.Action
                label="My Bookings"
                labelIcon={<TicketPlus width={15} />}
                onClick={() => navigate("/my-bookings")}
              />
            </UserButton.MenuItems>
          </UserButton>
        )}
      </div>

      {/* Hamburger Menu */}
      <MenuIcon
        onClick={() => setIsOpen(true)}
        className="max-md:ml-4 md:hidden w-8 h-8 cursor-pointer"
      />
    </div>
  );
};

export default NavBar;
