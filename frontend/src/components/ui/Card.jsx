import React from "react";

const Card = ({ children, className = "", onClick, ...rest }) => {
  return (
    <div
      className={`bg-white dark:bg-dark-primary-900 border border-light-primary-200 dark:border-dark-primary-700 shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}
      onClick={onClick}
      {...rest}
    >
      {children}
    </div>
  );
};

export default Card;
