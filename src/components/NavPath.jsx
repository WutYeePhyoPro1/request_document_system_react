import { Link, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';

const NavPath = ({ segments }) => {
    const location = useLocation();
    const currentPath = location.pathname;

    return (
        <div className="text-gray-600 text-sm mb-5">
            {segments.map((segment, index) => {
                const isLast = index === segments.length - 1;
                const isCurrent = currentPath === segment.path;

                return (
                    <span key={index}>
                        {index > 0 && <span> / </span>}
                        {segment.path && !isCurrent ? (
                            <Link
                                to={segment.path}
                                className="hover:text-gray-800"
                            >
                                {segment.label}
                            </Link>
                        ) : (
                            <span className={isLast ? 'font-semibold' : ''}>
                                {segment.label}
                            </span>
                        )}
                    </span>
                );
            })}
        </div>
    );
};

NavPath.propTypes = {
    segments: PropTypes.arrayOf(
        PropTypes.shape({
            path: PropTypes.string,
            label: PropTypes.string.isRequired,
        })
    ).isRequired,
};

export default NavPath;