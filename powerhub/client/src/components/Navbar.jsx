import { Link, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-white shadow-lg">
            <div className="max-w-6xl mx-auto px-4">
                <div className="flex justify-between">
                    <div className="flex space-x-7">
                        <div>
                            <Link to="/" className="flex items-center py-4 px-2">
                                <span className="font-semibold text-gray-500 text-lg">
                                    FitnessApp
                                </span>
                            </Link>
                        </div>
                        <div className="hidden md:flex items-center space-x-1">
                            <Link
                                to="/"
                                className="py-4 px-2 text-green-500 border-b-4 border-green-500 font-semibold "
                            >
                                Home
                            </Link>
                            <Link
                                to="/workouts"
                                className="py-4 px-2 text-gray-500 font-semibold hover:text-green-500 transition duration-300"
                            >
                                Workouts
                            </Link>
                            <Link
                                to="/scan"
                                className="py-4 px-2 text-gray-500 font-semibold hover:text-green-500 transition duration-300"
                            >
                                Scan Food
                            </Link>
                            <Link
                                to="/scan/history"
                                className="py-4 px-2 text-gray-500 font-semibold hover:text-green-500 transition duration-300"
                            >
                                History
                            </Link>

                            {user && (
                                <Link
                                    to="/diet/dashboard"
                                    className="py-4 px-2 text-gray-500 font-semibold hover:text-green-500 transition duration-300"
                                >
                                    Diet Dashboard
                                </Link>
                            )}
                        </div>
                    </div>
                    <div className="hidden md:flex items-center space-x-3 ">
                        {user ? (
                            <>
                                <span className="py-2 px-2 font-medium text-gray-500">
                                    Hello, {user.name}
                                </span>
                                <button
                                    onClick={handleLogout}
                                    className="py-2 px-2 font-medium text-white bg-red-500 rounded hover:bg-red-400 transition duration-300"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="py-2 px-2 font-medium text-gray-500 hover:text-green-500 transition duration-300"
                                >
                                    Log In
                                </Link>
                                <Link
                                    to="/register"
                                    className="py-2 px-2 font-medium text-white bg-green-500 rounded hover:bg-green-400 transition duration-300"
                                >
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
